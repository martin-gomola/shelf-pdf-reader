# @mgomola/shelf-pdf-reader

A mobile-first React PDF reader (built on `pdfjs-dist`) shared between
[Beskar Shelf](https://github.com/martin-gomola/beskar-shelf) and Vhetts
Blueprints.

## Why a shared package?

Both apps display PDFs in the same opinionated way: full-viewport reader,
floating menu/toolbar, swipe-to-page-turn, supersampled canvas, range-streamed
loading. Keeping the reader in one place avoids re-implementing the same
~1,100 lines of `pdf.js` orchestration in two repos.

## What it does

- Renders any PDF reachable from a `src` URL (network, `blob:`, or `data:`).
- First-page-fast loading: range requests + `disableAutoFetch: true` so the
  user sees page 1 before the entire file downloads. Pairs nicely with a
  qpdf-linearised source PDF.
- Mobile-tuned canvas: 1.5× supersample with a 12 MP canvas budget so iPhone
  Safari doesn't OOM on art-heavy books.
- Swipe-to-page-turn that yields to native scroll when the page is wider
  than the viewport (zoom / landscape spreads).
- Outline / table-of-contents menu, page-jump input, zoom controls, focus
  mode that hides chrome.
- Loading UI with rAF-coalesced progress so the loading bar stays smooth on
  large books.

## What it deliberately does NOT do

- **Offline storage.** Each consumer has different needs (Vhetts uses the
  Cache API + service worker; Beskar uses IndexedDB blobs alongside audio).
  Resolve your own offline layer and pass the resulting URL into `src`.
- **Reading-progress persistence.** Wire `onPageChange` into your own
  progress store.
- **PDF generation/transformation.** Use a separate pipeline for that
  (Beskar Shelf ships `tools/optimize-pdf` for pymupdf + qpdf).

## Install

```bash
# Peer dep — pdfjs-dist is intentionally NOT bundled so consumers control
# the worker URL and the version bump cadence.
npm install pdfjs-dist

# Floating against main (default; npm pins the SHA in package-lock.json):
npm install github:martin-gomola/shelf-pdf-reader

# Pinned to a tag (recommended once tags exist):
npm install github:martin-gomola/shelf-pdf-reader#v0.1.0

# Pinned to a specific commit:
npm install github:martin-gomola/shelf-pdf-reader#abc1234
```

The package's `prepare` script runs `tsc -b` + a CSS copy step, so a
git-URL install ends up with a built `dist/` automatically — no extra steps
in your consumer build.

To pull a newer revision later (without bumping the dep spec):

```bash
npm install @mgomola/shelf-pdf-reader  # re-fetches whatever main currently is
# or
npm update @mgomola/shelf-pdf-reader
```

## Use

```tsx
// One-time worker setup. Each bundler resolves the worker URL differently;
// Vite's `?url` import is the cleanest path. Keep this in your lazy reader
// chunk so pdf.js doesn't land in the main bundle.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { configurePdfWorker } from '@mgomola/shelf-pdf-reader'
import '@mgomola/shelf-pdf-reader/styles.css'

configurePdfWorker(workerUrl)
```

```tsx
import { PdfViewer } from '@mgomola/shelf-pdf-reader'

export function ReaderPage({ src, title, onBack, savedPage, onProgress }) {
  return (
    <PdfViewer
      src={src}
      bookTitle={title}
      initialPage={savedPage}
      onPageChange={onProgress}
      onBack={onBack}
    />
  )
}
```

## Theming

The package ships with default colours but uses these CSS variables (with
`--shelf-pdf-*` overrides) for everything visible:

- `--canvas`, `--surface-elevated`, `--surface-solid`
- `--text`, `--text-secondary`, `--text-muted`, `--text-hint`
- `--accent-500`, `--accent-600`
- `--glass-border`, `--nav-glass-bg`, `--nav-glass-border`, `--line-strong`
- `--hover-bg`, `--hover-bg-strong`
- `--sp-1` … `--sp-5`, `--fs-xs` … `--fs-lg`
- `--radius-sm`, `--radius`, `--radius-lg`, `--radius-pill`

Override either the design-token name (e.g. `--text`) globally, or the
package-scoped form (e.g. `--shelf-pdf-text`) to avoid colliding with your
app's tokens.

## Develop

```bash
npm install
npm run build       # tsc -b + copy CSS to dist/
npm test            # vitest run
npm run lint        # eslint src
```

When iterating on the package and consuming it from a sibling repo without
re-pushing for every change, use `npm link` or a `file:` override:

```bash
# In shelf-pdf-reader/
npm link

# In the consuming repo (beskar-shelf or vhetts-blueprints)
npm link @mgomola/shelf-pdf-reader
# When done iterating
npm unlink --no-save @mgomola/shelf-pdf-reader && npm install
```

## Release

```bash
git checkout -b release/0.x.y
npm version patch          # bumps package.json + tags
git push --follow-tags
```

Consumers pinned to `#main` pick up the change on their next
`npm install @mgomola/shelf-pdf-reader`. Consumers pinned to a tag must
update their dep spec.

If/when this gets noisy enough to justify it, switch to publishing on the
npm registry:

```bash
npm login
npm publish --access public
```

…and have consumers replace `github:martin-gomola/shelf-pdf-reader` with
`^0.x.y`.
