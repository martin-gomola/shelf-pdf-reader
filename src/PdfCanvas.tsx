import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'

export function PdfCanvas({
  canvasRef,
  frameRef,
  dragOffset,
  isZoomed,
  isSwiping,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>
  frameRef: RefObject<HTMLDivElement | null>
  dragOffset: number
  isZoomed: boolean
  isSwiping: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerCancel: () => void
}) {
  return (
    <div
      className={`pdf-reader-frame${isZoomed ? ' pdf-reader-frame--pannable' : ''}`}
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        className={`pdf-reader-page${isZoomed ? ' pdf-reader-page--pannable' : ''}${isSwiping ? ' pdf-reader-page--swiping' : ''}`}
        style={{ transform: dragOffset === 0 ? undefined : `translateX(${dragOffset}px)` }}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
