import type { RefObject } from 'react'

export function PdfCanvas({
  canvasRef,
  frameRef,
  isZoomed,
  onTapPrevious,
  onTapNext,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>
  frameRef: RefObject<HTMLDivElement | null>
  isZoomed: boolean
  onTapPrevious: () => void
  onTapNext: () => void
}) {
  return (
    <div
      className={`pdf-reader-frame${isZoomed ? ' pdf-reader-frame--pannable' : ''}`}
      ref={frameRef}
    >
      <div className="pdf-reader-page">
        <canvas ref={canvasRef} />
      </div>
      {!isZoomed && (
        <>
          <button
            className="pdf-tap-zone pdf-tap-zone--left"
            onClick={onTapPrevious}
            aria-label="Previous page"
          />
          <button
            className="pdf-tap-zone pdf-tap-zone--right"
            onClick={onTapNext}
            aria-label="Next page"
          />
        </>
      )}
    </div>
  )
}
