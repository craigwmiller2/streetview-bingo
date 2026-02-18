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
const FULL_DASH_ARRAY = 283;

/**
 * Game State Controller with Countdown
 */
window.startGame = function (mode) {
    // 1. Initial UI Setup (Happens immediately)
    document.getElementById("mode-menu").style.display = "none";
    document.getElementById("main-header").style.display = "none";
    document.getElementById("controls").style.display = "block";
    gameData = [];
    generateGrid();

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
        } else {
            clearInterval(countdownInterval);
            overlay.style.display = "none";

            // Start the Game
            gameStartTime = Date.now();
            if (mode === "10min") {
                timeLeft = initialTime;
                document.getElementById("timer-container").style.display = "block";
                startTimer();
            } else {
                document.getElementById("timer-container").style.display = "none";
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
    if (document.getElementById("timer-container").style.display === "none") return; // Only for 10min mode

    isPaused = !isPaused;
    const overlay = document.getElementById("pause-overlay");
    const grid = document.getElementById("bingo-grid");

    if (isPaused) {
        overlay.style.display = "flex";
        grid.style.pointerEvents = "none"; // Disable all clicks on the grid
        grid.style.filter = "blur(4px)";
    } else {
        overlay.style.display = "none";
        grid.style.pointerEvents = "auto";
        grid.style.filter = "none";
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

        gameData.push(find);
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

        checkWinCondition();
    } catch (error) {
        cellElement.classList.remove("capturing");
        cellElement.innerHTML = originalContent;
        if (error.message === "WrongTab") alert("Switch to Google Maps!");
    }
}

function handleUndo(itemName, cellElement) {
    const index = gameData.map((f) => f.item).lastIndexOf(itemName);
    if (index > -1) gameData.splice(index, 1);

    cellElement.classList.remove("found");
    cellElement.style.backgroundImage = "none";
    cellElement.innerHTML = `<span>${itemName}</span>`;
    cellElement.onclick = () => handleCapture(itemName, cellElement);
}

function startTimer() {
    const progressCircle = document.querySelector(".timer-progress");
    const textDisplay = document.getElementById("timer-text");
    const pauseBtn = document.getElementById("pause-btn");

    progressCircle.style.strokeDasharray = `${FULL_DASH_ARRAY} ${FULL_DASH_ARRAY}`;

    const updateUI = () => {
        const percentage = Math.max(0, timeLeft / initialTime);
        const hue = percentage * 210;
        progressCircle.style.stroke = `hsl(${hue}, 80%, 50%)`;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        textDisplay.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
        const offset = FULL_DASH_ARRAY - percentage * FULL_DASH_ARRAY;
        progressCircle.style.strokeDashoffset = offset;

        if (timeLeft <= 10 && timeLeft > 0 && !isPaused) {
            // Check pause here
            progressCircle.style.animation = "pulse 0.5s infinite alternate";
            soundTick.currentTime = 0;
            soundTick.play().catch(() => {});
        } else {
            progressCircle.style.animation = "none";
        }
    };

    updateUI();

    // Clear any existing interval before starting a new one
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (isPaused) return; // THE PAUSE LOGIC

        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeLeft = 0;
            updateUI();
            soundDefeat.play();
            triggerEndGame("⏰ TIME'S UP!", "rgba(192, 57, 43, 0.9)");
        } else {
            updateUI();
        }
    }, 1000);
}

function checkWinCondition() {
    if (document.querySelectorAll(".cell.found").length === 25) {
        clearInterval(timerInterval);
        soundBingo.play();
        triggerEndGame("🏆 BOARD CLEARED!", "rgba(46, 204, 113, 0.9)");
    }
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

    let finalDuration;
    const isInfinite = document.getElementById("timer-container").style.display === "none";

    if (isInfinite) {
        finalDuration = Date.now() - gameStartTime;
    } else if (timeLeft <= 0) {
        finalDuration = initialTime * 1000;
    } else {
        finalDuration = (initialTime - timeLeft) * 1000;
    }

    const absoluteEndTime = gameStartTime + finalDuration;
    document.querySelectorAll(".cell").forEach((c) => (c.onclick = null));

    // 1. Process geocoding FIRST so we have the country data for the challenge
    await processWorldData();

    // 2. Fetch history and identify current game location
    const historyData = await browser.storage.local.get("world_history");
    const history = historyData.world_history || [];
    const lastGame = history[history.length - 1];
    const locationDisplay = lastGame ? `${lastGame.city}, ${lastGame.country}` : "Unknown Location";

    // 3. DAILY COUNTRY CHALLENGE LOGIC
    // Get the global target from our new daily-challenge.js logic
    const dailyTarget = getDailyCountry();
    const playedCountry = lastGame ? lastGame.country : "";

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
            <button id="final-map-launch-btn" class="primary-btn">View Findings Map</button>
        </div>
    `;

    grid.style.position = "relative";
    grid.appendChild(overlay);

    // 4. Update stats and catch Personal Best flag
    const { isNewRecord, updatedStats } = await updateGlobalStats(finalDuration);

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
    await checkAchievements(finalDuration, updatedStats);

    document.getElementById("final-map-launch-btn").addEventListener("click", async () => {
        await browser.storage.local.set({
            current_game: gameData,
            start_time: gameStartTime,
            end_time: absoluteEndTime,
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

async function updateGlobalStats(finalDuration) {
    const data = await browser.storage.local.get("global_stats");
    // let global = data.global_stats || {
    //     totalAttempts: 0,
    //     totalBingos: 0,
    //     itemCounts: {},
    //     fastestFullBoard: null,
    //     history: [],
    //     totalPlaytime: 0, // NEW
    //     currentStreak: 0, // NEW
    //     lastPlayedTimestamp: null, // NEW
    // };

    let global = data.global_stats || {};
    if (!global.itemCounts) global.itemCounts = {}; // CRITICAL FIX

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
    };

    if (!global.history) global.history = [];
    global.history.unshift(gameSummary);
    if (global.history.length > 5) global.history.pop();

    gameData.forEach((find) => {
        global.itemCounts[find.item] = (global.itemCounts[find.item] || 0) + 1;
    });

    await browser.storage.local.set({ global_stats: global });
    return { isNewRecord, updatedStats: global };
}

async function checkAchievements(finalDuration, stats) {
    const data = await browser.storage.local.get(["achievements", "world_history", "achievement_dates"]);
    const history = data.world_history || [];
    const lastGame = history[history.length - 1];
    const earnedDates = data.achievement_dates || {};
    let earned = data.achievements || [];
    let newUnlocks = [];

    const now = new Date();
    const isLeetTime = now.getHours() === 13 && now.getMinutes() === 37;
    const isBingo = gameData.length === 25;
    const uniqueCountries = new Set(history.map((game) => game.country)).size;

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
    };

    // --- DYNAMIC STREAK MILESTONES ---
    // This loops through your required numbers and adds them to the logicMap automatically
    const streakMilestones = [3, 5, 7, 10, 20, 30, 50, 75, 100];
    streakMilestones.forEach((count) => {
        logicMap[`streak_${count}`] = stats.currentStreak >= count;
    });

    // --- DYNAMIC DAILY HERO MILESTONES ---
    // This checks how many unique daily challenges have been won
    const dailyHeroMilestones = [1, 5, 10, 25, 50];
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

            // Logic: Personal Best defaults to 'legendary' styling,
            // otherwise use the new achievement 'type'
            const toastClass = ach.id === "personal_best" ? "legendary" : ach.type;
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
    } catch (e) {
        console.error("Geocoding failed", e);
    }

    const storage = await browser.storage.local.get("world_history");
    const worldHistory = storage.world_history || [];
    worldHistory.push({
        lat: avgLat,
        lng: avgLng,
        city: locationName,
        country: countryName,
        found: gameData.length,
        isBingo: gameData.length === 25,
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

document.addEventListener("DOMContentLoaded", () => {
    // pause button logic
    document.getElementById("pause-btn").onclick = togglePause;
    document.getElementById("resume-btn").onclick = togglePause;

    document.getElementById("btn-10min").onclick = () => startGame("10min");
    document.getElementById("btn-infinite").onclick = () => startGame("infinite");
    document.getElementById("view-achievements-btn").onclick = () => openOrFocusTab("achievements.html");
    document.getElementById("view-stats-btn").onclick = () => openOrFocusTab("stats.html");
    document.getElementById("view-world-btn").onclick = () => openOrFocusTab("world.html");
    document.getElementById("btn-settings").onclick = () => openOrFocusTab("settings.html");

    document.getElementById("reset-btn").onclick = async () => {
        if (confirm("Reset game?")) {
            clearInterval(timerInterval);
            isPaused = false;
            document.getElementById("pause-overlay").style.display = "none";
            document.getElementById("bingo-grid").style.filter = "none";
            document.getElementById("bingo-grid").style.pointerEvents = "auto";
            gameData = [];
            document.getElementById("mode-menu").style.display = "block";
            document.getElementById("main-header").style.display = "block";
            document.getElementById("controls").style.display = "none";
            document.getElementById("timer-container").style.display = "none";
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
