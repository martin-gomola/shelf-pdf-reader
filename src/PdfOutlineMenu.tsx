import type { OutlineEntry } from './types.js'

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
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
}: {
  menuOpen: boolean
  onClose: () => void
  onBack?: () => void
  bookTitle?: string
  outline: OutlineEntry[]
  page: number
  goTo: (page: number) => void
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
