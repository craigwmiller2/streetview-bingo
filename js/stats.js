async function loadStats() {
    const data = await browser.storage.local.get("global_stats");
    const stats = data.global_stats;

    // If no stats exist, show a friendly message and hide the list
    if (!stats || stats.totalAttempts === 0) {
        document.querySelector(".stats-grid").style.opacity = "0.3";
        const msg = document.createElement("p");
        msg.innerHTML = "<strong>No career data found.</strong><br>Complete your first game to see your stats!";
        msg.style.textAlign = "center";
        document.body.insertBefore(msg, document.querySelector(".stats-grid"));
        return;
    }

    document.getElementById("total-attempts").textContent = stats.totalAttempts;
    document.getElementById("total-bingos").textContent = stats.totalBingos;

    if (stats.fastestFullBoard) {
        const mins = Math.floor(stats.fastestFullBoard / 60000);
        const secs = Math.floor((stats.fastestFullBoard % 60000) / 1000);
        document.getElementById("fastest-win").textContent = `${mins}m ${secs}s`;
    }

    // Calculate Item Ranks
    const itemEntries = Object.entries(stats.itemCounts);
    itemEntries.sort((a, b) => b[1] - a[1]); // Sort by count

    const list = document.getElementById("item-rank");
    list.innerHTML = ""; // Clear list

    const maxCount = itemEntries[0][1]; // Highest count for scaling

    itemEntries.forEach(([name, count]) => {
        const percentage = (count / maxCount) * 100;

        const row = document.createElement("div");
        row.className = "chart-row";
        row.innerHTML = `
        <div class="chart-label">${name}</div>
        <div class="chart-bar-container">
            <div class="chart-bar" style="width: ${percentage}%"></div>
            <span class="chart-count">${count}</span>
        </div>
    `;
        list.appendChild(row);
    });

    if (itemEntries.length > 0) {
        document.getElementById("most-found").textContent = itemEntries[0][0];
        document.getElementById("least-found").textContent = itemEntries[itemEntries.length - 1][0];
    }
}

loadStats();

document.getElementById("reset-stats-btn").addEventListener("click", async () => {
    const confirmed = confirm("Are you sure you want to delete all career statistics? This cannot be undone.");

    if (confirmed) {
        // Remove only the global stats, leaving any current game data untouched
        await browser.storage.local.remove("global_stats");

        // Reload the page to show empty stats
        window.location.reload();
    }
});
