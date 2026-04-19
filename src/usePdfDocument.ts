import { useEffect, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { OutlineEntry } from './types.js'

export interface PdfLoadProgress {
  loaded: number
  total: number
}

/**
 * Loads a pdf.js document and surfaces:
 *   - the document handle for downstream rendering
 *   - chapter outline (resolved page-by-page, in parallel)
 *   - download progress (rAF-coalesced)
 *
 * The consumer must have called `configurePdfWorker(...)` exactly once at
 * app startup — the package does NOT pin a worker URL because every host
 * bundler resolves worker assets differently (Vite `?url`, Webpack 5 asset
 * modules, esbuild-meta, plain CDN URL, etc.).
 */
export function usePdfDocument({
  src,
  initialPage,
  onReady,
}: {
  src: string
  initialPage: number
  onReady: (resolvedPage: number, totalPages: number) => void
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [document, setDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [outline, setOutline] = useState<OutlineEntry[]>([])
  const [progress, setProgress] = useState<PdfLoadProgress>({ loaded: 0, total: 0 })

  useEffect(() => {
    let cancelled = false
    // Streaming + range options:
    //  - rangeChunkSize: 256 KiB chunks balance request count vs. wasted bytes.
    //  - disableStream: false lets pdf.js consume the body as it arrives.
    //  - disableAutoFetch: true is the big perceived-speed win. Without it,
    //    pdf.js eagerly downloads every page in the background. With it, only
    //    the bytes needed for the current page get fetched, so first paint
    //    happens after a few hundred KB instead of after the whole file.
    //  - disableRange: false relies on the server sending Accept-Ranges and
    //    Content-Length. The optimize-pdf --lossless workflow linearises PDFs
    //    for exactly this case.
    const loadTask = pdfjsLib.getDocument({
      url: src,
      rangeChunkSize: 256 * 1024,
      disableStream: false,
      disableAutoFetch: true,
      disableRange: false,
    })

    // pdf.js fires onProgress for every range chunk (~120 calls on a 30 MB
    // file). Coalesce them through rAF so we re-render the loading UI at most
    // once per frame instead of once per chunk.
    let pendingProgress: PdfLoadProgress | null = null
    let progressFrame: number | null = null
    const flushProgress = () => {
      progressFrame = null
      if (cancelled || !pendingProgress) return
      setProgress(pendingProgress)
      pendingProgress = null
    }
    loadTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
      if (cancelled) return
      // pdf.js sometimes reports total=0 until the first range response arrives.
      // Keep total at 0 in that case so the UI can show an indeterminate state.
      pendingProgress = { loaded, total: total > 0 ? total : 0 }
      if (progressFrame === null) {
        progressFrame = requestAnimationFrame(flushProgress)
      }
    }

    loadTask.promise
      .then((document) => {
        if (cancelled) return

        setDocument(document)
        setNumPages(document.numPages)

        const resolvedPage = Math.max(1, Math.min(initialPage, document.numPages))
        onReady(resolvedPage, document.numPages)

        // Flip loading=false BEFORE the outline resolves. The outline can
        // require dozens of getPageIndex round-trips on a chaptered book and
        // none of it is needed for the first page render. The menu just
        // appears empty until the outline arrives a moment later.
        setError(null)
        setLoading(false)

        // Resolve in the background. Failures fall back to an empty outline
        // (most PDFs without bookmarks already do).
        loadOutline(document)
          .then((nextOutline) => {
            if (!cancelled) setOutline(nextOutline)
          })
          .catch(() => {
            if (!cancelled) setOutline([])
          })
      })
      .catch((loadError) => {
        if (cancelled) return
        console.error('PDF load error:', loadError)
        setError('Could not load PDF.')
        setLoading(false)
      })

    return () => {
      cancelled = true
      if (progressFrame !== null) cancelAnimationFrame(progressFrame)
      loadTask.destroy()
    }
  }, [src, initialPage, onReady])

  return {
    document,
    numPages,
    loading,
    error,
    outline,
    progress,
  }
}

async function loadOutline(doc: pdfjsLib.PDFDocumentProxy): Promise<OutlineEntry[]> {
  const outline = await doc.getOutline()
  if (!outline) return []

  const entries: OutlineEntry[] = []
  const seen = new Set<string>()

  // Resolve all items at one tree level in parallel rather than awaiting each
  // getPageIndex sequentially. A book with 80 chapters used to do 80 serial
  // round-trips; now they overlap.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function walk(items: Array<any>, depth: number) {
    const resolved = await Promise.all(
      items.map(async (item) => ({
        item,
        page: await resolveOutlinePage(doc, item.dest),
      })),
    )

    for (const { item, page } of resolved) {
      const title = item.title?.trim()
      if (page && title) {
        const key = `${page}:${title}`
        if (!seen.has(key)) {
          seen.add(key)
          entries.push({ title, page, depth })
        }
      }
      if (item.items?.length) {
        await walk(item.items, depth + 1)
      }
    }
  }

  await walk(outline, 0)
  return entries
}

async function resolveOutlinePage(
  doc: pdfjsLib.PDFDocumentProxy,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destination: any,
): Promise<number | null> {
  let resolvedDestination = destination

  if (typeof resolvedDestination === 'string') {
    resolvedDestination = await doc.getDestination(resolvedDestination)
  }

  if (!resolvedDestination || !Array.isArray(resolvedDestination) || resolvedDestination.length === 0) {
    return null
  }

  const firstTarget = resolvedDestination[0]
  if (typeof firstTarget === 'object' && firstTarget !== null) {
    try {
      return (await doc.getPageIndex(firstTarget)) + 1
    } catch {
      return null
    }
  }

  if (typeof firstTarget === 'number') {
    return firstTarget + 1
  }

  return null
}
