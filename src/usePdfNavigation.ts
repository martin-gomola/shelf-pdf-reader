import { useCallback, useState } from 'react'

export function usePdfNavigation({
  initialPage = 1,
  onPageChange,
}: {
  initialPage?: number
  /**
   * Fires when the user navigates to a different page (Prev/Next, page-input,
   * outline jump, or swipe). The second argument is the document's total
   * page count, useful for computing a progress fraction. It will be 0 only
   * when the document hasn't loaded yet, which can't happen for user-driven
   * navigation in practice but is exposed for completeness.
   */
  onPageChange?: (page: number, numPages: number) => void
}) {
  const [page, setPage] = useState(initialPage)
  const [numPages, setNumPages] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [pageInput, setPageInput] = useState(String(initialPage))

  const goTo = useCallback((nextPage: number) => {
    setPage((currentPage) => {
      const maxPage = numPages > 0 ? numPages : currentPage
      const clamped = Math.max(1, Math.min(nextPage, maxPage))
      setPageInput(String(clamped))
      onPageChange?.(clamped, numPages)
      return clamped
    })
  }, [numPages, onPageChange])

  const syncFromDocument = useCallback((resolvedPage: number, totalPages: number) => {
    setNumPages(totalPages)
    setPage(resolvedPage)
    setPageInput(String(resolvedPage))
    setZoom(1)
  }, [])

  const commitPageInput = useCallback(() => {
    const parsed = Number.parseInt(pageInput, 10)
    if (Number.isFinite(parsed)) {
      goTo(parsed)
      return
    }
    setPageInput(String(page))
  }, [goTo, page, pageInput])

  return {
    page,
    numPages,
    zoom,
    pageInput,
    setZoom,
    setPageInput,
    goTo,
    syncFromDocument,
    commitPageInput,
  }
}
