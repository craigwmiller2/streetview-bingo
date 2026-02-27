function getDailyBounty() {
    const today = new Date();
    // Unique dateStamp (e.g., 20260227)
    const dateStamp = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = dateStamp % EXPANSION_ITEMS.length;
    return EXPANSION_ITEMS[index];
}

/**
 * Checks if the bounty was found in the current session
 */
function checkBountySuccess(sessionItems, foundData) {
    const bounty = getDailyBounty();

    // 1. Was the bounty even on the board? (Handles both objects and legacy strings)
    const wasOnBoard = sessionItems.some((item) => (item.id || item) === bounty.id);
    if (!wasOnBoard) return { success: false, reason: "not_on_board" };

    // 2. Did the player find it?
    const wasFound = foundData.some((f) => f.item === bounty.id);
    return {
        success: wasFound,
        reason: wasFound ? "claimed" : "missed",
    };
}

/**
 * Updates storage and UI to show the bounty is finished for the day
 */
async function markBountyClaimed() {
    const today = new Date();
    const todayStr = today.toLocaleDateString("en-GB");

    // 1. Save completion date
    await browser.storage.local.set({ last_bounty_claimed: todayStr });
    setBountyCache(true);

    // 2. Update Streak Logic
    const data = await browser.storage.local.get("global_stats");
    let stats = data.global_stats || {};

    // Initialize bounty stats if they don't exist
    if (!stats.bountyStreak) stats.bountyStreak = 0;
    if (!stats.maxBountyStreak) stats.maxBountyStreak = 0;

    const lastBountyDate = stats.lastBountyDate; // Format: "DD/MM/YYYY"
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (lastBountyDate) {
        // Parse the last date manually to avoid browser inconsistencies
        const [d, m, y] = lastBountyDate.split("/");
        const lastDate = new Date(y, m - 1, d).getTime();
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

        const diff = todayMidnight - lastDate;

        if (diff === oneDayMs) {
            stats.bountyStreak += 1; // Continued streak!
        } else if (diff > oneDayMs) {
            stats.bountyStreak = 1; // Missed a day, reset to 1
        }
        // If diff === 0, they already got it today, streak stays same
    } else {
        stats.bountyStreak = 1; // First bounty ever
    }

    stats.lastBountyDate = todayStr;
    if (stats.bountyStreak > stats.maxBountyStreak) {
        stats.maxBountyStreak = stats.bountyStreak;
    }

    await browser.storage.local.set({ global_stats: stats });

    const statusEl = document.getElementById("bounty-status");
    const cardEl = document.getElementById("bounty-card");

    if (statusEl) {
        statusEl.textContent = "CLAIMED ✨";
    }

    if (cardEl) {
        // Apply the CSS class for the green/gold background
        cardEl.classList.add("bounty-claimed");

        // Trigger the "Victory" animation
        cardEl.style.animation = "none";
        cardEl.offsetHeight; // Force reflow to allow animation restart
        cardEl.style.animation = "pulse 2s ease-out";
    }

    // 3. UI updates
    updateBountyDashboardUI(stats.bountyStreak); // Helper to update the card
}

function updateBountyDashboardUI(streak) {
    const streakEl = document.getElementById("bounty-streak-display");
    if (streakEl) {
        streakEl.innerHTML = `Streak: <strong>${streak} Day${streak === 1 ? "" : "s"}</strong> ${streak >= 3 ? "🔥" : ""}`;
    }

    // If streak is 7+, add a 'golden' class to the dashboard
    if (streak >= 7) {
        document.getElementById("bounty-dashboard").classList.add("golden-mastery");
    }
}
