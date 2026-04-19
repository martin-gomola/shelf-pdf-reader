import { describe, expect, it } from 'vitest'
import { getSwipeDecision, SWIPE_DISTANCE_PX } from '../pdfSwipe.js'

describe('getSwipeDecision', () => {
  it('returns next for a strong left swipe', () => {
    expect(getSwipeDecision(-SWIPE_DISTANCE_PX - 20, 12)).toBe('next')
  })

  it('returns previous for a strong right swipe', () => {
    expect(getSwipeDecision(SWIPE_DISTANCE_PX + 20, -10)).toBe('previous')
  })

  it('ignores short horizontal drags', () => {
    expect(getSwipeDecision(SWIPE_DISTANCE_PX - 1, 0)).toBeNull()
  })

  it('ignores mostly vertical drags', () => {
    expect(getSwipeDecision(SWIPE_DISTANCE_PX + 20, 120)).toBeNull()
  })
})
