export const SWIPE_DISTANCE_PX = 72
const SWIPE_AXIS_RATIO = 1.2

export type SwipeDecision = 'previous' | 'next' | null

export function getSwipeDecision(deltaX: number, deltaY: number): SwipeDecision {
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)

  if (absX < SWIPE_DISTANCE_PX) return null
  if (absX < absY * SWIPE_AXIS_RATIO) return null

  return deltaX > 0 ? 'previous' : 'next'
}
