/**
 * Helper to convert milliseconds to a clean career duration string
 */
function formatTotalDuration(ms) {
    if (!ms || ms === 0) return "0m";
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Resolves an ID string to its current Display Name
 */
function getItemDisplayName(id) {
    const allItems = [...CORE_ITEMS, ...EXPANSION_ITEMS];
    const match = allItems.find((item) => item.id === id);
    return match ? match.name : id; // Fallback to ID if no match (for old legacy data)
}

async function loadStats() {
    // 1. Fetch all data from storage
    const storage = await browser.storage.local.get(["global_stats", "world_history"]);
    let stats = storage.global_stats;
    let worldHistory = storage.world_history || [];

    const distanceMeters = stats.totalCareerDistance || 0;
    const distanceKm = (distanceMeters / 1000).toFixed(2);

    // --- NEW: AUTOMATIC DATA MIGRATION ---
    let needsUpdate = false;

    if (stats && stats.totalAttempts > 0) {
        // A. Handle modeCounts initialization
        if (!stats.modeCounts) {
            stats.modeCounts = { Standard: stats.totalAttempts, Random: 0, Infinite: 0 };
            needsUpdate = true;
        } else {
            // Check for discrepancy between total attempts and sum of modes
            const countedTotal =
                (stats.modeCounts["Standard"] || 0) +
                (stats.modeCounts["Random"] || 0) +
                (stats.modeCounts["Infinite"] || 0);

            if (stats.totalAttempts > countedTotal) {
                stats.modeCounts["Standard"] += stats.totalAttempts - countedTotal;
                needsUpdate = true;
            }
        }

        // B. Handle missing 'mode' in individual history records
        worldHistory = worldHistory.map((game) => {
            if (!game.mode) {
                game.mode = "Standard"; // Assume legacy games are Standard
                needsUpdate = true;
            }
            return game;
        });

        // C. Save back to storage if any fixes were made
        if (needsUpdate) {
            await browser.storage.local.set({
                global_stats: stats,
                world_history: worldHistory,
            });
            console.log("Migration: Legacy data successfully updated to Standard mode.");
        }
    }
    // --- END MIGRATION ---

    // If no stats exist, show a friendly message
    if (!stats || stats.totalAttempts === 0) {
        document.querySelector(".stats-grid").style.opacity = "0.3";
        const msg = document.createElement("p");
        msg.id = "no-data-msg";
        msg.innerHTML = "<strong>No career data found.</strong><br>Complete your first game to see your stats!";
        msg.style.textAlign = "center";
        document.body.insertBefore(msg, document.querySelector(".stats-grid"));
        return;
    }

    // --- 1. Top Stat Cards ---
    document.getElementById("total-attempts").textContent = stats.totalAttempts;
    document.getElementById("total-bingos").textContent = stats.totalBingos;

    // Display New Playtime
    document.getElementById("total-playtime").textContent = formatTotalDuration(stats.totalPlaytime);

    // Display Daily Streak
    const streakEl = document.getElementById("current-streak");
    const streakCount = stats.currentStreak || 0;
    streakEl.textContent = streakCount > 1 ? `🔥 ${streakCount} Days` : `${streakCount} Day`;

    if (stats.fastestFullBoard) {
        const mins = Math.floor(stats.fastestFullBoard / 60000);
        const secs = Math.floor((stats.fastestFullBoard % 60000) / 1000);
        document.getElementById("fastest-win").textContent = `${mins}m ${secs.toString().padStart(2, "0")}s`;
    }

    // --- 2. Item Frequency Bar Chart ---
    const itemCounts = stats.itemCounts || {};
    const totalPool = [...CORE_ITEMS, ...EXPANSION_ITEMS];

    // Map the objects in the pool to their stored counts using the ID
    const allItemEntries = totalPool.map((itemObj) => {
        return [itemObj.name, itemCounts[itemObj.id] || 0];
    });

    allItemEntries.sort((a, b) => b[1] - a[1]);

    const list = document.getElementById("item-rank");
    list.innerHTML = "";

    const maxCount = Math.max(...allItemEntries.map((e) => e[1]), 1);

    allItemEntries.forEach(([name, count]) => {
        const percentage = (count / maxCount) * 100;
        const isZero = count === 0;

        const row = document.createElement("div");
        row.className = "chart-row";
        if (isZero) row.style.opacity = "0.4";

        row.innerHTML = `
            <div class="chart-label">${name}</div>
            <div class="chart-bar-container">
                <div class="chart-bar" style="width: ${percentage}%"></div>
                <span class="chart-count">${count}</span>
            </div>
        `;
        list.appendChild(row);
    });

    if (allItemEntries.length > 0) {
        document.getElementById("most-found").textContent = allItemEntries[0][0];
        document.getElementById("least-found").textContent = allItemEntries[allItemEntries.length - 1][0];
    }

    // --- 3. Global Reach (Country Stats) ---
    const countryStatsContainer = document.getElementById("country-stats-container");
    if (worldHistory.length > 0) {
        countryStatsContainer.innerHTML = "";
        const countryMap = {};

        worldHistory.forEach((game) => {
            const country = game.country || "Unknown";
            if (!countryMap[country]) countryMap[country] = { bingos: 0, total: 0 };
            countryMap[country].total++;
            if (game.isBingo) countryMap[country].bingos++;
        });

        Object.entries(countryMap)
            .sort((a, b) => b[1].total - a[1].total)
            .forEach(([name, data]) => {
                const winPct = (data.bingos / data.total) * 100;
                const row = document.createElement("div");
                row.className = "country-row";
                row.innerHTML = `
                    <div class="country-info">
                        <span>${name}</span>
                        <small>${data.total} games (${data.bingos} Wins)</small>
                    </div>
                    <div class="ratio-bar-container">
                        <div class="ratio-bar-win" style="width: ${winPct}%"></div>
                        <div class="ratio-bar-loss" style="width: ${100 - winPct}%"></div>
                    </div>
                `;
                countryStatsContainer.appendChild(row);
            });
    }

    // --- NEW: Game Mode Breakdown (Added between sections 3 and 4) ---
    const modeCounts = stats.modeCounts || { Standard: 0, Random: 0, Infinite: 0 };
    const totalGames = stats.totalAttempts || 1;
    const modeContainer = document.getElementById("mode-breakdown-container");

    if (modeContainer) {
        modeContainer.innerHTML = "";
        Object.entries(modeCounts).forEach(([mode, count]) => {
            const percentage = Math.round((count / totalGames) * 100);
            const modeRow = document.createElement("div");
            modeRow.className = "mode-stats-row";
            modeRow.innerHTML = `
                <div class="mode-info">
                    <span class="mode-dot mode-${mode.toLowerCase()}"></span>
                    <span class="mode-name">${mode}</span>
                    <span class="mode-count">${count} games</span>
                </div>
                <div class="mode-bar-bg">
                    <div class="mode-bar-fill mode-${mode.toLowerCase()}" style="width: ${percentage}%"></div>
                </div>
                <div class="mode-percent">${percentage}%</div>
            `;
            modeContainer.appendChild(modeRow);
        });
    }

    // --- 4. Recent Activity Table ---
    const historyBody = document.getElementById("history-body");
    if (stats.history && stats.history.length > 0) {
        historyBody.innerHTML = "";
        stats.history.forEach((game) => {
            const row = document.createElement("tr");
            const totalSeconds = Math.floor(game.duration / 1000);
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            const timeStr = `${mins}m ${secs.toString().padStart(2, "0")}s`;
            const statusClass = game.status === "Completed" ? "status-completed" : "status-timeout";
            const mode = game.mode || "Standard";

            row.innerHTML = `
                <td>${game.date}</td>
                <td><span class="mode-badge-table mode-${mode.toLowerCase()}">${mode}</span></td>
                <td class="${statusClass}">${game.status}</td>
                <td>${game.itemsFound}/25</td>
                <td>${timeStr}</td>
            `;
            historyBody.appendChild(row);
        });
    }

    const distEl = document.getElementById("stats-lifetime-distance");
    if (distEl) {
        distEl.textContent = `${parseFloat(distanceKm).toLocaleString()} km`;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Fetch the stats from storage
    const data = await browser.storage.local.get("global_stats");
    const stats = data.global_stats || {};

    const shareBtn = document.getElementById("share-stats-btn");

    if (shareBtn) {
        shareBtn.addEventListener("click", async () => {
            // Use the helper function we discussed
            const success = await copyStatsToClipboard(stats);

            if (success) {
                const originalText = shareBtn.innerHTML;
                shareBtn.innerText = "Copied! ✨";
                shareBtn.style.background = "#0099ff"; // Success Green

                setTimeout(() => {
                    shareBtn.innerHTML = originalText;
                    shareBtn.style.background = "#2ecc71"; // Reset to Wordle Green
                }, 2000);
            }
        });
    }
});

async function copyStatsToClipboard(stats) {
    const hours = Math.floor((stats.totalPlaytime || 0) / 3600000);
    const mins = Math.floor(((stats.totalPlaytime || 0) % 3600000) / 60000);

    // fastest bingo in ms
    const fastest = stats.fastestFullBoard || 0;
    const fMins = Math.floor(fastest / 60000);
    const fSecs = Math.floor((fastest % 60000) / 1000);

    // all items and counts
    const itemCounts = stats.itemCounts || {};
    // find raw IDs with highest/lowest counts
    const mostFoundId = Object.entries(itemCounts).reduce(
        (max, entry) => (entry[1] > max[1] ? entry : max),
        ["N/A", 0],
    )[0];

    const leastFoundId = Object.entries(itemCounts).reduce(
        (min, entry) => (entry[1] < min[1] ? entry : min),
        ["N/A", Infinity],
    )[0];

    // Convert IDs to Display Names for the clipboard
    const mostFoundName = getItemDisplayName(mostFoundId);
    const leastFoundName = getItemDisplayName(leastFoundId);

    // Calculate distance for the share text
    const distanceMeters = stats.totalCareerDistance || 0;
    const distanceKm = (distanceMeters / 1000).toFixed(2);

    const text = [
        `🗺️ Street View Bingo`,
        `🔢 Total Attempts: ${stats.totalAttempts || 0}`,
        `🎯 Bingos: ${stats.totalBingos || 0}`,
        `🔥 Streak: ${stats.currentStreak || 0} days`,
        `⏱️ Best Time: ${fMins}m ${fSecs}s`,
        `🌍 Total Time: ${hours}h ${mins}m`,
        `🌍 Total Distance: ${parseFloat(distanceKm).toLocaleString()} km`, // Added Distance
        `📈 Most Found Item: ${mostFoundName || "N/A"}`,
        `📉 Least Found Item: ${leastFoundName || "N/A"}`,
        `🛰️ Play! - https://craigwmiller2.github.io/streetview-bingo/`,
    ].join("\n");

    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        return false;
    }
}
loadStats();
