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

async function loadStats() {
    const data = await browser.storage.local.get("global_stats");
    const stats = data.global_stats;

    // If no stats exist, show a friendly message and hide the grid
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

    if (stats.fastestFullBoard) {
        const mins = Math.floor(stats.fastestFullBoard / 60000);
        const secs = Math.floor((stats.fastestFullBoard % 60000) / 1000);
        document.getElementById("fastest-win").textContent = `${mins}m ${secs.toString().padStart(2, "0")}s`;
    }

    // --- 2. Item Frequency Bar Chart (Including Zeroes) ---
    const itemCounts = stats.itemCounts || {};

    // Map every item in the master list to its count (default to 0)
    const allItemEntries = ITEMS.map((name) => [name, itemCounts[name] || 0]);

    // Sort by count descending
    allItemEntries.sort((a, b) => b[1] - a[1]);

    const list = document.getElementById("item-rank");
    list.innerHTML = "";

    // Find highest count for bar scaling (ensure at least 1 to avoid division by zero)
    const maxCount = Math.max(...allItemEntries.map((e) => e[1]), 1);

    allItemEntries.forEach(([name, count]) => {
        const percentage = (count / maxCount) * 100;
        const isZero = count === 0;

        const row = document.createElement("div");
        row.className = "chart-row";
        if (isZero) row.style.opacity = "0.6"; // Dim items never found

        row.innerHTML = `
            <div class="chart-label">${name}</div>
            <div class="chart-bar-container">
                <div class="chart-bar" style="width: ${percentage}%"></div>
                <span class="chart-count">${count}</span>
            </div>
        `;
        list.appendChild(row);
    });

    // Update Most/Least Found Cards based on allItemEntries
    if (allItemEntries.length > 0) {
        document.getElementById("most-found").textContent = allItemEntries[0][0];
        document.getElementById("least-found").textContent = allItemEntries[allItemEntries.length - 1][0];
    }

    // --- 3. Recent Activity Table ---
    const historyBody = document.getElementById("history-body");
    if (stats.history && stats.history.length > 0) {
        historyBody.innerHTML = "";

        stats.history.forEach((game) => {
            const row = document.createElement("tr");

            // Format Duration (M:SS)
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
    } else {
        historyBody.innerHTML =
            '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #888;">No recent games recorded.</td></tr>';
    }
}

// Initial Load
loadStats();

// --- Reset Career Stats ---
document.getElementById("reset-stats-btn").addEventListener("click", async () => {
    const confirmed = confirm("Are you sure you want to delete all career statistics? This cannot be undone.");
    if (confirmed) {
        await browser.storage.local.remove("global_stats");
        window.location.reload();
    }
});
