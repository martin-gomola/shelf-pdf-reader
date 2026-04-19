import * as pdfjsLib from 'pdfjs-dist'

/**
 * Tell pdf.js where to load its web worker from.
 *
 * Why a helper instead of `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`
 * inside the package? Because the package is consumed from `node_modules`
 * where that pattern would resolve relative to the package's own dist/ dir
 * (and silently 404 the worker). Each consumer's bundler knows how to
 * produce a worker URL from its own dependency tree:
 *
 *   // Vite
 *   import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
 *   configurePdfWorker(workerUrl)
 *
 *   // Webpack 5 with the ?worker query
 *   import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url'
 *   configurePdfWorker(workerUrl)
 *
 *   // CDN (works everywhere, but adds a network dependency)
 *   configurePdfWorker(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`)
 *
 * Call this exactly once at app startup, before mounting any <PdfViewer>.
 */
export function configurePdfWorker(workerUrl: string): void {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
}

/** The pdf.js version this build of the package was tested against. */
export const pdfjsVersion: string = pdfjsLib.version
