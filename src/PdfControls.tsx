function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

export function PdfControls({
  focusMode,
  page,
  numPages,
  pageInput,
  zoom,
  onPrevious,
  onNext,
  onPageInputChange,
  onPageInputCommit,
  onZoomOut,
  onZoomIn,
  onFitWidth,
  onToggleFocus,
}: {
  focusMode: boolean
  page: number
  numPages: number
  pageInput: string
  zoom: number
  onPrevious: () => void
  onNext: () => void
  onPageInputChange: (value: string) => void
  onPageInputCommit: () => void
  onZoomOut: () => void
  onZoomIn: () => void
  onFitWidth: () => void
  onToggleFocus: () => void
}) {
  return (
    <div className={`pdf-bottom-bar${focusMode ? ' pdf-bottom-bar--hidden' : ''}`}>
      <div className="pdf-bar-group">
        <button className="pdf-bar-btn" onClick={onPrevious} disabled={page <= 1} aria-label="Previous page">&larr;</button>
        <label className="pdf-bar-page-label">
          <span className="sr-only">Page number</span>
          <input
            className="pdf-bar-page-input"
            value={pageInput}
            inputMode="numeric"
            aria-label="Page number"
            onChange={(event) => onPageInputChange(event.target.value.replace(/[^\d]/g, ''))}
            onBlur={onPageInputCommit}
            onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
          />
          <span className="pdf-bar-page-total">/ {numPages}</span>
        </label>
        <button className="pdf-bar-btn" onClick={onNext} disabled={page >= numPages} aria-label="Next page">&rarr;</button>
      </div>

      <div className="pdf-bar-divider" />

      <div className="pdf-bar-group">
        <button className="pdf-bar-btn" onClick={onZoomOut} aria-label="Zoom out">&minus;</button>
        <button
          className="pdf-bar-zoom-label pdf-bar-zoom-reset"
          onClick={onFitWidth}
          aria-label={`Zoom ${Math.round(zoom * 100)} percent. Tap to fit width.`}
          title="Fit width"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button className="pdf-bar-btn" onClick={onZoomIn} aria-label="Zoom in">+</button>
      </div>

      <div className="pdf-bar-divider" />

      <button
        className={`pdf-bar-btn pdf-bar-focus-toggle${focusMode ? ' active' : ''}`}
        onClick={onToggleFocus}
        aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
        aria-pressed={focusMode}
        title="Focus mode"
      >
        {focusMode ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  )
}
