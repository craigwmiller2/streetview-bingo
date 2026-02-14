# Changelog

## [1.1.0] - 2026-02-00

### Added

- **New Achievement:** "World Traveler" – awarded for playing games in 5 unique countries (reverse-geocoding powered).
- **Grouped Main Menu:** Redesigned the home screen with logical categories ("Start Hunting" and "Trophy Room") and high-fidelity SVG iconography.
- **Dynamic Header:** Implementation of an auto-hiding header that collapses during gameplay to maximize vertical space for the Bingo grid.
- **Personal Best System:** The extension now tracks your fastest Bingo completion time and triggers a specialized notification when a record is broken.
- **Record Broken Notification:** Added a dedicated toast notification for Personal Bests, featuring a unique "Record Broken!" header and legendary "glint" animation to distinguish it from regular achievements.

### Fixed

- Improved UI responsiveness by centering game controls and optimizing button touch targets.
- Refined achievement logic to ensure "World Traveler" correctly identifies unique countries via the game's location history.
- **Fixed:** Resolved a timing discrepancy where recorded game duration could differ from the visible countdown clock by up to one second.
- **Notification Logic:** Refactored the achievement system to handle both permanent unlocks and recurring personal records through a centralized toast component.

---

## [1.0.0] - 2026-02-13

### Added

- Initial release of Street View Bingo.
- 5x5 Bingo grid with automated Google Maps geocoding.
- Achievement system and global statistics dashboard.
- Interactive world map to track game history.
