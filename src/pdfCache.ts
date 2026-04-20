const cacheApiAvailable = typeof window !== 'undefined' && 'caches' in window

function buildCacheKey(pdfUrl: string): Request {
  const url = new URL(pdfUrl, window.location.href)
  return new Request(url.origin + url.pathname, { method: 'GET' })
}

/**
 * Check the Cache API for a previously stored copy of the PDF.
 * Returns a blob: URL if found (instant open via LocalPdfManager),
 * or the original network URL so pdf.js can negotiate HTTP Range mode.
 *
 * The caller must revoke the returned blobUrl when done.
 */
export async function resolvePdfSrc(
  pdfUrl: string,
  cacheName: string,
): Promise<{ src: string; blobUrl: string | null; fromCache: boolean }> {
  if (!cacheApiAvailable) return { src: pdfUrl, blobUrl: null, fromCache: false }

  try {
    const cache = await caches.open(cacheName)
    const hit = await cache.match(buildCacheKey(pdfUrl))
    if (hit) {
      const blob = await hit.blob()
      const blobUrl = URL.createObjectURL(blob)
      return { src: blobUrl, blobUrl, fromCache: true }
    }
  } catch {
    // Cache miss or error — fall through to network.
  }

  return { src: pdfUrl, blobUrl: null, fromCache: false }
}

/**
 * Silently fetch the full PDF into the Cache API so reopening the same
 * book is instant. Skips the fetch when the PDF is already cached or the
 * Cache API is unavailable.
 */
export async function backgroundCachePdf(
  pdfUrl: string,
  cacheName: string,
): Promise<void> {
  if (!cacheApiAvailable) return

  const cacheKey = buildCacheKey(pdfUrl)
  const cache = await caches.open(cacheName)

  if (await cache.match(cacheKey)) return

  try {
    const response = await fetch(pdfUrl)
    if (!response.ok || response.status === 206) return

    const contentType = response.headers.get('content-type') ?? 'application/pdf'
    const body = await response.arrayBuffer()

    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Content-Length', String(body.byteLength))

    await cache.put(cacheKey, new Response(body, { status: 200, headers }))
  } catch {
    // Network failure — reader already works via range mode.
  }
}
