# Changelog

All notable changes to `@mgomola/shelf-pdf-reader`. Versioning follows
[SemVer](https://semver.org/): MAJOR.MINOR.PATCH.

## 0.7.0 - 2026-04-20

### Fixed
- Background PDF caching no longer races with pdf.js range requests. The
  full-body cache fetch is deferred until after the document has loaded,
  preventing the "downloading full file first" behavior on first open.

## 0.6.1 - 2026-04-20

### Fixed
- Focus mode restore button now shows the eye-off icon instead of the
  hamburger menu icon, matching the focus mode toggle in the bottom bar.

## 0.6.0 - 2026-04-20

### Added
- `cacheName` prop on `PdfViewer`. When set, the viewer checks the Cache API
  for a previously stored copy (instant blob URL open) and background-caches
  the full PDF after the first range-based load. Consumers no longer need
  their own caching layer — just pass a cache name string.
- Exported `resolvePdfSrc()` and `backgroundCachePdf()` utilities for
  consumers who need fine-grained control over the caching lifecycle.
- Close (X) button in the top-right corner of the sidebar menu. Previously
  the only way to dismiss the sidebar was tapping the backdrop or the "< Back"
  button, which navigated away from the book entirely.
- `enabled` option on `usePdfDocument` to defer loading until the source URL
  is resolved.

### Changed
- Sidebar header is now a flex row with "< Back" on the left and the X close
  button on the right, making both actions clearly distinct.

## 0.5.0 - 2026-04-19

### Changed
- Replaced swipe gestures with invisible tap zones on the left and right edges
  of the page (epub-reader style). Tapping the left 25% goes back, right 25%
  goes forward. Tap zones are hidden when zoomed past 100% so native panning
  still works.

### Removed
- Deleted `pdfSwipe.ts` and all pointer-event swipe handling from `PdfViewer`.
- Removed `getSwipeDecision`, `shouldCapturePageSwipe`, `SWIPE_DISTANCE_PX`,
  and `SwipeDecision` exports.
- `PdfCanvas` no longer accepts `dragOffset`, `isSwiping`, or pointer event
  handler props. New props: `onTapPrevious` and `onTapNext`.

## 0.4.0 - 2026-04-19

### Changed
- Focus mode toggle moved back to the bottom toolbar (same row as navigation
  and zoom) with a new eye / eye-off icon that better communicates the feature.
- Removed the "View" section from the side menu panel — focus mode no longer
  lives there.

### Breaking
- `PdfOutlineMenu` no longer accepts `focusMode` or `onToggleFocus` props.
- `PdfControls` now requires `onToggleFocus: () => void`. Most consumers only
  use the public `PdfViewer` component, which wires this internally — no change
  needed there.

## 0.2.0 - 2026-04-18

### Changed
- Focus mode toggle moved from the bottom toolbar into the outline / menu
  panel under a new "View" section. The bottom bar on a 390 px iPhone viewport
  was getting too crowded with Prev/Page/Next + Zoom -/100%/+ + Focus and the
  toggle felt cramped. The menu is the natural home for "view modes" anyway,
  and the floating focus-restore button in the bottom-right still lets users
  exit focus mode without re-opening the panel.

### Breaking
- `PdfControls` no longer accepts an `onToggleFocus` prop.
- `PdfOutlineMenu` now requires `focusMode: boolean` and
  `onToggleFocus: () => void`. Most consumers only use the public
  `PdfViewer` component, which wires this internally — no change needed
  there.

## 0.1.1 - 2026-04-18

### Fixed
- Mobile layout no longer wastes ~250px above the page on portrait phones.
  The page wrapper now anchors to the top of the frame
  (`align-items: flex-start`) instead of vertically centering, which used to
  push near-square art-book pages into the middle of the screen with empty
  space above and below.
- The fixed bottom toolbar and top menu toggle no longer occlude the page
  edges when zoomed in. The frame now reserves padding equal to the chrome
  heights (plus iOS safe-area insets), so users can scroll a zoomed page
  past the toolbar and reach its true last pixel.

## 0.1.0 - 2026-04-18

- Initial extraction from `beskar-shelf` and `vhetts-blueprints`.
