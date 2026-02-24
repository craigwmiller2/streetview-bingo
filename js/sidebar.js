const soundTick = new Audio(browser.runtime.getURL("audio/tick.mp3"));
const soundBingo = new Audio(browser.runtime.getURL("audio/bingo.mp3"));
const soundDefeat = new Audio(browser.runtime.getURL("audio/defeat.mp3"));
const soundAchievement = new Audio(browser.runtime.getURL("audio/achievement.ogg"));
const soundCountdown = new Audio(browser.runtime.getURL("audio/countdown.mp3"));

soundTick.load();
soundBingo.load();
soundDefeat.load();
soundAchievement.load();
soundCountdown.load();

let gameData = [];
let timerInterval = null;
let timeLeft = 0;
let initialTime = 600; // 10 mins
let gameStartTime = null;
let isPaused = false;
let totalPausedTime = 0;
let pauseStartTime = null;
let totalDistanceTraveled = 0;
let capturesAtCurrentLocation = 0;
let lastCaptureCoords = null;
const FULL_DASH_ARRAY = 283;

/**
 * Game State Controller with Countdown
 */
window.startGame = async function (mode) {
    const grid = document.getElementById("bingo-grid");
    const modeBadge = document.getElementById("mode-badge-title");

    // --- NEW: Reset Timer UI immediately to prevent ghosting ---
    const textDisplay = document.getElementById("timer-text");
    const progressCircle = document.querySelector(".timer-progress");

    if (textDisplay) textDisplay.textContent = "10:00"; // Default starting look
    if (progressCircle) {
        progressCircle.style.strokeDashoffset = "0"; // Reset the ring to full
        progressCircle.style.transition = "none"; // Disable animation during reset
    }

    // 1. Initial UI Setup
    document.getElementById("mode-menu").style.display = "none";
    document.getElementById("main-header").style.display = "none";
    document.getElementById("controls").style.display = "block";

    // 2. Clear previous classes
    grid.classList.remove("standard-mode", "random-mode", "infinite-mode");
    modeBadge.className = ""; // Reset badge classes

    // Reset pause state and timers
    totalPausedTime = 0;
    pauseStartTime = null;

    // Reset distance for the new game
    totalDistanceTraveled = 0;

    let modeLabel = "Standard";
    if (mode === "random") {
        modeLabel = "Random";
        ITEMS = generateRandomBoard();
        grid.classList.add("random-mode");
        modeBadge.classList.add("mode-badge-title", "mode-random");
    } else if (mode === "infinite") {
        modeLabel = "Infinite";
        ITEMS = [...CORE_ITEMS];
        grid.classList.add("infinite-mode");
        modeBadge.classList.add("mode-badge-title", "mode-infinite");
    } else {
        ITEMS = [...CORE_ITEMS];
        grid.classList.add("standard-mode");
        modeBadge.classList.add("mode-badge-title", "mode-standard");
    }

    modeBadge.textContent = `${modeLabel} Mode`;

    // Save the mode along with the session items
    await browser.storage.local.set({
        session_items: ITEMS,
        current_game_mode: modeLabel,
    });

    gameData = [];
    document.getElementById("bingo-grid").innerHTML = "";
    // generateGrid();

    // 3. Generate Grid with Animation
    // generateGridWithAnimation();

    // 2. Prepare the Countdown Overlay
    const overlay = document.getElementById("start-countdown");
    const numberDisplay = document.getElementById("countdown-number");
    overlay.style.display = "flex";

    let count = 3;
    numberDisplay.textContent = count;
    numberDisplay.className = ""; // Reset any previous 'go-text' class
    soundCountdown.play();

    const countdownInterval = setInterval(() => {
        count--;

        // Reset animation by removing the display element and triggering a reflow
        numberDisplay.style.animation = "none";
        numberDisplay.offsetHeight; // This "magic" line triggers a reflow
        numberDisplay.style.animation = null;

        if (count > 0) {
            numberDisplay.textContent = count;
        } else if (count === 0) {
            numberDisplay.textContent = "GO!";
            numberDisplay.classList.add("go-text");

            // --- NEW: Trigger Shuffle Animation RIGHT NOW ---
            // This happens while "GO!" is on screen but before overlay vanishes
            setTimeout(() => {
                generateGridWithAnimation();
                document.getElementById("active-mode-display").style.display = "block";
            }, 1000);
        } else {
            clearInterval(countdownInterval);
            overlay.style.display = "none";

            // Start the Game
            gameStartTime = Date.now();
            if (mode === "10min" || mode === "random" || mode === "infinite") {
                timeLeft = initialTime; // Only used for countdown modes
                document.getElementById("timer-container").style.display = "block"; // Now visible for Infinite!
                startTimer();
            }
        }
    }, 1000);
};

function generateGrid() {
    const grid = document.getElementById("bingo-grid");
    grid.innerHTML = "";
    ITEMS.forEach((item) => {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.innerHTML = `<span>${item}</span>`;
        cell.onclick = () => handleCapture(item, cell);
        grid.appendChild(cell);
    });
}

function togglePause() {
    // Note: We now allow pausing in all modes including Infinite
    isPaused = !isPaused;
    const overlay = document.getElementById("pause-overlay");
    const grid = document.getElementById("bingo-grid");

    if (isPaused) {
        pauseStartTime = Date.now(); // Record the moment pause began
        overlay.style.display = "flex";
        grid.style.filter = "blur(4px)";
        grid.style.pointerEvents = "none";
    } else {
        // Calculate how long this specific pause lasted and add it to the total
        if (pauseStartTime) {
            totalPausedTime += Date.now() - pauseStartTime;
        }
        overlay.style.display = "none";
        grid.style.filter = "none";
        grid.style.pointerEvents = "auto";
    }
}

async function handleCapture(itemName, cellElement) {
    if (isPaused || cellElement.classList.contains("found") || cellElement.classList.contains("capturing")) return;

    cellElement.classList.add("capturing");
    const originalContent = cellElement.innerHTML;
    cellElement.innerHTML = `<span>...</span>`;

    try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tab || (!tab.url.includes("google") && !tab.url.includes("maps"))) {
            throw new Error("WrongTab");
        }

        const screenshot = await browser.runtime.sendMessage({ action: "take_screenshot" });
        if (!screenshot) throw new Error("CaptureFailed");

        const coords = parseCoords(tab.url);
        const find = {
            item: itemName,
            locationUrl: tab.url,
            coords: coords,
            image: screenshot,
            timestamp: new Date().toISOString(),
        };

        // 1. Store the previous length before pushing
        const previousLength = gameData.length;
        gameData.push(find);

        if (lastCaptureCoords) {
            const distFromLast = calculateDistance(
                lastCaptureCoords.lat,
                lastCaptureCoords.lng,
                coords.lat,
                coords.lng,
            );

            // If moved less than 5 meters, consider it the "same location"
            if (distFromLast <= 5) {
                capturesAtCurrentLocation++;
            } else {
                capturesAtCurrentLocation = 1; // Reset to 1 if they moved
            }
        } else {
            capturesAtCurrentLocation = 1; // First item of the game
        }
        lastCaptureCoords = coords;

        // Store the highest streak in the find object so checkAchievements can see it
        find.locationStreak = capturesAtCurrentLocation;

        // 2. Distance Logic: Only run if there's a "previous" item to compare to
        if (previousLength > 0) {
            const currentFind = gameData[gameData.length - 1];
            const previousFind = gameData[gameData.length - 2];

            if (previousFind.coords && currentFind.coords) {
                const d = calculateDistance(
                    previousFind.coords.lat,
                    previousFind.coords.lng,
                    currentFind.coords.lat,
                    currentFind.coords.lng,
                );

                // Ignore movements less than 1m (GPS noise) and impossible jumps
                if (d > 1 && d < 10000000) {
                    totalDistanceTraveled += d;
                }
            }
        }

        // 3. UI Updates
        cellElement.classList.remove("capturing");
        cellElement.classList.add("found");
        cellElement.style.backgroundImage = `url(${screenshot})`;
        cellElement.innerHTML = `<span>${itemName}</span>`;

        const undoBtn = document.createElement("button");
        undoBtn.className = "undo-btn";
        undoBtn.innerHTML = "✕";
        undoBtn.onclick = (e) => {
            e.stopPropagation();
            handleUndo(itemName, cellElement);
        };
        cellElement.appendChild(undoBtn);

        // Sync the HUD immediately so the player sees the 0m or +Xm change
        refreshHUD();
        checkWinCondition();
    } catch (error) {
        cellElement.classList.remove("capturing");
        cellElement.innerHTML = originalContent;
        if (error.message === "WrongTab") alert("Switch to Google Maps!");
        console.error("Capture Error:", error);
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in metres

    // Convert degrees to radians
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;

    // x = distance along the parallel (longitude)
    // y = distance along the meridian (latitude)
    const x = Δλ * Math.cos((φ1 + φ2) / 2);
    const y = Δφ;

    // Distance = sqrt(x² + y²) * R
    return Math.sqrt(x * x + y * y) * R;
}

function checkWinCondition() {
    if (gameData.length === 25) {
        soundBingo.play();
        triggerEndGame("🎉 BINGO!", "rgba(46, 204, 113, 0.9)");
    }
}

function handleUndo(itemName, cellElement) {
    // 1. Find the index of the specific item being undone
    const index = gameData.findIndex((f) => f.item === itemName);

    if (index > -1) {
        // 2. Only subtract distance if there was a "previous" item to jump from
        if (index > 0) {
            const current = gameData[index];
            const previous = gameData[index - 1];

            if (current.coords && previous.coords) {
                const jumpDistance = calculateDistance(
                    previous.coords.lat,
                    previous.coords.lng,
                    current.coords.lat,
                    current.coords.lng,
                );

                // Subtract the distance this specific find added
                totalDistanceTraveled = Math.max(0, totalDistanceTraveled - jumpDistance);
            }
        }

        // 3. Remove the item from the data array
        gameData.splice(index, 1);
    }

    // 4. Reset Cell UI
    cellElement.classList.remove("found");
    cellElement.style.backgroundImage = "none";
    cellElement.innerHTML = `<span>${itemName}</span>`;
    cellElement.onclick = () => handleCapture(itemName, cellElement);

    // 5. Update HUD to show the new reduced distance
    refreshHUD();
}

function refreshHUD() {
    const grid = document.getElementById("bingo-grid");
    const textDisplay = document.getElementById("timer-text");
    const progressCircle = document.querySelector(".timer-progress");

    // Safety: Don't calculate if the game hasn't technically started yet
    if (!gameStartTime || !textDisplay || !progressCircle) return;

    const isRandom = grid.classList.contains("random-mode");
    const isInfinite = grid.classList.contains("infinite-mode");
    let displayMins, displaySecs;

    const distanceDisplay = document.getElementById("distance-stats"); // Add this to your HTML
    if (distanceDisplay) {
        // Convert to km for a cleaner look if it's long, or meters for precision
        const distText =
            totalDistanceTraveled < 1000
                ? `${Math.floor(totalDistanceTraveled)}m`
                : `${(totalDistanceTraveled / 1000).toFixed(2)}km`;

        distanceDisplay.textContent = `Distance Travelled: ${distText}`;

        // Optional: Turn text red if they fail "Perfect Seed"
        // if (totalDistanceTraveled >= 500) {
        //     distanceDisplay.style.color = "#e74c3c";
        // }
    }

    if (isInfinite) {
        // --- INFINITE MODE: Count UP (Adjusted for Pauses) ---
        // Subtract totalPausedTime so the clock doesn't jump forward
        const elapsed = Math.floor((Date.now() - gameStartTime - totalPausedTime) / 1000);
        displayMins = Math.floor(elapsed / 60);
        displaySecs = elapsed % 60;

        progressCircle.style.strokeDashoffset = 0;
        progressCircle.style.stroke = "#f39c12";
    } else {
        // --- 10 MIN MODES (Standard & Random): Count DOWN ---
        const percentage = Math.max(0, timeLeft / initialTime);
        displayMins = Math.floor(timeLeft / 60);
        displaySecs = timeLeft % 60;

        // Calculate the ring progress
        const offset = FULL_DASH_ARRAY - percentage * FULL_DASH_ARRAY;
        progressCircle.style.strokeDashoffset = offset;

        // Set color based on mode
        if (isRandom) {
            progressCircle.style.stroke = "#8e44ad"; // Purple for Random
        } else {
            const hue = percentage * 210; // Blue to Green for Standard
            progressCircle.style.stroke = `hsl(${hue}, 80%, 50%)`;
        }
    }

    textDisplay.textContent = `${displayMins}:${displaySecs.toString().padStart(2, "0")}`;
}

function startTimer() {
    const progressCircle = document.querySelector(".timer-progress");
    const grid = document.getElementById("bingo-grid");

    // Identify modes based on the grid class we set in startGame
    const isInfinite = grid.classList.contains("infinite-mode");

    // Re-enable transition for timed modes
    if (!isInfinite) {
        progressCircle.style.transition = "stroke-dashoffset 1s linear, stroke 1s linear";
    }

    refreshHUD();

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (isPaused) return;

        if (isInfinite) {
            refreshHUD();
        } else {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                triggerEndGame("⏰ TIME'S UP!", "rgba(192, 57, 43, 0.9)");
                soundDefeat.play();
            }
            refreshHUD();
        }
    }, 1000);
}

/**
 * Formats seconds into a human-readable duration string
 * @param {number} totalSeconds
 * @returns {string} e.g. "2m 14s" or "45s"
 */
function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);

    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

/**
 * Universal Game End
 */
/**
 * Universal Game End - Updated for v1.5.1 Daily Country Challenge
 */
async function triggerEndGame(title, bgColor) {
    const grid = document.getElementById("bingo-grid");
    if (document.getElementById("win-overlay")) return;

    clearInterval(timerInterval);

    // --- NEW: Hide the active game controls ---
    document.getElementById("controls").style.display = "none";

    // Capture the exact moment the game ended
    const endTime = Date.now();

    let finalDuration;
    const isInfinite = grid.classList.contains("infinite-mode");

    if (isInfinite) {
        finalDuration = endTime - gameStartTime - totalPausedTime;
    } else if (timeLeft <= 0) {
        finalDuration = initialTime * 1000;
    } else {
        finalDuration = (initialTime - timeLeft) * 1000;
    }

    // Ensure finalDuration isn't negative or NaN due to early exits
    finalDuration = Math.max(0, finalDuration);

    const absoluteEndTime = gameStartTime + finalDuration;
    document.querySelectorAll(".cell").forEach((c) => (c.onclick = null));

    // 1. Process geocoding FIRST so we have the country data for the challenge
    await processWorldData();

    // 2. Fetch history and identify current game location
    const historyData = await browser.storage.local.get("world_history");
    const history = historyData.world_history || [];
    const lastGame = history[history.length - 1];

    const locationDisplay = lastGame ? lastGame.displayName : "Unknown Location";

    // 3. DAILY COUNTRY CHALLENGE LOGIC
    // Get the global target from our new daily-challenge.js logic
    const dailyTarget = getDailyCountry();
    const playedCountry = lastGame ? lastGame.displayName : "";

    // Update daily stats (Best score / Completion status)
    await updateDailyChallengeProgress(playedCountry, dailyTarget.name, gameData.length);

    // Create the enhanced overlay
    const overlay = document.createElement("div");
    overlay.id = "win-overlay";
    overlay.style.setProperty("--overlay-bg", bgColor);

    overlay.innerHTML = `
        <div class="win-content">
            <h1 class="end-game-title">${title}</h1>
            <div class="end-game-stats">
                <p>Location: <strong>${locationDisplay}</strong></p>
                <p>Items Found: <strong>${gameData.length}</strong></p>
                <p>Final Time: <strong>${formatTime(finalDuration / 1000)}</strong></p>
            </div>
            <div class="end-game-actions">
                <button id="final-map-launch-btn" class="primary-btn">View Findings Map</button>
                <button id="back-to-menu-btn" class="secondary-btn-white">Return to Main Menu</button>
            </div>
        </div>
    `;

    grid.style.position = "relative";
    grid.appendChild(overlay);

    // 4. Update stats and catch Personal Best flag
    const { isNewRecord, updatedStats } = await updateGlobalStats(finalDuration, totalDistanceTraveled);

    if (isNewRecord) {
        showAchievementToast([
            {
                id: "personal_best",
                name: "New Personal Best!",
                icon: "⏱️",
                rarity: "legendary",
            },
        ]);
        soundAchievement.play();
    }

    // 5. Check achievements using the FRESHLY updated stats
    await checkAchievements(finalDuration, updatedStats, totalDistanceTraveled);

    // --- NEW: Event Listener for the Menu Button ---
    document.getElementById("back-to-menu-btn").onclick = () => {
        // This effectively 'resets' the UI for a fresh start
        isPaused = false;
        document.getElementById("mode-menu").style.display = "block";
        document.getElementById("main-header").style.display = "block";
        document.getElementById("timer-container").style.display = "none";
        document.getElementById("active-mode-display").style.display = "none";
        document.getElementById("bingo-grid").innerHTML = "";
        overlay.remove();
    };

    document.getElementById("final-map-launch-btn").addEventListener("click", async () => {
        await browser.storage.local.set({
            current_game: gameData,
            start_time: gameStartTime,
            end_time: absoluteEndTime,
            session_distance: totalDistanceTraveled,
        });
        await openOrFocusTab("map.html");
    });

    // 6. Update UI HUD elements
    updateSidebarStreak();
    updateDailyChallengeHUD(); // Refresh the new Daily Challenge HUD state
}

function parseCoords(url) {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    return match ? { lat: parseFloat(match[1]), lng: parseFloat(match[2]) } : null;
}

async function updateGlobalStats(finalDuration, distance) {
    const data = await browser.storage.local.get(["global_stats", "current_game_mode"]);

    let global = data.global_stats || {};
    if (!global.itemCounts) global.itemCounts = {};
    if (!global.modeCounts) global.modeCounts = { Standard: 0, Random: 0, Infinite: 0 };

    if (typeof global.totalBingos !== "number") {
        global.totalBingos = 0;
    }

    const modeName = data.current_game_mode || "Standard";
    global.modeCounts[modeName] = (global.modeCounts[modeName] || 0) + 1;

    global.totalAttempts = (global.totalAttempts || 0) + 1;
    global.totalPlaytime = (global.totalPlaytime || 0) + finalDuration;

    // 2. Daily Streak Logic
    const now = new Date();
    // Normalize "now" to the start of today for date comparison
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (global.lastPlayedTimestamp) {
        const lastDate = new Date(global.lastPlayedTimestamp);
        const lastStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();

        const diff = todayStart - lastStart;

        if (diff === oneDayMs) {
            // Played exactly yesterday
            global.currentStreak += 1;
        } else if (diff > oneDayMs) {
            // Missed a day or more
            global.currentStreak = 1;
        }
        // If diff === 0, they already played today, streak stays the same
    } else {
        // First game ever
        global.currentStreak = 1;
    }
    global.lastPlayedTimestamp = todayStart;

    // 3. Bingo & Records
    const isBingo = gameData.length === 25;
    let isNewRecord = false;

    if (isBingo) {
        global.totalBingos += 1;
        if (!global.fastestFullBoard || finalDuration < global.fastestFullBoard) {
            global.fastestFullBoard = finalDuration;
            isNewRecord = true;
        }
    }

    // 4. History & Item Counts
    const isInfinite = document.getElementById("timer-container").style.display === "none";
    const gameStatus = timeLeft <= 0 && !isBingo && !isInfinite ? "Timed Out" : "Completed";

    const gameSummary = {
        date: now.toLocaleDateString("en-GB"), // Force UK format for consistency
        status: gameStatus,
        itemsFound: gameData.length,
        duration: finalDuration,
        mode: modeName,
    };

    if (!global.history) global.history = [];
    global.history.unshift(gameSummary);
    if (global.history.length > 5) global.history.pop();

    gameData.forEach((find) => {
        global.itemCounts[find.item] = (global.itemCounts[find.item] || 0) + 1;
    });

    global.totalCareerDistance = (global.totalCareerDistance || 0) + distance;

    await browser.storage.local.set({ global_stats: global });
    return { isNewRecord, updatedStats: global };
}

async function checkAchievements(finalDuration, stats, totalDistanceTraveled) {
    const data = await browser.storage.local.get(["achievements", "world_history", "achievement_dates"]);
    const history = data.world_history || [];
    const lastGame = history[history.length - 1];
    const earnedDates = data.achievement_dates || {};
    let earned = data.achievements || [];
    let newUnlocks = [];

    const isInfinite = document.getElementById("bingo-grid").classList.contains("infinite-mode");

    const now = new Date();
    const isLeetTime = now.getHours() === 13 && now.getMinutes() === 37;
    const isBingo = gameData.length === 25;
    const uniqueCountries = new Set(history.map((game) => game.country)).size;

    // Identify if the game just finished was Random
    const currentMode = stats.history[0]?.mode || "Standard";

    // Calculate Random Mode Wins
    const randomWins = history.filter((game) => game.mode === "Random" && game.isBingo).length;

    const firstFind = gameData[0];
    const firstFindTime = firstFind ? new Date(firstFind.timestamp).getTime() - gameStartTime : null;

    const sortedFinds = [...gameData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const doubleTapAchieved = sortedFinds.some((find, index) => {
        if (index === 0) return false;
        const current = new Date(find.timestamp).getTime();
        const previous = new Date(sortedFinds[index - 1].timestamp).getTime();
        return current - previous <= 2000;
    });

    const visited = (placeName) =>
        history.some(
            (game) =>
                (game.city && game.city.toLowerCase().includes(placeName.toLowerCase())) ||
                (game.country && game.country.toLowerCase().includes(placeName.toLowerCase())),
        );

    // logic for Animal Planet: "Find a Dog or Cat in 5 different countries"
    const animalCountries = new Set(
        history.filter((g) => g.foundItems && g.foundItems.includes("Dog or Cat")).map((g) => g.country),
    ).size;

    // logic for Point of Interest: Check if any find reached a streak of 5
    const maxLocationStreak = Math.max(...gameData.map((f) => f.locationStreak || 0), 0);

    // --- LOGIC MAP ---
    const logicMap = {
        first_bingo: isBingo,
        speed_demon: isBingo && finalDuration < 300000,
        gardener: (stats.itemCounts["Lawnmower"] || 0) >= 5,
        caravan_hunter: (stats.itemCounts["Caravan"] || 0) >= 5,
        master_hunter: ITEMS.every((item) => (stats.itemCounts[item] || 0) >= 5),
        world_traveler: uniqueCountries >= 5,
        marathoner: stats.totalPlaytime >= 3600000,
        london_calling: visited("london"),
        the_patriot:
            gameData.some((f) => f.item === "A Flag") &&
            (lastGame?.country.toLowerCase().includes("united states") ||
                lastGame?.country.toLowerCase().includes("usa")),
        quick_start: firstFindTime !== null && firstFindTime < 5000,
        animal_lover: (stats.itemCounts["Dog or Cat"] || 0) >= 10,
        double_tap: doubleTapAchieved,
        the_commuter:
            (stats.itemCounts["Bicycle"] || 0) >= 10 &&
            (stats.itemCounts["Motorbike or Quadbike"] || 0) >= 10 &&
            (stats.itemCounts["Caravan"] || 0) >= 10,
        logistics_expert:
            (stats.itemCounts["Work van (with signage)"] || 0) >= 10 &&
            (stats.itemCounts["Trailer"] || 0) >= 10 &&
            (stats.itemCounts["A Ladder"] || 0) >= 10,
        high_vis_hero: (stats.itemCounts["Person wearing Hi-Vis"] || 0) >= 20,
        island_hopper: visited("united kingdom") && visited("australia"),
        scandinavian_scout: visited("norway") && visited("sweden") && visited("denmark"),
        elite_explorer: isBingo && isLeetTime,
        bingo_down_under: isBingo && lastGame?.country.toLowerCase().includes("australia"),
        local_legend: isBingo && totalDistanceTraveled <= 1000,
        chaos_tamer: isBingo && currentMode === "Random",
        adapt_overcome: randomWins >= 5,
        rng_master: isBingo && currentMode === "Random" && finalDuration < 300000,
        perfect_seed: isBingo && totalDistanceTraveled < 500,
        neighbourhood_watch: isBingo && totalDistanceTraveled <= 2000,
        point_of_interest: maxLocationStreak >= 5,
        animal_planet: animalCountries >= 5,
        close_call: isBingo && !isInfinite && timeLeft > 0 && timeLeft <= 10,
    };

    // --- DYNAMIC STREAK MILESTONES ---
    // This loops through your required numbers and adds them to the logicMap automatically
    const streakMilestones = [3, 5, 7, 10, 20, 30, 50, 75, 100];
    streakMilestones.forEach((count) => {
        logicMap[`streak_${count}`] = stats.currentStreak >= count;
    });

    // --- DYNAMIC DAILY HERO MILESTONES ---
    // This checks how many unique daily challenges have been won
    const dailyHeroMilestones = [1, 5, 10];
    const totalDailyWins = stats.dailyChallengeWins || 0;

    dailyHeroMilestones.forEach((count) => {
        logicMap[`daily_hero_${count}`] = totalDailyWins >= count;
    });

    const today = new Date().toLocaleDateString("en-GB");

    ACH_DATA.forEach((ach) => {
        if (logicMap[ach.id] && !earned.includes(ach.id)) {
            earned.push(ach.id);
            newUnlocks.push(ach);
            earnedDates[ach.id] = today;
        }
    });

    if (newUnlocks.length > 0) {
        await browser.storage.local.set({
            achievements: earned,
            achievement_dates: earnedDates,
        });

        showAchievementToast(newUnlocks);
        soundAchievement.play();
    }
}

function showAchievementToast(unlockedObjects) {
    let container = document.getElementById("achievement-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "achievement-container";
        document.body.appendChild(container);
    }

    unlockedObjects.forEach((ach, index) => {
        setTimeout(() => {
            const toast = document.createElement("div");

            const randomAchIds = ["chaos_tamer", "adapt_overcome", "rng_master"];
            const isRandomAch = randomAchIds.includes(ach.id);

            const toastClass = ach.id === "personal_best" ? "legendary" : isRandomAch ? "random-category" : ach.type;
            toast.className = `achievement-toast ${toastClass}`;

            const headerText = ach.id === "personal_best" ? "Record Broken!" : "Achievement Unlocked!";

            toast.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="ach-icon-wrap">
                        <span class="ach-icon">${ach.icon}</span>
                    </div>
                    <div>
                        <strong style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9;">
                            ${headerText}
                        </strong>
                        <p style="margin: 1px 0 0 0; font-size: 1.05rem; font-weight: bold; line-height: 1.2;">
                            ${ach.name}
                        </p>
                    </div>
                </div>
            `;

            toast.addEventListener("click", () => {
                openOrFocusTab(`achievements.html#${ach.id}`);
            });

            container.appendChild(toast);
            setTimeout(() => toast.classList.add("show"), 10);

            setTimeout(() => {
                toast.classList.remove("show");
                setTimeout(() => toast.remove(), 500);
            }, 4000);
        }, index * 400);
    });
}

async function processWorldData() {
    if (gameData.length === 0) return;
    const totals = gameData.reduce(
        (acc, f) => {
            acc.lat += f.coords.lat;
            acc.lng += f.coords.lng;
            return acc;
        },
        { lat: 0, lng: 0 },
    );

    const avgLat = totals.lat / gameData.length;
    const avgLng = totals.lng / gameData.length;

    let locationName = "Unknown Location";
    let countryName = "Unknown Country";
    let displayName = "Unknown Location";

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${avgLat}&lon=${avgLng}&format=json&zoom=10&accept-language=en`, // Added &accept-language=en
            {
                headers: { "User-Agent": "StreetViewBingo/1.0" },
            },
        );
        const data = await response.json();

        locationName = data.address.city || data.address.town || data.address.village || "Remote Area";
        countryName = data.address.country || "Unknown Country";
        displayName = data.display_name || "Unknown Location";
    } catch (e) {
        console.error("Geocoding failed", e);
    }

    // NEW: Get the mode that was saved at the start of the game
    const sessionData = await browser.storage.local.get("current_game_mode");
    const modeName = sessionData.current_game_mode || "Standard";

    const storage = await browser.storage.local.get("world_history");
    const worldHistory = storage.world_history || [];
    worldHistory.push({
        lat: avgLat,
        lng: avgLng,
        city: locationName,
        country: countryName,
        displayName: displayName,
        found: gameData.length,
        foundItems: gameData.map((f) => f.item),
        isBingo: gameData.length === 25,
        mode: modeName,
        timestamp: Date.now(),
    });
    await browser.storage.local.set({ world_history: worldHistory });
}

// Helper to switch to an existing tab or open a new one
async function openOrFocusTab(fileWithHash) {
    const [fileName, hash] = fileWithHash.split("#");
    const baseUrl = browser.runtime.getURL(fileName);
    const fullUrl = browser.runtime.getURL(fileWithHash);

    // Check for the tab using the base URL (ignoring the hash for the query)
    const tabs = await browser.tabs.query({ url: baseUrl + "*" });

    if (tabs.length > 0) {
        await browser.windows.update(tabs[0].windowId, { focused: true });
        await browser.tabs.update(tabs[0].id, { active: true, url: fullUrl });
        // Reload is often necessary to trigger the hash-change logic if already open
        await browser.tabs.reload(tabs[0].id);
    } else {
        browser.tabs.create({ url: fullUrl });
    }
}

// Helper function for opening external links
async function openOrFocusExternal(targetUrl) {
    // Check for any tab that contains "google.com/maps"
    const tabs = await browser.tabs.query({ url: "*://*.google.com/maps*" });

    if (tabs.length > 0) {
        await browser.windows.update(tabs[0].windowId, { focused: true });
        await browser.tabs.update(tabs[0].id, { active: true });
    } else {
        browser.tabs.create({ url: targetUrl });
    }
}

async function updateSidebarStreak() {
    const data = await browser.storage.local.get("global_stats");
    const stats = data.global_stats || { currentStreak: 0 };

    const countEl = document.getElementById("sidebar-streak-count");
    const hintEl = document.getElementById("sidebar-streak-hint");

    const current = stats.currentStreak || 0;
    countEl.innerText = `${current} Day${current === 1 ? "" : "s"}`;

    // Find next milestone for the hint
    const milestones = [3, 5, 7, 10, 20, 30, 50, 75, 100];
    const next = milestones.find((m) => m > current);

    if (next) {
        hintEl.innerText = `Next Goal: ${next} days`;
    } else {
        hintEl.innerText = `MAX 🔥`;
    }
}
updateSidebarStreak();

/**
 * NEW: Animated Grid Generation for Random Mode
 * This creates a more dynamic feel when starting a random board game
 */
function generateGridWithAnimation() {
    const grid = document.getElementById("bingo-grid");
    grid.innerHTML = "";

    // Get the center point of the grid container
    const gridRect = grid.getBoundingClientRect();
    const centerX = gridRect.width / 2;
    const centerY = gridRect.height / 2;

    ITEMS.forEach((item, index) => {
        const cell = document.createElement("div");
        cell.className = "cell shuffling";

        // Temporarily add to DOM to get its dimensions/position for math
        grid.appendChild(cell);

        const cellRect = cell.getBoundingClientRect();
        const cellCenterX = cell.offsetLeft + cellRect.width / 2;
        const cellCenterY = cell.offsetTop + cellRect.height / 2;

        // Calculate the distance from this cell to the grid center
        const diffX = centerX - cellCenterX;
        const diffY = centerY - cellCenterY;

        // Set CSS variables so the animation knows where 'center' is for THIS cell
        cell.style.setProperty("--center-x", `${diffX}px`);
        cell.style.setProperty("--center-y", `${diffY}px`);

        // Stagger the animation
        cell.style.animationDelay = `${index * 0.04}s`;

        cell.innerHTML = `<span>${item}</span>`;
        cell.onclick = () => handleCapture(item, cell);

        // Cleanup: remove the class after animation to re-enable hover styles
        setTimeout(
            () => {
                cell.classList.remove("shuffling");
            },
            800 + index * 40,
        );
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // pause button logic
    document.getElementById("pause-btn").onclick = togglePause;
    document.getElementById("resume-btn").onclick = togglePause;

    document.getElementById("btn-10min").onclick = () => startGame("10min");
    document.getElementById("btn-random").onclick = () => startGame("random");
    document.getElementById("btn-infinite").onclick = () => startGame("infinite");
    document.getElementById("view-achievements-btn").onclick = () => openOrFocusTab("achievements.html");
    document.getElementById("view-stats-btn").onclick = () => openOrFocusTab("stats.html");
    document.getElementById("view-world-btn").onclick = () => openOrFocusTab("world.html");
    document.getElementById("btn-settings").onclick = () => openOrFocusTab("settings.html");

    // Finish and Save Logic
    document.getElementById("finish-btn").onclick = () => {
        if (gameData.length === 0) {
            alert("You haven't found any items yet!");
            return;
        }

        if (confirm("End game and save your findings to your stats and map?")) {
            // Trigger the same logic as a timeout or Bingo
            triggerEndGame("🏁 SESSION COMPLETE", "rgba(52, 152, 219, 0.9)");
        }
    };

    // Update the existing Reset logic to be the "Discard" button
    document.getElementById("reset-btn").onclick = async () => {
        if (confirm("Discard this game? No items found will be saved to your history.")) {
            clearInterval(timerInterval);
            isPaused = false;

            // Return to main menu without calling triggerEndGame
            document.getElementById("pause-overlay").style.display = "none";
            document.getElementById("bingo-grid").style.filter = "none";
            document.getElementById("bingo-grid").style.pointerEvents = "auto";
            gameData = [];

            document.getElementById("mode-menu").style.display = "block";
            document.getElementById("main-header").style.display = "block";
            document.getElementById("controls").style.display = "none";
            document.getElementById("timer-container").style.display = "none";
            document.getElementById("active-mode-display").style.display = "none";
            document.getElementById("bingo-grid").innerHTML = "";

            const overlay = document.getElementById("win-overlay");
            if (overlay) overlay.remove();
        }
    };

    const launchMapsBtn = document.getElementById("launch-maps-btn");
    if (launchMapsBtn) {
        launchMapsBtn.onclick = () => {
            // We use a simplified version of our helper for external URLs
            openOrFocusExternal("https://www.google.com/maps");
        };
    }

    // NEW: Initialize the Daily Challenge HUD
    if (typeof updateDailyChallengeHUD === "function") {
        updateDailyChallengeHUD();
    }
});
