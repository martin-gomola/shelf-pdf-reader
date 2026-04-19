import { describe, expect, it } from 'vitest'
import { formatBytes } from '../formatBytes.js'

describe('formatBytes', () => {
  it('returns em-dash for null/undefined', () => {
    expect(formatBytes(null)).toBe('—')
    expect(formatBytes(undefined)).toBe('—')
  })

  it('returns 0 B for non-positive numbers', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(-5)).toBe('0 B')
  })

  it('formats kilobytes with two decimals when small', () => {
    expect(formatBytes(1500)).toBe('1.50 KB')
  })

  it('formats megabytes with one decimal', () => {
    expect(formatBytes(27_400_000)).toBe('27.4 MB')
  })

  it('drops decimals once the value crosses 100', () => {
    expect(formatBytes(150_000_000)).toBe('150 MB')
  })
})
