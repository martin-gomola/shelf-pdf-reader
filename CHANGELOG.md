# Changelog

All notable changes to `@mgomola/shelf-pdf-reader`. Versioning follows
[SemVer](https://semver.org/): MAJOR.MINOR.PATCH.

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
