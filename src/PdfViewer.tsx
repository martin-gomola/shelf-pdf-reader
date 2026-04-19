import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { PdfCanvas } from './PdfCanvas.js'
import { PdfControls } from './PdfControls.js'
import { PdfOutlineMenu } from './PdfOutlineMenu.js'
import { usePdfDocument, type PdfLoadProgress } from './usePdfDocument.js'
import { usePdfNavigation } from './usePdfNavigation.js'
import { usePdfRender } from './usePdfRender.js'
import { getSwipeDecision } from './pdfSwipe.js'
import { formatBytes } from './formatBytes.js'

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
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const swipeStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    lastX: number
    lastY: number
  } | null>(null)
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
  const { document, loading, error, outline, progress } = usePdfDocument({
    src,
    initialPage,
    onReady: syncFromDocument,
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

  const resetSwipe = useCallback(() => {
    swipeStateRef.current = null
    setDragOffset(0)
    setIsSwiping(false)
  }, [])

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (menuOpen) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const target = event.target instanceof HTMLElement ? event.target : null
    if (target?.closest('button, input, select, textarea, a, label, [role="button"]')) return

    // When the frame has horizontal scroll headroom (page wider than viewport
    // because of zoom or a landscape spread), let native panning take over the
    // gesture entirely. Otherwise the swipe handler would steal horizontal
    // drags and the user could never reach the cropped left/right edges of
    // the page.
    const frame = frameRef.current
    if (frame && frame.scrollWidth - frame.clientWidth > 1) {
      return
    }

    swipeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
    }
    setIsSwiping(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [menuOpen])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const swipeState = swipeStateRef.current
    if (!swipeState || swipeState.pointerId !== event.pointerId) return

    swipeState.lastX = event.clientX
    swipeState.lastY = event.clientY

    const deltaX = event.clientX - swipeState.startX
    const deltaY = event.clientY - swipeState.startY

    if (Math.abs(deltaX) <= Math.abs(deltaY)) {
      setDragOffset(0)
      return
    }

    setDragOffset(Math.max(-96, Math.min(96, deltaX)))
  }, [])

  const handlePointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const swipeState = swipeStateRef.current
    if (!swipeState || swipeState.pointerId !== event.pointerId) return

    const decision = getSwipeDecision(
      swipeState.lastX - swipeState.startX,
      swipeState.lastY - swipeState.startY,
    )

    if (decision === 'previous' && page > 1) {
      goTo(page - 1)
    } else if (decision === 'next' && page < numPages) {
      goTo(page + 1)
    }

    resetSwipe()
  }, [goTo, numPages, page, resetSwipe])

  if (loading) return <PdfLoading progress={progress} style={style} className={className} />
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
        dragOffset={dragOffset}
        isSwiping={isSwiping}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={resetSwipe}
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
