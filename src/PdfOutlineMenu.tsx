import type { OutlineEntry } from './types.js'

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function IconFocus({ active }: { active: boolean }) {
  // Corner-bracket "maximize"/"minimize" glyphs - same metaphor we used in the
  // bottom bar, kept here for menu placement so the user has one consistent
  // visual cue for "focus mode" across the reader.
  return active ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3v6H3M21 9h-6V3M3 15h6v6M15 21v-6h6" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
    </svg>
  )
}

export function PdfOutlineMenu({
  menuOpen,
  onClose,
  onBack,
  bookTitle,
  outline,
  page,
  goTo,
  focusMode,
  onToggleFocus,
}: {
  menuOpen: boolean
  onClose: () => void
  onBack?: () => void
  bookTitle?: string
  outline: OutlineEntry[]
  page: number
  goTo: (page: number) => void
  focusMode: boolean
  onToggleFocus: () => void
}) {
  if (!menuOpen) return null

  return (
    <div className="pdf-menu-backdrop" onClick={onClose}>
      <nav className="pdf-menu-panel" onClick={(event) => event.stopPropagation()}>
        {onBack && (
          <button className="pdf-menu-back" onClick={onBack}>
            <IconChevronLeft /> Back
          </button>
        )}
        {bookTitle && <h3 className="pdf-menu-title">{bookTitle}</h3>}

        {/* Focus mode lives in the menu rather than the bottom bar - the bar
            was getting too crowded on phones (Prev/Page/Next + Zoom -/100%/+
            already eat the full width on a 390 px viewport). The menu is the
            right home for "view modes" anyway. The floating restore button in
            the bottom-right still lets the user exit focus mode without
            re-opening this panel. */}
        <div className="pdf-menu-section">
          <p className="pdf-menu-section-label">View</p>
          <button
            type="button"
            className={`pdf-menu-toggle-row${focusMode ? ' active' : ''}`}
            onClick={onToggleFocus}
            aria-pressed={focusMode}
          >
            <span className="pdf-menu-toggle-row-icon"><IconFocus active={focusMode} /></span>
            <span className="pdf-menu-toggle-row-label">Focus mode</span>
            <span className="pdf-menu-toggle-row-state">{focusMode ? 'On' : 'Off'}</span>
          </button>
        </div>

        {outline.length > 0 && (
          <div className="pdf-menu-chapters">
            <p className="pdf-menu-section-label">Chapters</p>
            <ul className="pdf-menu-chapter-list">
              {outline.map((entry) => (
                <li key={`${entry.page}-${entry.title}`}>
                  <button
                    className={`pdf-menu-chapter-item${entry.page === page ? ' active' : ''}`}
                    style={{ paddingLeft: `${12 + entry.depth * 16}px` }}
                    onClick={() => {
                      goTo(entry.page)
                      onClose()
                    }}
                  >
                    <span className="pdf-menu-chapter-title">{entry.title}</span>
                    <span className="pdf-menu-chapter-page">{entry.page}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </div>
  )
}
