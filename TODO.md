# TODO

- [x] Make the timer change colour the closer it gets to ZERO
- [x] Add an undo button for clicked bingo cells
- [x] Init items in stats with a zero
- [x] If no bingo, ensure time taken is calculated for entire duration and not just time from start to last item found
- [x] Remove the blue line from the map
- [x] Added sound effects
- [ ] Replace Achievements with a World Map
- [ ] Take average of pins from bingo guesses to get a centroid location
- [ ] Call API with lat/lon to get country name
- [ ] Store info in stats regarding bingos/losses per country played
- [ ] Show a pin/flag on the world map for places you've achieved bingo

- There will be a new "World" page (world.html)
- This page will be accessible from the main menu
- It will display a map of the world (same as the openstreet one already in use on map.html)
- When a bingo game finishes, either via bingo or timeout, an average of the pins on the map will be calculated
- This average pin will then be displayed on this world map and stored in local storage
- The pin, when clicked will reveal a few details (town/city + country as well as how many items out of 25 were found)
- There should be a new "Countries" section within stats.html
- This will list out the countries that have been played in so far
- It will show stats like "number of attempts", "bingos" and "timeouts" so that it can display a bar (green for bingo and red for timeouts) that will display the ratio of wins vs losses
