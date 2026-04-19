import { describe, expect, it } from 'vitest'
import { getSwipeDecision, shouldCapturePageSwipe, SWIPE_DISTANCE_PX } from '../pdfSwipe.js'

describe('shouldCapturePageSwipe', () => {
  it('allows page-swipe gestures at fit width when there is no horizontal overflow', () => {
    expect(shouldCapturePageSwipe(1, 0)).toBe(true)
  })

  it('disables page-swipe gestures when zoomed beyond fit width', () => {
    expect(shouldCapturePageSwipe(1.25, 0)).toBe(false)
  })

  it('disables page-swipe gestures when the page already overflows horizontally', () => {
    expect(shouldCapturePageSwipe(1, 24)).toBe(false)
  })
})

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
