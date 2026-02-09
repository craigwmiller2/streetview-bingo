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

let gameData = [];
let timerInterval = null;
let timeLeft = 0;
let initialTime = 600; // Default 10 mins
let gameStartTime = null;
const FULL_DASH_ARRAY = 283; // 2 * PI * radius (45)

/**
 * Game State Controller: Triggered by Menu Buttons
 */
window.startGame = function (mode) {
    gameStartTime = Date.now();
    document.getElementById("mode-menu").style.display = "none";
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
        cellElement.innerHTML = `<span>${itemName}</span>`;

        checkWinCondition();
    } catch (error) {
        cellElement.classList.remove("capturing");
        cellElement.innerHTML = originalContent;
        if (error.message === "WrongTab") alert("Switch to Google Maps!");
    }
}

/**
 * Circular Countdown Logic
 */
function startTimer() {
    const progressCircle = document.querySelector(".timer-progress");
    const textDisplay = document.getElementById("timer-text");

    progressCircle.style.strokeDasharray = `${FULL_DASH_ARRAY} ${FULL_DASH_ARRAY}`;

    timerInterval = setInterval(() => {
        timeLeft--;

        // Update Text (M:SS)
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        textDisplay.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;

        // Update SVG Circle Offset
        const offset = FULL_DASH_ARRAY - (timeLeft / initialTime) * FULL_DASH_ARRAY;
        progressCircle.style.strokeDashoffset = offset;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            triggerEndGame("⏰ TIME'S UP!", "rgba(192, 57, 43, 0.9)");
        }
    }, 1000);
}

function checkWinCondition() {
    const totalCells = 25;
    const foundCells = document.querySelectorAll(".cell.found").length;

    if (foundCells === totalCells) {
        clearInterval(timerInterval);
        triggerEndGame("🏆 BOARD CLEARED!", "rgba(46, 204, 113, 0.9)");
    }
}

/**
 * Universal Game End (Win or Time Out)
 */
function triggerEndGame(title, bgColor) {
    const grid = document.getElementById("bingo-grid");
    if (document.getElementById("win-overlay")) return;

    // Disable further clicks
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

    // Update global stats in storage
    updateGlobalStats();

    document.getElementById("final-map-launch-btn").addEventListener("click", async () => {
        await browser.storage.local.set({
            current_game: gameData,
            start_time: gameStartTime,
        });
        browser.tabs.create({ url: browser.runtime.getURL("pages/map.html") });
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
                document.getElementById("controls").style.display = "none";
                document.getElementById("timer-container").style.display = "none";
                document.getElementById("bingo-grid").innerHTML = "";
                const overlay = document.getElementById("win-overlay");
                if (overlay) overlay.remove();
            }
        });
    }
});

async function updateGlobalStats() {
    const stats = await browser.storage.local.get("global_stats");
    let global = stats.global_stats || {
        totalAttempts: 0,
        totalBingos: 0,
        itemCounts: {}, // Tracks how many times each item was found
        fastestFullBoard: null, // in milliseconds
        totalDistance: 0,
    };

    global.totalAttempts += 1;
    if (gameData.length === 25) global.totalBingos += 1;

    // Track item popularity
    gameData.forEach((find) => {
        global.itemCounts[find.item] = (global.itemCounts[find.item] || 0) + 1;
    });

    // Track fastest board
    const start = gameStartTime;
    const end = new Date(gameData[gameData.length - 1].timestamp).getTime();
    const duration = end - start;

    if (gameData.length === 25) {
        if (!global.fastestFullBoard || duration < global.fastestFullBoard) {
            global.fastestFullBoard = duration;
        }
    }

    await browser.storage.local.set({ global_stats: global });
}

document.getElementById("view-stats-btn").addEventListener("click", () => {
    browser.tabs.create({ url: browser.runtime.getURL("pages/stats.html") });
});
