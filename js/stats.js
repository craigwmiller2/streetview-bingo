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

async function loadStats() {
    // 1. Fetch all data from storage
    const storage = await browser.storage.local.get(["global_stats", "world_history"]);
    const stats = storage.global_stats;
    const worldHistory = storage.world_history || [];

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
    const allItemEntries = ITEMS.map((name) => [name, itemCounts[name] || 0]);
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

            row.innerHTML = `
                <td>${game.date}</td>
                <td class="${statusClass}">${game.status}</td>
                <td>${game.itemsFound}/25</td>
                <td>${timeStr}</td>
            `;
            historyBody.appendChild(row);
        });
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
                shareBtn.style.background = "#2ecc71"; // Success Green

                setTimeout(() => {
                    shareBtn.innerHTML = originalText;
                    shareBtn.style.background = "#6aaa64"; // Reset to Wordle Green
                }, 2000);
            }
        });
    }
});

async function copyStatsToClipboard(stats) {
    console.log(stats);

    // Format logic (as discussed previously)
    // const hours = Math.floor((stats.totalPlaytime || 0) / 3600);
    // const mins = Math.floor(((stats.totalPlaytime || 0) % 3600) / 60);
    const hours = Math.floor((stats.totalPlaytime || 0) / 3600000);
    const mins = Math.floor(((stats.totalPlaytime || 0) % 3600000) / 60000);

    // fastest bingo in ms
    const fastest = stats.fastestFullBoard || 0;
    const fMins = Math.floor(fastest / 60000);
    const fSecs = Math.floor((fastest % 60000) / 1000);

    // all items and counts
    const itemCounts = stats.itemCounts || {};
    const mostFoundItem = Object.entries(itemCounts).reduce(
        (max, entry) => (entry[1] > max[1] ? entry : max),
        ["N/A", 0],
    )[0];
    const leastFoundItem = Object.entries(itemCounts).reduce(
        (min, entry) => (entry[1] < min[1] ? entry : min),
        ["N/A", Infinity],
    )[0];

    const text = [
        `🗺️ Street View Bingo`,
        `🎯 Bingos: ${stats.totalBingos || 0}`,
        `🔥 Streak: ${stats.currentStreak || 0} days`,
        `⏱️ Best Time: ${fMins}m ${fSecs}s`,
        `🌍 Total Time: ${hours}h ${mins}m`,
        `📈 Most Found Item: ${mostFoundItem || "N/A"}`,
        `📉 Least Found Item: ${leastFoundItem || "N/A"}`,
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
