const ITEMS = [
    "Lawnmower",
    "Trampoline",
    "Hose Reel",
    "Dog or Cat",
    "BBQ",
    "Motorbike or Quadbike",
    "A Flag",
    "Someone looking directly at Street View Car",
    "A Satellite Dish",
    "Air Conditioning Unit",
    "Graffiti",
    "Wheely Bin",
    "Wheelbarrow",
    "Bicycle",
    "Caravan",
    "Person wearing Hi-Vis",
    "Vehicle with roof rack",
    "Outdoor chair/bench",
    "Playground equipment",
    "Plant/Flower Pot",
    "Work van (with signage)",
    "Trailer",
    "Post/Letter Box",
    "Speed Limit Sign",
    "A Ladder",
];

const soundTick = new Audio(browser.runtime.getURL("audio/tick.mp3"));
const soundBingo = new Audio(browser.runtime.getURL("audio/bingo.mp3"));
const soundDefeat = new Audio(browser.runtime.getURL("audio/defeat.mp3"));
const soundAchievement = new Audio(browser.runtime.getURL("audio/achievement.ogg"));

soundTick.load();
soundBingo.load();
soundDefeat.load();
soundAchievement.load();

let gameData = [];
let timerInterval = null;
let timeLeft = 0;
let initialTime = 60; // Default 10 mins
let gameStartTime = null;
const FULL_DASH_ARRAY = 283; // 2 * PI * radius (45)

/**
 * Game State Controller: Triggered by Menu Buttons
 */
window.startGame = function (mode) {
    gameStartTime = Date.now();
    document.getElementById("mode-menu").style.display = "none";
    document.getElementById("main-header").style.display = "none"; // ADD THIS: Hide header
    document.getElementById("controls").style.display = "block";
    gameData = [];
    generateGrid();

    if (mode === "10min") {
        timeLeft = initialTime;
        document.getElementById("timer-container").style.display = "block";
        startTimer();
    } else {
        document.getElementById("timer-container").style.display = "none";
    }
};

/**
 * Initializes the 5x5 Bingo Grid
 */
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

/**
 * Handles the capture process
 */
async function handleCapture(itemName, cellElement) {
    if (cellElement.classList.contains("found") || cellElement.classList.contains("capturing")) return;

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

        // 1. Set the text first
        cellElement.innerHTML = `<span>${itemName}</span>`;

        // 2. NOW add the undo button so it stays on top
        const undoBtn = document.createElement("button");
        undoBtn.className = "undo-btn";
        undoBtn.innerHTML = "✕";
        undoBtn.title = "Undo capture";
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
    if (index > -1) {
        gameData.splice(index, 1);
    }

    cellElement.classList.remove("found");
    cellElement.style.backgroundImage = "none";
    cellElement.innerHTML = `<span>${itemName}</span>`; // Restore the original text

    // Re-assign the click listener
    cellElement.onclick = () => handleCapture(itemName, cellElement);
}

/**
 * Circular Countdown Logic
 */
function startTimer() {
    const progressCircle = document.querySelector(".timer-progress");
    const textDisplay = document.getElementById("timer-text");

    progressCircle.style.strokeDasharray = `${FULL_DASH_ARRAY} ${FULL_DASH_ARRAY}`;

    // Helper to update the UI so we can call it immediately AND in the interval
    const updateUI = () => {
        const percentage = Math.max(0, timeLeft / initialTime);

        // Update Color
        const hue = percentage * 210;
        progressCircle.style.stroke = `hsl(${hue}, 80%, 50%)`;

        // Update Text
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        textDisplay.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;

        // Update Circle
        const offset = FULL_DASH_ARRAY - percentage * FULL_DASH_ARRAY;
        progressCircle.style.strokeDashoffset = offset;

        // Audio & Pulse Logic
        if (timeLeft <= 10 && timeLeft > 0) {
            progressCircle.style.animation = "pulse 0.5s infinite alternate";

            // Play tick sound
            soundTick.currentTime = 0;
            soundTick.play().catch((e) => console.log("Audio blocked: click sidebar first"));
        } else {
            progressCircle.style.animation = "none";
        }
    };

    // Run once immediately so it doesn't "jump" after 1 second
    updateUI();

    timerInterval = setInterval(() => {
        timeLeft--;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeLeft = 0;
            updateUI(); // One final update to ensure color is pure red
            soundDefeat.play();
            triggerEndGame("⏰ TIME'S UP!", "rgba(192, 57, 43, 0.9)");
        } else {
            updateUI();
        }
    }, 1000);
}

function checkWinCondition() {
    const totalCells = 25;
    const foundCells = document.querySelectorAll(".cell.found").length;

    if (foundCells === totalCells) {
        clearInterval(timerInterval);
        soundBingo.play();
        triggerEndGame("🏆 BOARD CLEARED!", "rgba(46, 204, 113, 0.9)");
    }
}

/**
 * Universal Game End (Win or Time Out)
 */
async function triggerEndGame(title, bgColor) {
    const grid = document.getElementById("bingo-grid");
    // Prevent multiple overlays if both timer and bingo trigger at once
    if (document.getElementById("win-overlay")) return;

    // 1. Immediately stop the timer to freeze 'timeLeft'
    clearInterval(timerInterval);

    let finalDuration;
    const isInfinite = document.getElementById("timer-container").style.display === "none";

    // 2. Calculate duration based on mode
    if (isInfinite) {
        // High-precision timing for Infinite mode
        finalDuration = Date.now() - gameStartTime;
    } else if (timeLeft <= 0) {
        // Force exactly the initial time if they ran out of time
        finalDuration = initialTime * 1000;
    } else {
        // SYNC FIX: Calculate based on visible clock seconds
        // (Initial Seconds - Remaining Seconds) * 1000
        const secondsElapsed = initialTime - timeLeft;
        finalDuration = secondsElapsed * 1000;
    }

    // Capture the specific endTime we will use for storage
    const absoluteEndTime = gameStartTime + finalDuration;

    // UI Cleanup
    document.querySelectorAll(".cell").forEach((c) => (c.onclick = null));

    const overlay = document.createElement("div");
    overlay.id = "win-overlay";
    overlay.style.backgroundColor = bgColor;
    overlay.innerHTML = `
        <div class="win-content">
            <h1>${title}</h1>
            <p>You found ${gameData.length} items.</p>
            <button id="final-map-launch-btn">View Findings Map</button>
        </div>
    `;

    grid.style.position = "relative";
    grid.appendChild(overlay);

    // Save stats and setup map launch
    await updateGlobalStats(finalDuration);
    await processWorldData();
    await checkAchievements(finalDuration);

    document.getElementById("final-map-launch-btn").addEventListener("click", async () => {
        await browser.storage.local.set({
            current_game: gameData,
            start_time: gameStartTime,
            end_time: absoluteEndTime,
        });
        browser.tabs.create({ url: browser.runtime.getURL("map.html") });
    });
}

function parseCoords(url) {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    return match ? { lat: parseFloat(match[1]), lng: parseFloat(match[2]) } : null;
}

/**
 * Reset / Return to Menu
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Hook up the Menu Buttons
    const btn10min = document.getElementById("btn-10min");
    const btnInfinite = document.getElementById("btn-infinite");

    if (btn10min) {
        btn10min.addEventListener("click", () => {
            console.log("Starting 10-minute mode...");
            startGame("10min");
        });
    }

    if (btnInfinite) {
        btnInfinite.addEventListener("click", () => {
            console.log("Starting Infinite mode...");
            startGame("infinite");
        });
    }

    const viewAchievementsBtn = document.getElementById("view-achievements-btn");
    if (viewAchievementsBtn) {
        viewAchievementsBtn.addEventListener("click", () => {
            browser.tabs.create({ url: browser.runtime.getURL("achievements.html") });
        });
    }

    const viewStatsBtn = document.getElementById("view-stats-btn");
    if (viewStatsBtn) {
        viewStatsBtn.addEventListener("click", () => {
            browser.tabs.create({ url: browser.runtime.getURL("stats.html") });
        });
    }

    const viewWorldBtn = document.getElementById("view-world-btn");
    if (viewWorldBtn) {
        viewWorldBtn.addEventListener("click", () => {
            browser.tabs.create({ url: browser.runtime.getURL("world.html") });
        });
    }

    // 2. Hook up the Reset Button
    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            if (confirm("Reset game?")) {
                clearInterval(timerInterval);
                gameData = [];
                await browser.storage.local.remove("current_game");

                // UI Reset
                document.getElementById("mode-menu").style.display = "block";
                document.getElementById("main-header").style.display = "block"; // ADD THIS: Show header
                document.getElementById("controls").style.display = "none";
                document.getElementById("timer-container").style.display = "none";
                document.getElementById("bingo-grid").innerHTML = "";
                const overlay = document.getElementById("win-overlay");
                if (overlay) overlay.remove();
            }
        });
    }
});

async function updateGlobalStats(finalDuration) {
    const stats = await browser.storage.local.get("global_stats");

    // 1. Ensure history exists in the initial state
    let global = stats.global_stats || {
        totalAttempts: 0,
        totalBingos: 0,
        itemCounts: {},
        fastestFullBoard: null,
        history: [], // Added this
    };

    global.totalAttempts += 1;
    const isBingo = gameData.length === 25;

    if (isBingo) {
        global.totalBingos += 1;
        if (!global.fastestFullBoard || finalDuration < global.fastestFullBoard) {
            global.fastestFullBoard = finalDuration;
        }
    }

    // 2. Create the summary for the history table
    // Check if we are in Infinite mode (no timer) so we don't accidentally mark it as a Timeout
    const isInfinite = document.getElementById("timer-container").style.display === "none";
    const gameStatus = timeLeft <= 0 && !isBingo && !isInfinite ? "Timed Out" : "Completed";

    const gameSummary = {
        date: new Date().toLocaleDateString(),
        status: gameStatus, // Use the new variable here
        itemsFound: gameData.length,
        duration: finalDuration,
    };

    // 3. Keep only the 5 most recent games
    if (!global.history) global.history = []; // Safety check
    global.history.unshift(gameSummary);
    if (global.history.length > 5) {
        global.history.pop();
    }

    // Existing item frequency tracking
    gameData.forEach((find) => {
        global.itemCounts[find.item] = (global.itemCounts[find.item] || 0) + 1;
    });

    await browser.storage.local.set({ global_stats: global });
}

async function checkAchievements(finalDuration) {
    const data = await browser.storage.local.get(["global_stats", "achievements"]);
    const stats = data.global_stats || { itemCounts: {} };
    let earned = data.achievements || [];
    let newUnlocks = [];

    const isBingo = gameData.length === 25;

    // Map your logic directly to the centralized IDs
    const logicMap = {
        first_bingo: isBingo,
        speed_demon: isBingo && finalDuration < 300000,
        gardener: (stats.itemCounts["Lawnmower"] || 0) >= 5,
        master_hunter: ITEMS.every((item) => (stats.itemCounts[item] || 0) >= 5),
    };

    ACH_DATA.forEach((ach) => {
        if (logicMap[ach.id] && !earned.includes(ach.id)) {
            earned.push(ach.id);
            newUnlocks.push(ach); // Push the WHOLE object, not just the name
        }
    });

    if (newUnlocks.length > 0) {
        await browser.storage.local.set({ achievements: earned });
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
            // Dynamically add 'green' or 'gold' based on ACH_DATA
            toast.className = `achievement-toast ${ach.rarity}`;

            toast.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="ach-icon">${ach.icon}</span>
                    <div>
                        <strong style="font-size: 0.8rem; text-transform: uppercase; opacity: 0.8;">
                            Achievement Unlocked!
                        </strong>
                        <p style="margin: 2px 0 0 0; font-size: 1.1rem; font-weight: bold;">
                            ${ach.name}
                        </p>
                    </div>
                </div>
            `;

            container.appendChild(toast);
            setTimeout(() => toast.classList.add("show"), 10);

            setTimeout(() => {
                toast.classList.remove("show");
                setTimeout(() => toast.remove(), 500);
            }, 4000);
        }, index * 400);
    });
}

async function processWorldData(finalDuration) {
    if (gameData.length === 0) return;

    // 1. Calculate Average Point
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

    // 2. Reverse Geocode (Nominatim)
    let locationName = "Unknown Location";
    let countryName = "Unknown Country";

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${avgLat}&lon=${avgLng}&format=json&zoom=10`,
            {
                headers: { "User-Agent": "StreetViewBingo/1.0" },
            },
        );
        const data = await response.json();
        // Get City/Town/Village
        locationName =
            data.address.city || data.address.town || data.address.village || data.address.suburb || "Remote Area";
        countryName = data.address.country || "Unknown Country";
    } catch (e) {
        console.error("Geocoding failed", e);
    }

    // 3. Save to world_history
    const storage = await browser.storage.local.get("world_history");
    const worldHistory = storage.world_history || [];

    const newPoint = {
        lat: avgLat,
        lng: avgLng,
        city: locationName,
        country: countryName,
        found: gameData.length,
        isBingo: gameData.length === 25,
        timestamp: Date.now(),
    };

    worldHistory.push(newPoint);
    await browser.storage.local.set({ world_history: worldHistory });
}
