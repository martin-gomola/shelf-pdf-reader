import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { PdfCanvas } from './PdfCanvas.js'
import { PdfControls } from './PdfControls.js'
import { PdfOutlineMenu } from './PdfOutlineMenu.js'
import { usePdfDocument, type PdfLoadProgress } from './usePdfDocument.js'
import { usePdfNavigation } from './usePdfNavigation.js'
import { usePdfRender } from './usePdfRender.js'
import { formatBytes } from './formatBytes.js'
import { resolvePdfSrc, backgroundCachePdf } from './pdfCache.js'

export interface PdfViewerProps {
  /** URL the viewer loads from. May be a network URL, blob: URL, or data: URL. */
  src: string
  initialPage?: number
  /** Fires on user-driven page navigation. `numPages` is the document total
   * (0 if not yet loaded — won't happen for real user navigation). */
  onPageChange?: (page: number, numPages: number) => void
  bookTitle?: string
  onBack?: () => void
  /** Optional inline styles forwarded to the root `.pdf-reader` element. */
  style?: CSSProperties
  /** Optional extra class names appended to the root `.pdf-reader` element. */
  className?: string
  /**
   * Cache API cache name for PDF reopen acceleration. When set:
   *  - On open: checks the cache for a stored copy and loads it instantly
   *    via blob URL (no network, pdf.js LocalPdfManager).
   *  - After first load: silently fetches the full PDF into the cache so
   *    the next open is instant.
   *
   * The consumer's Service Worker must NOT intercept .pdf requests via
   * respondWith() — that blocks pdf.js range negotiation on cache misses.
   *
   * When omitted, no caching is performed (backward compatible).
   */
  cacheName?: string
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

export function PdfViewer({
  src,
  initialPage = 1,
  onPageChange,
  bookTitle,
  onBack,
  style,
  className,
  cacheName,
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)

  // When cacheName is set, resolve src from cache before handing it to
  // pdf.js. null = still resolving, string = ready.
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(cacheName ? null : src)
  const blobUrlRef = useRef<string | null>(null)
  const networkUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!cacheName) {
      networkUrlRef.current = src
      setResolvedSrc(src)
      return
    }
    let cancelled = false
    resolvePdfSrc(src, cacheName).then(({ src: resolved, blobUrl, fromCache }) => {
      if (cancelled) {
        if (blobUrl) URL.revokeObjectURL(blobUrl)
        return
      }
      blobUrlRef.current = blobUrl
      networkUrlRef.current = fromCache ? null : src
      setResolvedSrc(resolved)
      if (!fromCache) void backgroundCachePdf(src, cacheName)
    })
    return () => {
      cancelled = true
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [src, cacheName])

  const {
    page,
    numPages,
    zoom,
    pageInput,
    setZoom,
    setPageInput,
    goTo,
    syncFromDocument,
    commitPageInput,
  } = usePdfNavigation({ initialPage, onPageChange })

  const onReady = useCallback(
    (resolvedPage: number, totalPages: number) => syncFromDocument(resolvedPage, totalPages),
    [syncFromDocument],
  )

  const { document, loading, error, outline, progress } = usePdfDocument({
    src: resolvedSrc ?? '',
    initialPage,
    onReady,
    enabled: resolvedSrc !== null,
  })
  usePdfRender({
    document,
    page,
    zoom,
    canvasRef,
    frameRef,
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) setMenuOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [menuOpen])

  const toggleFocus = () => {
    setFocusMode((v) => !v)
    setMenuOpen(false)
  }

  if (resolvedSrc === null || loading) return <PdfLoading progress={progress} style={style} className={className} />
  if (error || numPages === 0) {
    return (
      <div className={`reader-loading${className ? ` ${className}` : ''}`} style={style}>
        <p className="error-text">{error ?? 'Could not load PDF.'}</p>
      </div>
    )
  }

  const rootClass = `pdf-reader${focusMode ? ' pdf-reader--focus' : ''}${className ? ` ${className}` : ''}`

  return (
    <div className={rootClass} style={style}>
      <button
        className="pdf-menu-toggle"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        <IconMenu />
      </button>

      <PdfOutlineMenu
        menuOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onBack={onBack}
        bookTitle={bookTitle}
        outline={outline}
        page={page}
        goTo={goTo}
      />

      <PdfCanvas
        canvasRef={canvasRef}
        frameRef={frameRef}
        isZoomed={zoom > 1}
        onTapPrevious={() => goTo(page - 1)}
        onTapNext={() => goTo(page + 1)}
      />

      <PdfControls
        focusMode={focusMode}
        page={page}
        numPages={numPages}
        pageInput={pageInput}
        zoom={zoom}
        onPrevious={() => goTo(page - 1)}
        onNext={() => goTo(page + 1)}
        onPageInputChange={setPageInput}
        onPageInputCommit={commitPageInput}
        onZoomOut={() => setZoom((currentZoom) => Math.max(0.5, Number((currentZoom - 0.25).toFixed(2))))}
        onZoomIn={() => setZoom((currentZoom) => Math.min(3, Number((currentZoom + 0.25).toFixed(2))))}
        onFitWidth={() => setZoom(1)}
        onToggleFocus={toggleFocus}
      />

      {focusMode && (
        <button className="pdf-focus-restore" onClick={() => setFocusMode(false)} aria-label="Show controls">
          <IconMenu />
        </button>
      )}
    </div>
  )
}

function PdfLoading({
  progress,
  style,
  className,
}: {
  progress: PdfLoadProgress
  style?: CSSProperties
  className?: string
}) {
  const hasTotal = progress.total > 0
  const percent = hasTotal ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : 0
  const statusLine = hasTotal
    ? `${percent}% · ${formatBytes(progress.loaded)} / ${formatBytes(progress.total)}`
    : progress.loaded > 0
      ? `${formatBytes(progress.loaded)} downloaded`
      : 'Connecting…'

  return (
    <div className={`reader-loading${className ? ` ${className}` : ''}`} style={style}>
      <p className="muted">Loading PDF…</p>
      <div
        className="pdf-load-progress"
        role="progressbar"
        aria-label="PDF download progress"
        aria-valuemin={0}
        aria-valuemax={hasTotal ? 100 : undefined}
        aria-valuenow={hasTotal ? percent : undefined}
      >
        <div
          className={`pdf-load-progress-bar${hasTotal ? '' : ' pdf-load-progress-bar--indeterminate'}`}
          style={hasTotal ? { width: `${percent}%` } : undefined}
        />
      </div>
      <p className="muted pdf-load-progress-text">{statusLine}</p>
    </div>
  )
}
