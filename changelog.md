# Changelog

## [1.5.0] - 2026-02-18

### Added

- Daily Country Challenge: Introduced a globally synchronised daily challenge. Every player is assigned the same country each day to hunt for a Bingo.
- Challenge HUD: Added a new pinned "Daily Challenge" section to the sidebar dashboard, displaying the target country's flag, name, and your current best score.
- Interactive Launch Button: Added a quick-launch button in the challenge HUD that opens Google Maps directly centered on the day's target country.
- Daily Hero Achievement Tier: A new set of milestone achievements (5, 10, 25, and 50 wins) specifically for completing Daily Country Challenges.
- Sidebar Dashboard Container: Created a unified, fixed-position container at the bottom of the sidebar to house both the Daily Challenge and the Streak Indicator for a cleaner "HUD" feel.

### Changed

- Achievement Progress Logic: Refactored the Achievement Gallery to support dynamic progress bars for "Daily Hero" and "Streak" milestones, showing exactly how many wins/days are remaining until the next unlock.
- Refactored: Centralised the Bingo item pool into js/config.js to streamline future content updates.
- Optimisation: Reduced the memory footprint of the extension by removing duplicate arrays in local scripts.

### Fixed

- Win-Counter Protection: Implemented logic to ensure a Daily Challenge win only increments the achievement counter once per day, even if the player completes multiple games in that country.
- Fixed outputting the total time played in the stats sharing button.

## [1.4.1] - 2026-02-17

### Fixed

- Removed testing timer

## [1.4.0] - 2026-02-17

### Added

- Secret Achievements: Introduced hidden "Easter Egg" achievements that remain masked with mystery placeholders and "???" icons until unlocked.
- Deep-Linked Achievement Toasts: Clicking an achievement notification now automatically opens the Achievement Gallery and scrolls directly to the unlocked card.
- UI Highlighting: Added a "Pulse Glow" animation to achievement cards when accessed via a direct link to help players identify their new rewards.
- Quick-Share Stats: Added a Quick-Share button on the Stats page that adds some of your top stats to your clipboard so you can paste them to your friends!
- Track Your Daily Streak: Your daily streak count is now displayed pinned to the bottom of the sidebar. Additionally, there's a bunch more milestone achievements associated with your daily streak! So keep that streak alive!
- Take a break: added a new pause button so you can pause the timer mid-game in case you need to take a break!

### Changed

- Toast Interactivity: Achievement toasts now feature a pointer cursor and hover states to indicate they are clickable.
- English Placenames: Utilising a different map tileset so that placenames are now displayed in English on the World Map.

## [1.3.0] - 2026-02-16

### Added

- Achievements Progress Bars: Visual progress indicators added to all locked achievement cards to track career goals.
- End-Game Location Display: The results overlay now displays the specific city and country processed via reverse-geocoding.
- Achievement - Double Tap: Unlocked by capturing two items within a 2-second window.
- Achievement - Off to the Races: Unlocked by capturing the first item within 5 seconds of the game start.
- Achievement - Logistics Expert: Career collection goal for Work Vans, Trailers, and Ladders.
- Achievement - High-Vis Hero: Career collection goal for 20 "Person wearing Hi-Vis" finds.
- Achievement - The Patriot: Location-based goal for finding a Flag in the United States.
- Achievement - Scandinavian Scout: Multi-location goal requiring finds in Norway, Sweden, and Denmark.
- Achievement - Island Hopper: Multi-location goal for the United Kingdom and Australia.
- Achievement - London Calling: Regional goal for finding any item within the Greater London area.

### Changed

- Achievement Logic Reordering: The game now processes world geocoding data before checking achievement logic to ensure location-based goals trigger immediately upon game completion.
- UI Grayscale Logic: Achievement cards now retain full color for progress bars while grayscaling text and icons for locked items, improving readability.
- Fuzzy Location Matching: Updated location checks to use case-insensitive substring matching (e.g., "London") rather than exact string matches to account for varying API responses.
- Version Update: Manifest version bumped to 1.3.0.
- Made the .xpi file name generic so the index.html page link does not have to be updated each time.
- Updated landing page.

### Fixed

- Achievement Progress Sync: Fixed a bug where the Achievements page failed to display partial progress for location-based goals due to missing world_history data in the storage request.
- Reference Error: Resolved a JavaScript ReferenceError where lastGame was undefined during the end-game achievement check.

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
