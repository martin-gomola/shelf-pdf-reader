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
        {/* The percentage doubles as the "Fit width" button - tapping resets
            zoom to 1.0. Saves a whole bar slot on narrow phones and the
            target gesture (tap the number to reset it) reads naturally. */}
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
    </div>
  )
}
