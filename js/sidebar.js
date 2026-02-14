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
let initialTime = 600; // 10 mins
let gameStartTime = null;
const FULL_DASH_ARRAY = 283;

/**
 * Game State Controller
 */
window.startGame = function (mode) {
    gameStartTime = Date.now();
    document.getElementById("mode-menu").style.display = "none";
    document.getElementById("main-header").style.display = "none";
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

        if (timeLeft <= 10 && timeLeft > 0) {
            progressCircle.style.animation = "pulse 0.5s infinite alternate";
            soundTick.currentTime = 0;
            soundTick.play().catch(() => {});
        } else {
            progressCircle.style.animation = "none";
        }
    };

    updateUI();
    timerInterval = setInterval(() => {
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
 * Universal Game End
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

    // 1. Update stats and catch Personal Best flag
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

    // 2. Process geocoding
    await processWorldData();

    // 3. Check achievements using the FRESHLY updated stats
    await checkAchievements(finalDuration, updatedStats);

    document.getElementById("final-map-launch-btn").addEventListener("click", async () => {
        await browser.storage.local.set({
            current_game: gameData,
            start_time: gameStartTime,
            end_time: absoluteEndTime,
        });
        await openOrFocusTab("map.html");
    });
}

function parseCoords(url) {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    return match ? { lat: parseFloat(match[1]), lng: parseFloat(match[2]) } : null;
}

async function updateGlobalStats(finalDuration) {
    const data = await browser.storage.local.get("global_stats");
    let global = data.global_stats || {
        totalAttempts: 0,
        totalBingos: 0,
        itemCounts: {},
        fastestFullBoard: null,
        history: [],
    };

    global.totalAttempts += 1;
    const isBingo = gameData.length === 25;
    let isNewRecord = false;

    if (isBingo) {
        global.totalBingos += 1;
        if (!global.fastestFullBoard || finalDuration < global.fastestFullBoard) {
            global.fastestFullBoard = finalDuration;
            isNewRecord = true;
        }
    }

    const isInfinite = document.getElementById("timer-container").style.display === "none";
    const gameStatus = timeLeft <= 0 && !isBingo && !isInfinite ? "Timed Out" : "Completed";

    const gameSummary = {
        date: new Date().toLocaleDateString(),
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
    const data = await browser.storage.local.get(["achievements", "world_history"]);
    const history = data.world_history || [];
    let earned = data.achievements || [];
    let newUnlocks = [];

    const isBingo = gameData.length === 25;
    const uniqueCountries = new Set(history.map((game) => game.country)).size;

    const logicMap = {
        first_bingo: isBingo,
        speed_demon: isBingo && finalDuration < 300000,
        gardener: (stats.itemCounts["Lawnmower"] || 0) >= 5,
        master_hunter: ITEMS.every((item) => (stats.itemCounts[item] || 0) >= 5),
        world_traveler: uniqueCountries >= 5,
    };

    ACH_DATA.forEach((ach) => {
        if (logicMap[ach.id] && !earned.includes(ach.id)) {
            earned.push(ach.id);
            newUnlocks.push(ach);
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
            toast.className = `achievement-toast ${ach.rarity}`;

            // Check if it's a Personal Best to change the header text
            const headerText = ach.id === "personal_best" ? "Record Broken!" : "Achievement Unlocked!";

            toast.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="ach-icon">${ach.icon}</span>
                    <div>
                        <strong style="font-size: 0.8rem; text-transform: uppercase; opacity: 0.8;">
                            ${headerText}
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
            `https://nominatim.openstreetmap.org/reverse?lat=${avgLat}&lon=${avgLng}&format=json&zoom=10`,
            { headers: { "User-Agent": "StreetViewBingo/1.0" } },
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
async function openOrFocusTab(fileName) {
    const url = browser.runtime.getURL(fileName);

    // 1. Check if the tab is already open anywhere
    const tabs = await browser.tabs.query({ url: url });

    if (tabs.length > 0) {
        // 2. If it exists, focus the window and the tab
        await browser.windows.update(tabs[0].windowId, { focused: true });
        await browser.tabs.update(tabs[0].id, { active: true });

        // 3. Optional: Refresh the tab to show new game data
        await browser.tabs.reload(tabs[0].id);
    } else {
        // 4. If it doesn't exist, open it fresh
        browser.tabs.create({ url: url });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-10min").onclick = () => startGame("10min");
    document.getElementById("btn-infinite").onclick = () => startGame("infinite");

    // document.getElementById("view-achievements-btn").onclick = () =>
    //     browser.tabs.create({ url: browser.runtime.getURL("achievements.html") });
    // document.getElementById("view-stats-btn").onclick = () =>
    //     browser.tabs.create({ url: browser.runtime.getURL("stats.html") });
    // document.getElementById("view-world-btn").onclick = () =>
    //     browser.tabs.create({ url: browser.runtime.getURL("world.html") });

    document.getElementById("view-achievements-btn").onclick = () => openOrFocusTab("achievements.html");
    document.getElementById("view-stats-btn").onclick = () => openOrFocusTab("stats.html");
    document.getElementById("view-world-btn").onclick = () => openOrFocusTab("world.html");

    document.getElementById("reset-btn").onclick = async () => {
        if (confirm("Reset game?")) {
            clearInterval(timerInterval);
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
});
