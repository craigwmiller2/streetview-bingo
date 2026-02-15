# Changelog

## [1.2.0] - 2026-02-15

### Added

- **Round Start Countdown:** Introduced a "3, 2, 1, GO!" animated overlay with background blurring to allow players to orient themselves before the timer begins.
- **Centralised Settings Hub:** A new dedicated page for technical configurations and data management, decluttering the Stats dashboard.
- **Data Portability (Import/Export):** Support for exporting career data as a `.json` backup and importing it to restore progress across devices.
- **Career Completion Dashboard:** A high-impact "Hero" section at the top of the Achievements page featuring a global progress bar.
- **Categorised Progress Tracking:** Achievement-specific progress bars and completion ratios (e.g., 2/5) for each category.
- **Unlock Timestamps:** Achievements now record the exact date earned, with "Legacy Support" labels for trophies earned prior to v1.2.0.
- **Action Confirmation System:** Post-reload notification banners to confirm successful data resets or imports.

### Changed

- **Achievement System Overhaul:** Migrated from "Rarity" to a descriptive "Category" system (Milestone, Sprint, Exploration, Collection, and Tactical) with a redesigned, responsive grid layout.
- **Enhanced Notification Toasts:** Updated sidebar toasts with category-specific gradients and an infinite glint animation for "Personal Best" records.
- **Dashboard Expansion:** Redesigned the Career Stats page with a responsive grid and new tracking metrics (Total Time Explored and Daily Streaks).
- **Backup Optimisation:** The export engine now strips temporary session screenshots, reducing backup file sizes by 95% while retaining 100% of career progress.
- **Safety Workflow:** Relocated "Reset All Data" to a "Danger Zone" in Settings, requiring double-confirmation to prevent accidental data loss.
- **Logic Refactor:** Optimised the storage schema to separate IDs from metadata, ensuring faster load times and more reliable backups.

## [1.1.0] - 2026-02-14

### Added

- **New Achievement:** "World Traveler" – awarded for playing games in 5 unique countries (reverse-geocoding powered).
- **Grouped Main Menu:** Redesigned the home screen with logical categories ("Start Hunting" and "Trophy Room") and high-fidelity SVG iconography.
- **Dynamic Header:** Implementation of an auto-hiding header that collapses during gameplay to maximize vertical space for the Bingo grid.
- **Personal Best System:** The extension now tracks your fastest Bingo completion time and triggers a specialized notification when a record is broken.
- **Record Broken Notification:** Added a dedicated toast notification for Personal Bests, featuring a unique "Record Broken!" header and legendary "glint" animation to distinguish it from regular achievements.
- **Unified Smart Navigation:** All external pages (Stats, Achievements, World Map, and Findings Map) now use an "Open-or-Focus" logic to prevent duplicate tabs and ensure data is always refreshed upon viewing.
- **Shareable Locations:** World Map markers now feature "Open in Street View" and "Copy Share Link" options, allowing you to challenge friends to the same locations.
- **English Localisation:** Forced the geocoding engine to return place names in English regardless of the game's original territory.
- **Interactive Marker Clustering:** Integrated `Leaflet.markercluster` to group nearby game locations, significantly improving map performance and visual clarity at high zoom levels.
- **Spiderfy Interaction:** Implemented "Spiderfying" logic that automatically fans out overlapping markers when a cluster is clicked, allowing access to multiple games played at the same location.
- **Offline Reliability:** Transitioned all map dependencies to a self-hosted model, ensuring the World Map and clustering logic function without external CDN dependencies.
- **Quick Launch Button:** Added a "Open Google Maps" button to the main menu with smart-tab detection, allowing users to jump directly to the game environment or switch to an existing Maps tab.
- **Full Summary Clipboard Support:** Added a "Copy Summary" button to the Findings Map, allowing users to copy the entire journey (map + stats + grid) as a single image for instant sharing.
- **Full Summary Clipboard Support:** Added a "Copy Summary" button to the Findings Map, allowing users to copy the entire journey (map + stats + grid) as a single image for instant sharing.

### Changed

- **Marker Redesign:** Replaced standard circle markers with high-contrast, CSS-driven "Bingo Dots" featuring depth shadows for better visibility against various map terrains.
- **Modular Styles:** Decoupled World Map styling into a dedicated `world.css` file.
- **UI Harmonization:** Implemented CSS variables to sync colors, shadows, and typography with the main extension interface.
- **Themed Clustering:** Custom-styled the `MarkerCluster` bubbles to utilize the Bingo brand palette (Success Green) instead of default Leaflet colors.

### Fixed

- Improved UI responsiveness by centering game controls and optimizing button touch targets.
- Refined achievement logic to ensure "World Traveler" correctly identifies unique countries via the game's location history.
- **Fixed:** Resolved a timing discrepancy where recorded game duration could differ from the visible countdown clock by up to one second.
- **Notification Logic:** Refactored the achievement system to handle both permanent unlocks and recurring personal records through a centralized toast component.
- Prevented "tab bloat" by implementing a focus-and-reload pattern for all internal extension pages.
- Improved readability of Map popups with a cleaner, centered layout and clearer typography.
- **Fixed:** Resolved Content Security Policy (CSP) errors on the World Map that prevented "Copy Link" buttons from functioning.
- **Duplicate Marker Overlay:** Resolved an issue where multiple games in the same neighborhood were visually hidden behind a single marker.

---

## [1.0.0] - 2026-02-13

### Added

- Initial release of Street View Bingo.
- 5x5 Bingo grid with automated Google Maps geocoding.
- Achievement system and global statistics dashboard.
- Interactive world map to track game history.
