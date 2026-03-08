const soundTick = new Audio(browser.runtime.getURL("audio/tick.mp3"));
const soundBingo = new Audio(browser.runtime.getURL("audio/sonic-bingo.mp3"));
const soundGameover = new Audio(browser.runtime.getURL("audio/gameover.mp3"));
const soundAchievement = new Audio(browser.runtime.getURL("audio/achievement.ogg"));
const soundCountdown = new Audio(browser.runtime.getURL("audio/countdown.mp3"));
const soundMayhemCountdown = new Audio(browser.runtime.getURL("audio/gran-turismo-countdown.mp3"));
const soundAlert = new Audio(browser.runtime.getURL("audio/alert.mp3"));
const soundDrowning = new Audio(browser.runtime.getURL("audio/sonic-drowning.mp3"));
const soundShuffle = new Audio(browser.runtime.getURL("audio/shuffle.mp3"));
const soundSonicCheckpoint = new Audio(browser.runtime.getURL("audio/sonic-checkpoint.mp3"));

// soundTick.load();
soundBingo.load();
soundGameover.load();
soundAchievement.load();
soundCountdown.load();
soundAlert.load();
soundDrowning.load();
soundShuffle.load();
soundSonicCheckpoint.load();
soundMayhemCountdown.load();

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
let selectedRuleset = "standard";
let undoUsedInCurrentGame = false;
let lastMayhemMinute = -1;
let currentActiveMode = "standard"; // Global tracker
const FULL_DASH_ARRAY = 283;

/**
 * Game State Controller with Countdown
 */
window.startGame = async function (mode) {
    currentActiveMode = mode;
    const grid = document.getElementById("bingo-grid");
    const modeBadge = document.getElementById("mode-badge-title");
    const textDisplay = document.getElementById("timer-text");
    const progressCircle = document.querySelector(".timer-progress");
    undoUsedInCurrentGame = false;

    const body = document.querySelector("body");
    body.classList.add("game-active");

    // --- DASHBOARD AUTO-HIDE ---
    const dashboard = document.getElementById("dashboard-container");
    if (dashboard) dashboard.classList.add("dashboard-hidden");

    // Reset Timer UI
    if (textDisplay) textDisplay.textContent = "10:00";
    if (progressCircle) {
        progressCircle.style.strokeDashoffset = "0";
        progressCircle.style.transition = "none";
    }

    // 1. Initial UI Setup
    document.getElementById("mode-menu").style.display = "none";
    document.getElementById("main-header").style.display = "none";
    document.getElementById("controls").style.display = "block";

    // 2. Clear previous classes
    grid.classList.remove("standard-mode", "random-mode", "infinite-mode", "mayhem-mode");
    modeBadge.className = "";

    totalPausedTime = 0;
    pauseStartTime = null;
    totalDistanceTraveled = 0;

    // --- NEW HYBRID LOGIC ---
    // We check for these flags independently
    const isRandom = mode.includes("random");
    const isInfinite = mode.includes("infinite");
    const isMayhem = mode.includes("mayhem");

    let modeLabel = "Standard";

    // A. Handle Board Generation Base
    if (isMayhem) {
        modeLabel = "Mayhem";
        ITEMS = generateRandomBoard();
        grid.classList.add("mayhem-mode");
        modeBadge.classList.add("mode-badge-title", "mode-mayhem");
    } else if (isRandom) {
        modeLabel = "Random";
        ITEMS = generateRandomBoard();
        grid.classList.add("random-mode");
        modeBadge.classList.add("mode-badge-title", "mode-random");
    } else {
        ITEMS = [...CORE_ITEMS];
        grid.classList.add("standard-mode");
        modeBadge.classList.add("mode-badge-title", "mode-standard");
    }

    // B. Handle Infinite Modifier - Append it to the label!
    if (isInfinite) {
        // This changes "Mayhem" to "Mayhem Infinite"
        modeLabel = modeLabel === "Standard" ? "Infinite" : `${modeLabel} Infinite`;
        grid.classList.add("infinite-mode");

        if (!isMayhem) {
            modeBadge.classList.remove("mode-standard", "mode-random");
            modeBadge.classList.add("mode-infinite");
        }
    }

    modeBadge.textContent = `${modeLabel} Mode`;

    // Store for timer logic
    grid.dataset.initialTime = initialTime;

    // Save state
    await browser.storage.local.set({
        session_items: ITEMS,
        current_game_mode: modeLabel,
    });

    gameData = [];
    document.getElementById("bingo-grid").innerHTML = "";

    // 3. Prepare the Countdown Overlay
    const overlay = document.getElementById("start-countdown");
    const numberDisplay = document.getElementById("countdown-number");

    // --- 1. Define Color Mapping ---
    const modeColors = {
        standard: { color: "rgba(52, 152, 219, 0.3)", glow: "rgba(52, 152, 219, 0.4)" },
        random: { color: "rgba(142, 68, 173, 0.3)", glow: "rgba(142, 68, 173, 0.4)" },
        infinite: { color: "rgba(243, 156, 18, 0.3)", glow: "rgba(243, 156, 18, 0.4)" },
        "random-infinite": { color: "rgba(155, 89, 182, 0.3)", glow: "rgba(243, 156, 18, 0.3)" },
        "mayhem-10min": { color: "rgba(231, 76, 60, 0.4)", glow: "rgba(142, 68, 173, 0.3)" },
        "mayhem-infinite": { color: "rgba(231, 76, 60, 0.4)", glow: "rgba(243, 156, 18, 0.3)" },
    };

    // --- 2. Apply Colors to Overlay ---
    // Fallback to standard if the mode string isn't an exact match
    const theme = modeColors[mode] || modeColors["standard"];

    overlay.style.setProperty("--mode-color", theme.color);
    overlay.style.setProperty("--mode-glow", theme.glow);

    overlay.style.display = "flex";

    let count = 3;
    numberDisplay.textContent = count;
    numberDisplay.className = "";
    // soundCountdown.play();

    // if it's Mayhem, play the special countdown sound and apply a unique style
    if (isMayhem) {
        soundMayhemCountdown.currentTime = 0;
        soundMayhemCountdown.play();
    } else {
        soundCountdown.currentTime = 0;
        soundCountdown.play();
    }

    const countdownInterval = setInterval(() => {
        count--;
        numberDisplay.style.animation = "none";
        numberDisplay.offsetHeight;
        numberDisplay.style.animation = null;

        if (count > 0) {
            numberDisplay.textContent = count;
        } else if (count === 0) {
            numberDisplay.textContent = "GO!";
            numberDisplay.classList.add("go-text");

            setTimeout(() => {
                generateGridWithAnimation();
                document.getElementById("active-mode-display").style.display = "block";
            }, 1000);
        } else {
            clearInterval(countdownInterval);
            overlay.style.display = "none";

            gameStartTime = Date.now();

            // --- TIMER ---
            timeLeft = initialTime;
            document.getElementById("timer-container").style.display = "block";
            startTimer();
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
    isPaused = !isPaused;
    const overlay = document.getElementById("pause-overlay");
    const grid = document.getElementById("bingo-grid");

    if (isPaused) {
        pauseStartTime = Date.now();
        overlay.style.display = "flex";

        // 1. Define the same color palette as the countdown
        const modeColors = {
            standard: { color: "rgba(52, 152, 219, 0.2)", glow: "rgba(52, 152, 219, 0.15)" },
            random: { color: "rgba(142, 68, 173, 0.2)", glow: "rgba(142, 68, 173, 0.15)" },
            infinite: { color: "rgba(243, 156, 18, 0.2)", glow: "rgba(243, 156, 18, 0.15)" },
            "random-infinite": { color: "rgba(155, 89, 182, 0.2)", glow: "rgba(243, 156, 18, 0.1)" },
            "mayhem-10min": { color: "rgba(231, 76, 60, 0.3)", glow: "rgba(142, 68, 173, 0.1)" },
            "mayhem-infinite": { color: "rgba(231, 76, 60, 0.3)", glow: "rgba(243, 156, 18, 0.1)" },
        };

        // 2. Apply the theme based on the current mode
        const theme = modeColors[currentActiveMode] || modeColors["standard"];
        overlay.style.setProperty("--mode-color", theme.color);
        overlay.style.setProperty("--mode-glow", theme.glow);

        grid.style.filter = "blur(5px) grayscale(50%)";
        grid.style.pointerEvents = "none";

        // Update the button and text specifically
        const resumeBtn = document.getElementById("resume-btn");
        const pauseTitle = overlay.querySelector("h1");

        if (resumeBtn && pauseTitle) {
            // Make the button border glow with the mode color
            resumeBtn.style.borderColor = theme.color;
            // Make the title glow with the mode color
            pauseTitle.style.textShadow = `0 0 15px ${theme.color}, 0 0 30px ${theme.color}`;
        }
    } else {
        if (pauseStartTime) {
            totalPausedTime += Date.now() - pauseStartTime;
        }
        overlay.style.display = "none";
        grid.style.filter = "none";
        grid.style.pointerEvents = "auto";
    }
}

async function handleCapture(itemObj, cellElement) {
    // Safety check: Determine ID and Name regardless of if itemObj is an object or string
    const itemId = itemObj && typeof itemObj === "object" ? itemObj.id : itemObj;
    const itemName = itemObj && typeof itemObj === "object" ? itemObj.name : itemObj;

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
            item: itemId, // Save the ID for logic and localStorage
            locationUrl: tab.url,
            coords: coords,
            image: screenshot,
            timestamp: new Date().toISOString(),
        };

        // 1. Store the previous length before pushing
        const previousLength = gameData.length;
        gameData.push(find);

        // Achievement/Sound Logic uses the ID
        if (itemId && itemId.toLowerCase().includes("looking directly at street view car")) {
            soundAlert.currentTime = 0;
            soundAlert.play();
        }

        // if item ID is "lamp-post", play the Sonic Checkpoint sound
        if (itemId && itemId.toLowerCase().includes("lamp-post")) {
            soundSonicCheckpoint.currentTime = 0;
            soundSonicCheckpoint.play();
        }

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
        // cellElement.classList.remove("bounty-highlight");
        cellElement.classList.add("found");
        cellElement.style.backgroundImage = `url(${screenshot})`;
        cellElement.innerHTML = `<span>${itemName}</span>`;

        const undoBtn = document.createElement("button");
        undoBtn.className = "undo-btn";
        undoBtn.innerHTML = "✕";
        undoBtn.onclick = (e) => {
            e.stopPropagation();
            handleUndo(itemId, cellElement);
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
        // stop soundDrowning sound from playing and reset it for the next game
        soundDrowning.pause();
        soundDrowning.currentTime = 0;

        triggerEndGame("🎉 BINGO!", "rgba(46, 204, 113, 0.9)");

        spawnPerfectScoreConfetti();
    }
}

function handleUndo(itemId, cellElement) {
    const index = gameData.findIndex((f) => f.item === itemId);
    undoUsedInCurrentGame = true;

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

    // Lookup the display name for the reset cell
    const allItems = [...CORE_ITEMS, ...EXPANSION_ITEMS];
    const originalItem = allItems.find((i) => i.id === itemId);
    const displayName = originalItem ? originalItem.name : itemId;

    cellElement.classList.remove("found");
    cellElement.style.backgroundImage = "none";
    cellElement.innerHTML = `<span>${displayName}</span>`;

    cellElement.onclick = () => handleCapture(originalItem || itemId, cellElement);

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

        distanceDisplay.textContent = `Distance: ${distText}`;

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

        // --- NEW: Ticking Logic for last 10 seconds ---
        if (timeLeft <= 12 && timeLeft > 0) {
            // soundTick.currentTime = 0; // Reset sound to allow rapid replay
            // soundTick.play();
            soundDrowning.play();

            // Visual feedback: Flash red and scale up slightly
            textDisplay.style.color = "#e74c3c";
            textDisplay.style.fontWeight = "bold";
            textDisplay.style.transform = "translate(-50%, -50%) scale(1.2)";
            progressCircle.style.strokeWidth = "10";
            setTimeout(() => {
                textDisplay.style.transform = "translate(-50%, -50%) scale(1)";
                progressCircle.style.strokeWidth = "8";
            }, 150);
        } else {
            textDisplay.style.color = ""; // Reset to default CSS color
            textDisplay.style.fontWeight = "";
        }

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

    const isInfinite = grid.classList.contains("infinite-mode");
    const isMayhem = grid.classList.contains("mayhem-mode");

    if (!isInfinite) {
        progressCircle.style.transition = "stroke-dashoffset 1s linear, stroke 1s linear";
    }

    lastMayhemMinute = 0; // Reset on start
    refreshHUD();

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (isPaused) return;

        if (isInfinite) {
            // MAYHEM FOR INFINITE
            if (isMayhem) {
                const elapsedSeconds = Math.floor((Date.now() - gameStartTime - totalPausedTime) / 1000);
                const currentMinute = Math.floor(elapsedSeconds / 60);

                // Trigger if we've entered a new minute and it's not the start (0)
                if (currentMinute > 0 && currentMinute > lastMayhemMinute) {
                    lastMayhemMinute = currentMinute;
                    triggerMayhemShuffle();
                }
            }
            refreshHUD();
        } else {
            timeLeft--;

            // MAYHEM FOR STANDARD
            if (isMayhem && timeLeft > 0) {
                const initialTimeVal = parseInt(grid.dataset.initialTime || 600);
                const elapsed = initialTimeVal - timeLeft;
                const currentMinute = Math.floor(elapsed / 60);

                if (currentMinute > 0 && currentMinute > lastMayhemMinute) {
                    lastMayhemMinute = currentMinute;
                    triggerMayhemShuffle();
                }
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                soundGameover.play();
                triggerEndGame("⏰ TIME'S UP!", "rgba(192, 57, 43, 0.9)");
            }
            refreshHUD();
        }
    }, 1000);
}

async function triggerMayhemShuffle() {
    const grid = document.getElementById("bingo-grid");
    const cells = grid.querySelectorAll(".cell");

    // 1. Create a fresh, flat copy of every possible item
    const fullPool = [...CORE_ITEMS, ...EXPANSION_ITEMS];

    // 2. Map out exactly what IDs are currently marked as 'found'
    const foundIds = Array.from(cells)
        .filter((c) => c.classList.contains("found"))
        .map((c) => c.dataset.itemId);

    // 3. Filter the pool, then shuffle the CLONE
    // We use .slice() or the spread operator to ensure we aren't touching a cached list
    let availablePool = [...fullPool].filter((item) => !foundIds.includes(item.id));

    // Re-verify your shuffle function is called here
    shuffle(availablePool);

    soundShuffle.currentTime = 0;
    soundShuffle.volume = 0.6;
    soundShuffle.play();

    // 4. Loop through cells and swap unfound ones
    cells.forEach((cell, index) => {
        if (!cell.classList.contains("found") && !cell.classList.contains("capturing")) {
            cell.classList.add("mayhem-swapping");

            setTimeout(() => {
                // If the pool somehow ran out (unlikely), fallback to a random CORE item
                const newItem = availablePool.length > 0 ? availablePool.pop() : CORE_ITEMS[0];

                if (newItem) {
                    ITEMS[index] = newItem;
                    cell.innerHTML = `<span>${newItem.name}</span>`;
                    cell.dataset.itemId = newItem.id;
                    cell.onclick = () => handleCapture(newItem, cell);
                }
                cell.classList.remove("mayhem-swapping");
            }, 500);
        }
    });

    grid.classList.add("grid-glitch-pulse");
    setTimeout(() => grid.classList.remove("grid-glitch-pulse"), 1000);
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
    const isRandom = grid.classList.contains("random-mode");
    const body = document.querySelector("body");
    body.classList.remove("game-active");
    if (document.getElementById("win-overlay")) return;

    // Reveal the dashboard when the game completes
    const dashboard = document.getElementById("dashboard-container");
    if (dashboard) dashboard.classList.remove("dashboard-hidden");

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

    // --- NEW: BOUNTY CHECK LOGIC ---
    let bountyWasClaimedThisSpecificGame = false;
    if (isRandom) {
        const storage = await browser.storage.local.get(["session_items", "last_bounty_claimed"]);
        const sessionItems = storage.session_items || [];
        const today = new Date().toLocaleDateString("en-GB");

        if (storage.last_bounty_claimed !== today) {
            const bountyResult = checkBountySuccess(sessionItems, gameData);
            if (bountyResult.success) {
                bountyWasClaimedThisSpecificGame = true;
                // AWAIT this so the storage is updated before we check stats
                await markBountyClaimed();
            }
        }
    }

    // Create the enhanced overlay
    const overlay = document.createElement("div");
    overlay.id = "win-overlay";
    overlay.style.setProperty("--overlay-bg", bgColor);

    // Insert the Bounty Badge only if they actually claimed it this game
    overlay.innerHTML = `
        <div class="win-content">
            <h1 class="end-game-title">${title}</h1>
            ${
                bountyWasClaimedThisSpecificGame
                    ? `
                <div class="bounty-win-badge" style="background:#f1c40f; color:#000; padding:5px 10px; border-radius:4px; font-weight:bold; margin-bottom:15px; font-size:0.9rem; animation: pulse 2s infinite;">
                    🏆 DAILY BOUNTY CLAIMED!
                </div>`
                    : ""
            }
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

    const foundCount = gameData.length;

    // 5. Check achievements using the FRESHLY updated stats
    await checkAchievements(finalDuration, updatedStats, totalDistanceTraveled);

    document.getElementById("timer-container").style.display = "none";
    document.getElementById("active-mode-display").style.display = "none";

    // --- NEW: Event Listener for the Menu Button ---
    document.getElementById("back-to-menu-btn").onclick = () => {
        // This effectively 'resets' the UI for a fresh start
        isPaused = false;
        document.getElementById("mode-menu").style.display = "block";
        document.getElementById("main-header").style.display = "block";
        document.getElementById("bingo-grid").innerHTML = "";
        overlay.remove();
    };

    document.getElementById("final-map-launch-btn").addEventListener("click", async () => {
        await browser.storage.local.set({
            current_game: gameData,
            start_time: gameStartTime,
            end_time: absoluteEndTime,
            session_distance: totalDistanceTraveled,
            final_board_items: ITEMS,
        });
        await openOrFocusTab("map.html");
    });

    // 6. Update UI HUD elements
    updateSidebarStreak();
    updateDailyChallengeHUD(); // Refresh the new Daily Challenge HUD state
}

async function getCurrentLocationFromURL() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const url = tabs[0].url;

    // Google Maps URLs look like: .../@lat,lng,zoom...
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
        return {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2]),
        };
    }
    return null;
}

function parseCoords(url) {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    return match ? { lat: parseFloat(match[1]), lng: parseFloat(match[2]) } : null;
}

async function updateGlobalStats(finalDuration, distance) {
    const data = await browser.storage.local.get(["global_stats", "current_game_mode"]);

    let global = data.global_stats || {};
    if (!global.itemCounts) global.itemCounts = {};
    if (!global.modeCounts) global.modeCounts = { Standard: 0, Random: 0, Infinite: 0, Mayhem: 0 };

    if (typeof global.totalBingos !== "number") {
        global.totalBingos = 0;
    }

    const modeName = data.current_game_mode || "Standard";

    // Check for Mayhem and add to counts
    global.modeCounts[modeName] = (global.modeCounts[modeName] || 0) + 1;

    global.totalAttempts = (global.totalAttempts || 0) + 1;
    global.totalPlaytime = (global.totalPlaytime || 0) + finalDuration;

    global.totalCareerDistance = (global.totalCareerDistance || 0) + distance;

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

/**
 * Helper to check for an item ID within a specific geographical context
 * @param {Array} gameData - Current session finds
 * @param {Object} lastGame - Geocoded data from Nominatim
 * @param {String} targetId - The item ID to look for
 * @param {Array|String} countries - Country name(s) to match
 */
function checkExploration(gameData, lastGame, targetId, countries) {
    const itemFound = gameData.some((f) => f.item === targetId);

    // Convert single string to array for easier checking
    const countryList = Array.isArray(countries) ? countries : [countries];
    const countryMatch = countryList.some((c) => lastGame?.country?.toLowerCase().includes(c.toLowerCase()));

    return itemFound && countryMatch;
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
        master_hunter: ITEMS.every((item) => (stats.itemCounts[item.id || item] || 0) >= 5),
        world_traveler: uniqueCountries >= 5,
        marathoner: stats.totalPlaytime >= 3600000,
        marathoner: stats.totalPlaytime >= 86400000,
        london_calling: visited("london"),
        the_patriot: checkExploration(gameData, lastGame, "A Flag", ["United States", "USA"]),
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
        no_return: gameData.some((f) => f.item === "Yellow Car"),
        i_see_you: gameData.some((f) => f.item && f.item.toLowerCase().includes("looking directly at street view car")),
        bounty_1: stats.maxBountyStreak >= 1,
        bounty_3: stats.bountyStreak >= 3,
        bounty_7: stats.bountyStreak >= 7,
        bounty_30: stats.bountyStreak >= 30,
        dist_10km: (stats.totalCareerDistance || 0) >= 10000,
        dist_100km: (stats.totalCareerDistance || 0) >= 100000,
        dist_1000km: (stats.totalCareerDistance || 0) >= 1000000,
        dist_40k: (stats.totalCareerDistance || 0) >= 40075000,
        north_star: checkExploration(gameData, lastGame, "A Flag", ["Norway", "Sweden", "Finland"]),
        shrimp_on_barbie: checkExploration(gameData, lastGame, "BBQ", "Australia"),
        alpine_rider: checkExploration(gameData, lastGame, "Motorbike or Quadbike", ["Switzerland", "Austria"]),
        suburban_scout: checkExploration(gameData, lastGame, "Lawnmower", "United Kingdom"),
        world_citizen: checkExploration(gameData, lastGame, "Dog or Cat", "Japan"),

        inception: checkExploration(gameData, lastGame, "Streetview Car Reflection", ["United States", "USA"]),
        lost_in_translation: checkExploration(gameData, lastGame, "Streetview Car Reflection", "Japan"),
        paddock_paparazzi: checkExploration(gameData, lastGame, "Streetview Car Reflection", "Australia"),
        unlikely_tourist: checkExploration(gameData, lastGame, "Trampoline", ["Brazil", "Thailand"]),
        mediterranean_breeze: checkExploration(gameData, lastGame, "Air Conditioning Unit", [
            "Italy",
            "Greece",
            "Spain",
        ]),
        canal_cruiser: checkExploration(gameData, lastGame, "Bicycle", "Netherlands"),
        high_altitude_ac: checkExploration(gameData, lastGame, "Air Conditioning Unit", ["Switzerland", "Austria"]),
        american_roadtrip: checkExploration(gameData, lastGame, "Pickup Truck", ["United States", "USA"]),
        tokyo_drifter:
            checkExploration(gameData, lastGame, "Scooter", "Japan") ||
            checkExploration(gameData, lastGame, "Motorbike or Quadbike", "Japan"),
        pampas_power: checkExploration(gameData, lastGame, "Tractor", ["Argentina", "Brazil"]),
        desert_dish: checkExploration(gameData, lastGame, "A Satellite Dish", ["United Arab Emirates", "Jordan"]),
        canadian_cabin: checkExploration(gameData, lastGame, "Wooden Pallet", "Canada"),
        hat_trick: sortedFinds.some((find, index) => {
            if (index < 2) return false;
            const current = new Date(find.timestamp).getTime();
            const twoAgo = new Date(sortedFinds[index - 2].timestamp).getTime();
            return current - twoAgo <= 5000;
        }),
        no_time_to_waste:
            sortedFinds.filter((find) => {
                const timeSinceStart = new Date(find.timestamp).getTime() - gameStartTime;
                return timeSinceStart <= 60000;
            }).length >= 10,
        minimalist:
            isBingo &&
            gameData.every((find, index) => {
                if (index === 0) return true;
                const prev = gameData[index - 1];
                const dist = calculateDistance(prev.coords.lat, prev.coords.lng, find.coords.lat, find.coords.lng);
                return dist <= 500;
            }),
        sharpshooter: isBingo && !undoUsedInCurrentGame,
        patience_is_a_virtue:
            isBingo &&
            (() => {
                if (gameData.length < 2) return false;
                const last = new Date(sortedFinds[24].timestamp).getTime();
                const secondToLast = new Date(sortedFinds[23].timestamp).getTime();
                return last - secondToLast >= 120000; // 120,000ms = 2 mins
            })(),
        mayhem_survivor: isBingo && currentMode === "Mayhem",
        chaos_commander: isBingo && currentMode === "Mayhem Infinite",
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

            // 1. Identify Category Groups
            const randomAchIds = ["chaos_tamer", "adapt_overcome", "rng_master"];
            const mayhemAchIds = ["mayhem_survivor", "chaos_commander", "taming_the_storm"];

            const isRandomAch = randomAchIds.includes(ach.id);
            const isMayhemAch = mayhemAchIds.includes(ach.id);

            // 2. Determine CSS Class
            let toastClass = ach.type; // Default (exploration, collection, etc.)

            if (ach.id === "personal_best") {
                toastClass = "legendary";
            } else if (isRandomAch) {
                toastClass = "random-category";
            } else if (isMayhemAch) {
                toastClass = "mayhem-category"; // This matches your new CSS gradient!
            }

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
async function generateGridWithAnimation() {
    const grid = document.getElementById("bingo-grid");
    grid.innerHTML = "";

    const isRandom = grid.classList.contains("random-mode");
    const dailyBounty = getDailyBounty();

    const gridRect = grid.getBoundingClientRect();
    const centerX = gridRect.width / 2;
    const centerY = gridRect.height / 2;

    // --- NEW: Check if already claimed today ---
    const storage = await browser.storage.local.get("last_bounty_claimed");
    const today = new Date().toLocaleDateString("en-GB");
    const alreadyClaimed = storage.last_bounty_claimed === today;

    ITEMS.forEach((itemObj, index) => {
        const cell = document.createElement("div");
        cell.className = "cell shuffling";

        // Only highlight if: 1. Random Mode, 2. Matches ID, 3. NOT already claimed
        if (isRandom && itemObj.id === dailyBounty.id && !alreadyClaimed) {
            cell.classList.add("bounty-highlight");
        }

        grid.appendChild(cell);

        const cellRect = cell.getBoundingClientRect();
        const cellCenterX = cell.offsetLeft + cellRect.width / 2;
        const cellCenterY = cell.offsetTop + cellRect.height / 2;

        cell.style.setProperty("--center-x", `${centerX - cellCenterX}px`);
        cell.style.setProperty("--center-y", `${centerY - cellCenterY}px`);
        cell.style.animationDelay = `${index * 0.04}s`;

        // UI Label
        cell.innerHTML = `<span>${itemObj.name}</span>`;
        cell.dataset.itemId = itemObj.id;

        // Click handler passes the whole object
        cell.onclick = () => handleCapture(itemObj, cell);

        setTimeout(() => cell.classList.remove("shuffling"), 800 + index * 40);
    });
}

/**
 * Helper to update the Sidebar Bounty Card on load
 */
async function initBountyUI() {
    const bounty = getDailyBounty();
    const nameEl = document.getElementById("bounty-item-name");
    const statusEl = document.getElementById("bounty-status");
    const cardEl = document.getElementById("bounty-card");

    if (!nameEl) return;

    nameEl.textContent = bounty.name;

    // 1. Fetch BOTH the claim date AND the global stats for the streak
    const data = await browser.storage.local.get(["last_bounty_claimed", "global_stats"]);
    const today = new Date().toLocaleDateString("en-GB");
    const stats = data.global_stats || {};

    // 2. Handle Claimed Visuals
    if (data.last_bounty_claimed === today) {
        statusEl.textContent = "CLAIMED ✨";
        if (cardEl) cardEl.classList.add("bounty-claimed");
    } else {
        statusEl.textContent = "UNCLAIMED";
        if (cardEl) cardEl.classList.remove("bounty-claimed");
    }

    // 3. Update the Streak Display on load/refresh
    const currentStreak = stats.bountyStreak || 0;
    updateBountyDashboardUI(currentStreak);
}

function spawnPerfectScoreConfetti() {
    const colors = ["#f1c40f", "#e74c3c", "#3498db", "#2ecc71", "#9b59b6", "#ffffff"];
    const shapes = ["50%", "0%", "20%"]; // Circle, Square, Slightly rounded

    for (let i = 0; i < 120; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";

        // Randomize appearance
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        // Randomize trajectory (The "Explosion" math)
        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 250; // Distance of spread
        const tx = Math.cos(angle) * velocity + "px";
        const ty = Math.sin(angle) * velocity + "px";
        const tr = Math.random() * 720 - 360 + "deg"; // Total rotation

        confetti.style.backgroundColor = color;
        confetti.style.borderRadius = shape;
        confetti.style.setProperty("--tx", tx);
        confetti.style.setProperty("--ty", ty);
        confetti.style.setProperty("--tr", tr);

        // Randomize size and duration
        const size = Math.random() * 8 + 4 + "px";
        confetti.style.width = size;
        confetti.style.height = size;

        const duration = 1.5 + Math.random() * 2 + "s";
        confetti.style.animation = `confetti-explosion ${duration} cubic-bezier(0.1, 0.8, 0.3, 1) forwards`;

        document.body.appendChild(confetti);

        // Cleanup
        setTimeout(() => confetti.remove(), 4000);
    }
}

// Helper to reset menu back to "Play" after game starts or finishes
function resetMenu() {
    document.getElementById("menu-main").classList.remove("hidden");
    document.getElementById("menu-ruleset").classList.add("hidden");
    document.getElementById("menu-duration").classList.add("hidden");
}

async function checkOnboarding() {
    const data = await browser.storage.local.get(["isInitialized", "bingo_stats"]);
    const overlay = document.getElementById("welcome-overlay");

    // 1. GRANDFATHER CHECK:
    // If they have stats but no initialization flag, they are a returning player.
    if (data.isInitialized === undefined && data.bingo_stats !== undefined) {
        console.log("Legacy player detected. Skipping onboarding...");
        await browser.storage.local.set({ isInitialized: true });
        overlay.style.display = "none";
        return; // Exit early, no need to show the overlay
    }

    // 2. NEW PLAYER CHECK:
    if (data.isInitialized === undefined) {
        // Brand New Install
        overlay.style.display = "flex";
        await browser.storage.local.set({ isInitialized: false });
    } else if (data.isInitialized === false) {
        // In the middle of instructions
        overlay.style.display = "flex";
    } else {
        // Handshake complete
        overlay.style.display = "none";
    }
}

// Button Listeners
document.getElementById("copy-debug-url").onclick = async (e) => {
    const url = "about:debugging#/runtime/this-firefox";
    const btn = e.currentTarget;

    try {
        await navigator.clipboard.writeText(url);

        // Visual Feedback
        const originalText = btn.textContent;
        btn.textContent = "Copied! Now paste in new tab";
        btn.style.backgroundColor = "#2980b9";

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = "";
        }, 3000);
    } catch (err) {
        console.error("Failed to copy:", err);
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    checkOnboarding();

    const storage = await browser.storage.local.get("last_bounty_claimed");
    const today = new Date().toLocaleDateString("en-GB");
    setBountyCache(storage.last_bounty_claimed === today);

    // main menu buttons
    const menuMain = document.getElementById("menu-main");
    const menuRuleset = document.getElementById("menu-ruleset");
    const menuDuration = document.getElementById("menu-duration");

    // --- NAVIGATION LOGIC ---

    // 1. Main -> Ruleset
    document.getElementById("nav-single-round").onclick = () => {
        menuMain.classList.add("hidden");
        menuRuleset.classList.remove("hidden");
    };

    // 2. Ruleset -> Duration
    document.getElementById("select-standard").onclick = () => {
        selectedRuleset = "standard";
        menuRuleset.classList.add("hidden");
        menuDuration.classList.remove("hidden");
    };

    document.getElementById("select-random").onclick = () => {
        selectedRuleset = "random";
        menuRuleset.classList.add("hidden");
        menuDuration.classList.remove("hidden");
    };

    // NEW: Mayhem Handler (Now flows to duration menu)
    document.getElementById("select-mayhem").onclick = () => {
        selectedRuleset = "mayhem"; // Set the tracker
        menuRuleset.classList.add("hidden");
        menuDuration.classList.remove("hidden");
    };

    // 3. Back Buttons
    document.querySelectorAll(".nav-back-btn").forEach((btn) => {
        btn.onclick = () => {
            if (!menuDuration.classList.contains("hidden")) {
                menuDuration.classList.add("hidden");
                menuRuleset.classList.remove("hidden");
            } else if (!menuRuleset.classList.contains("hidden")) {
                menuRuleset.classList.add("hidden");
                menuMain.classList.remove("hidden");
            }
        };
    });

    // --- START GAME LOGIC ---

    document.getElementById("btn-start-10min").onclick = () => {
        // Determine the specific mode string to pass to startGame
        let mode = "10min";
        if (selectedRuleset === "random") mode = "random";
        if (selectedRuleset === "mayhem") mode = "mayhem-10min"; // New Mayhem branch

        startGame(mode);
        resetMenu();
    };

    document.getElementById("btn-start-infinite").onclick = () => {
        // Determine the specific mode string for infinite
        let mode = "infinite";
        if (selectedRuleset === "random") mode = "random-infinite";
        if (selectedRuleset === "mayhem") mode = "mayhem-infinite"; // New Mayhem branch

        startGame(mode);
        resetMenu();
    };

    // pause button logic
    document.getElementById("pause-btn").onclick = togglePause;
    document.getElementById("resume-btn").onclick = togglePause;

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
            soundDrowning.pause();
            soundDrowning.currentTime = 0;
            triggerEndGame("🏁 SESSION COMPLETE", "rgba(52, 152, 219, 0.9)");
        }
    };

    // Update the existing Reset logic to be the "Discard" button
    document.getElementById("reset-btn").onclick = async () => {
        if (confirm("Discard this game? No items found will be saved to your history.")) {
            const body = document.querySelector("body");
            body.classList.remove("game-active");
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

            const dashboard = document.getElementById("dashboard-container");
            if (dashboard) dashboard.classList.remove("dashboard-hidden");

            location.reload();
        }
    };

    document.getElementById("dashboard-tab").onclick = () => {
        const container = document.getElementById("dashboard-container");
        container.classList.toggle("dashboard-hidden");
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

    // --- NEW: BOUNTY INITIALIZATION ---
    // This ensures the Bounty Card shows the correct item and status on load
    initBountyUI();
});
