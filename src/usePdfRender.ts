import { useCallback, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// How long to wait after the frame stops resizing before re-rendering. The
// ResizeObserver fires for every pixel of a window resize / orientation change
// / sidebar toggle, and a full pdf.js render is expensive (cancel + decode +
// canvas blit). 120 ms is short enough to feel snappy and long enough to
// collapse a typical drag into one render.
const RESIZE_DEBOUNCE_MS = 120

// Pixel slop tolerated before a width change counts as "different". Browsers
// emit fractional widths and our scrollbar/gap math can wobble by a pixel
// without anything visibly changing.
const RESIZE_PIXEL_THRESHOLD = 1

// Supersampling: render the canvas at 1.5x device pixel ratio so the
// browser's downscale to CSS pixels uses a smoother filter than pdf.js's
// internal box filter. Without this, large near-uniform regions on art-book
// pages (e.g. white margins around an inset painting) show a faint grid in
// Chromium because pdf.js box-filters embedded 1500-2000 px PNGs straight
// down to canvas resolution.
//
// Targets:
//  - iPhone 15 Pro (DPR=3, ~393 CSS px wide):  3 * 1.5 = 4.5x effective
//    → ~1770 native px wide → ~10 MB canvas. Fits comfortably in the
//    mobile-Safari ~1 GB tab budget.
//  - MacBook Retina (DPR=2, reader column 800-1200 CSS px): 2 * 1.5 = 3x
//    effective → ~2400-3600 native px wide → 30-65 MB canvas at the wide
//    end. We clamp by a max-pixels budget below to keep this sane.
const SUPERSAMPLE_FACTOR = 1.5

// Maximum native canvas pixel count (width * height), no matter what the
// device DPR claims. Beyond this we silently lower the supersample factor
// rather than allocating arbitrarily large bitmaps.
//
// 12 megapixels = ~3000x4000, comfortably above what an iPhone 15 Pro or
// 16" MacBook Retina actually needs to display a fit-width PDF page, but
// well below the ~50 MB-per-page point where Safari starts thrashing on
// art books with 100+ pages cached.
const MAX_CANVAS_PIXELS = 12_000_000

export function usePdfRender({
  document,
  page,
  zoom,
  canvasRef,
  frameRef,
}: {
  document: pdfjsLib.PDFDocumentProxy | null
  page: number
  zoom: number
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  frameRef: React.RefObject<HTMLDivElement | null>
}) {
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null)
  const retryHandleRef = useRef<number | null>(null)
  // Holds the latest renderPage so the rAF retry inside renderPage can call
  // back into the current closure without forming a forward reference (the
  // react-hooks/immutability rule rejects naming `renderPage` inside its own
  // useCallback body).
  const renderPageRef = useRef<((pageNumber: number) => Promise<void>) | null>(null)

  // Most recently requested page. Lets us drop stale renders when the user
  // swipes through several pages faster than pdf.js can decode them.
  const targetPageRef = useRef(page)

  // Last width we actually rendered at, so we can ignore ResizeObserver noise
  // and unchanged re-render requests without doing the full pdf.js pipeline.
  const lastRenderedWidthRef = useRef(0)

  const renderPage = useCallback(async (pageNumber: number) => {
    const canvas = canvasRef.current
    const frame = frameRef.current
    if (!document || !canvas || !frame) return

    targetPageRef.current = pageNumber

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
      renderTaskRef.current = null
    }

    const pdfPage = await document.getPage(pageNumber)
    // The user may have swiped past us while getPage() was awaiting. Drop this
    // render entirely - the latest call's render task is what matters.
    if (targetPageRef.current !== pageNumber) return
    const baseViewport = pdfPage.getViewport({ scale: 1 })
    // Treat 0 as "no layout yet" rather than a falsy fallback trigger.
    // window.innerWidth here would over-scale the canvas when the frame is
    // narrower than the viewport (e.g. reader mounted in a 390px column on a
    // 1920px desktop). When no real width is available, skip and let the
    // ResizeObserver / rAF retry repaint at the right size.
    const measuredWidth = frame.clientWidth > 0
      ? frame.clientWidth
      : frame.getBoundingClientRect().width
    if (measuredWidth <= 0) {
      if (retryHandleRef.current !== null) {
        cancelAnimationFrame(retryHandleRef.current)
      }
      retryHandleRef.current = requestAnimationFrame(() => {
        retryHandleRef.current = null
        void renderPageRef.current?.(pageNumber)
      })
      return
    }
    if (retryHandleRef.current !== null) {
      cancelAnimationFrame(retryHandleRef.current)
      retryHandleRef.current = null
    }
    const fitScale = Math.min(measuredWidth / baseViewport.width, 4)
    const viewport = pdfPage.getViewport({ scale: fitScale * zoom })
    // Start from device DPR + supersample. See SUPERSAMPLE_FACTOR for why -
    // we trade a bigger canvas for the browser's high-quality downscale,
    // which dissolves the box-filter grid pdf.js otherwise leaves on
    // art-book white margins.
    const baseDpr = window.devicePixelRatio || 1
    let effectiveDpr = baseDpr * SUPERSAMPLE_FACTOR

    // Pixel-count budget: on a wide Retina monitor the naive supersample
    // would allocate 50+ MB per page. When the supersampled canvas would
    // exceed MAX_CANVAS_PIXELS, drop to the highest DPR that still fits.
    // Note this can land below baseDpr at extreme zoom levels - that's
    // still better than crashing the tab, and the page is still being
    // displayed at native DPR by the time it hits the screen because the
    // browser will then upscale. Worst case at huge zoom: text looks a
    // touch soft. Acceptable trade.
    const pageArea = viewport.width * viewport.height
    const pixelsAtEffective = pageArea * effectiveDpr * effectiveDpr
    if (pixelsAtEffective > MAX_CANVAS_PIXELS) {
      effectiveDpr = Math.sqrt(MAX_CANVAS_PIXELS / pageArea)
    }

    const targetCanvasWidth = Math.floor(viewport.width * effectiveDpr)
    const targetCanvasHeight = Math.floor(viewport.height * effectiveDpr)

    // Writing canvas.width / canvas.height clears the bitmap and forces a GPU
    // re-upload. Skip it when nothing changed (common when ResizeObserver
    // fires with the same width as last render).
    if (canvas.width !== targetCanvasWidth) canvas.width = targetCanvasWidth
    if (canvas.height !== targetCanvasHeight) canvas.height = targetCanvasHeight
    const cssWidth = `${viewport.width}px`
    const cssHeight = `${viewport.height}px`
    if (canvas.style.width !== cssWidth) canvas.style.width = cssWidth
    if (canvas.style.height !== cssHeight) canvas.style.height = cssHeight

    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(effectiveDpr, 0, 0, effectiveDpr, 0, 0)
    context.clearRect(0, 0, viewport.width, viewport.height)

    const task = pdfPage.render({ canvasContext: context, viewport })
    renderTaskRef.current = task

    try {
      await task.promise
      lastRenderedWidthRef.current = measuredWidth
    } catch (renderError: unknown) {
      if (
        renderError &&
        typeof renderError === 'object' &&
        'name' in renderError &&
        (renderError as { name: string }).name === 'RenderingCancelledException'
      ) {
        return
      }
      throw renderError
    } finally {
      if (renderTaskRef.current === task) renderTaskRef.current = null
    }
  }, [canvasRef, document, frameRef, zoom])

  // Keep the ref pointing at the current renderPage so the rAF retry above
  // always invokes the latest closure (correct document/zoom). Updating refs
  // during render is disallowed by react-hooks rules, so we sync via effect.
  useEffect(() => {
    renderPageRef.current = renderPage
  }, [renderPage])

  useEffect(() => {
    if (!document) return
    targetPageRef.current = page
    void renderPage(page)
  }, [document, page, renderPage])

  // Reset width tracking when the document or zoom changes - those are the
  // legitimate reasons to re-render at the same frame width.
  useEffect(() => {
    lastRenderedWidthRef.current = 0
  }, [document, zoom])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame || !document) return

    let debounceHandle: number | null = null

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      // contentBoxSize when available avoids layout thrash; fall back to
      // contentRect for older WebKit.
      const nextWidth = entry.contentBoxSize
        ? entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width
        : entry.contentRect.width

      if (
        lastRenderedWidthRef.current > 0 &&
        Math.abs(nextWidth - lastRenderedWidthRef.current) < RESIZE_PIXEL_THRESHOLD
      ) {
        return
      }

      if (debounceHandle !== null) clearTimeout(debounceHandle)
      debounceHandle = window.setTimeout(() => {
        debounceHandle = null
        void renderPage(targetPageRef.current)
      }, RESIZE_DEBOUNCE_MS)
    })
    observer.observe(frame)
    return () => {
      observer.disconnect()
      if (debounceHandle !== null) clearTimeout(debounceHandle)
    }
  }, [document, frameRef, renderPage])

  useEffect(() => {
    return () => {
      if (retryHandleRef.current !== null) {
        cancelAnimationFrame(retryHandleRef.current)
        retryHandleRef.current = null
      }
    }
  }, [])
}
