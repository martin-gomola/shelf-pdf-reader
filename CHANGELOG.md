# Changelog

All notable changes to `@mgomola/shelf-pdf-reader`. Versioning follows
[SemVer](https://semver.org/): MAJOR.MINOR.PATCH.

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
