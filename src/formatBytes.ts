// Returns a short human-readable byte count, e.g. 27_400_000 -> "27.4 MB".
// Uses SI base-1000 units so the numbers match what the OS file picker shows.
// Returns "—" for null/NaN/negative inputs so callers can render unknown
// sizes without conditional branches.
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '—'
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(units.length - 1, Math.floor(Math.log10(bytes) / 3))
  const value = bytes / 1000 ** exponent
  const precision = exponent === 0 || value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${value.toFixed(precision)} ${units[exponent]}`
}
