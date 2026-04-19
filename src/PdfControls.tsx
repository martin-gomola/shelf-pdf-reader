function IconFocus({ active }: { active: boolean }) {
  // "Maximize" / "minimize" corner brackets - matches the focus-mode metaphor
  // (hide chrome, just show the page) without burning ~70 px of bar width on
  // the word "Focus mode".
  return active ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3v6H3M21 9h-6V3M3 15h6v6M15 21v-6h6" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
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

      <div className="pdf-bar-divider" />

      <button
        className="pdf-bar-btn pdf-bar-focus-toggle"
        onClick={onToggleFocus}
        aria-pressed={focusMode}
        aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
        title={focusMode ? 'Exit focus mode' : 'Focus mode'}
      >
        <IconFocus active={focusMode} />
      </button>
    </div>
  )
}
