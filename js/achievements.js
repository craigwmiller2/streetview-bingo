async function loadAchievements() {
    const data = await browser.storage.local.get([
        "achievements",
        "achievement_dates",
        "global_stats",
        "world_history",
    ]);

    const earned = data.achievements || [];
    const earnedDates = data.achievement_dates || {};
    const stats = data.global_stats || {};

    // Ensure nested objects exist
    if (!stats.itemCounts) stats.itemCounts = {};
    if (!stats.dailyChallengeWins) stats.dailyChallengeWins = 0;
    // Lifetime distance from global_stats
    const lifetimeDist = stats.totalCareerDistance || 0;

    const history = data.world_history || [];
    const list = document.getElementById("achievements-list");
    list.innerHTML = "";

    // --- 1. Global Progress Calculation ---
    const totalPossible = ACH_DATA.length;
    const totalUnlocked = earned.length;
    const globalPercentage = Math.round((totalUnlocked / totalPossible) * 100);

    document.getElementById("global-percentage").textContent = `${globalPercentage}%`;
    document.getElementById("global-progress-bar").style.width = `${globalPercentage}%`;

    const visited = (placeName) =>
        history.some(
            (game) =>
                (game.city && game.city.toLowerCase().includes(placeName.toLowerCase())) ||
                (game.country && game.country.toLowerCase().includes(placeName.toLowerCase())),
        );

    // --- 2. Category Grouping ---
    const grouped = ACH_DATA.reduce((acc, ach) => {
        if (!acc[ach.type]) acc[ach.type] = [];
        acc[ach.type].push(ach);
        return acc;
    }, {});

    for (const [type, achievements] of Object.entries(grouped)) {
        const totalInCategory = achievements.length;
        const unlockedInCategory = achievements.filter((a) => earned.includes(a.id)).length;
        const percentage = Math.round((unlockedInCategory / totalInCategory) * 100);

        const section = document.createElement("div");
        section.className = "ach-category-group";
        section.innerHTML = `
            <div class="category-header">
                <h2 class="category-title">${type.replace("_", " ")}</h2>
                <div class="category-progress-container">
                    <div class="category-progress-bar" style="width: ${percentage}%"></div>
                    <span class="category-progress-text">${unlockedInCategory} / ${totalInCategory}</span>
                </div>
            </div>
        `;

        const grid = document.createElement("div");
        grid.className = "ach-grid";

        achievements.forEach((ach) => {
            const isUnlocked = earned.includes(ach.id);
            const shouldHide = ach.hidden && !isUnlocked;

            const card = document.createElement("div");
            card.className = `ach-card ${ach.type} ${isUnlocked ? "unlocked" : ""} ${shouldHide ? "is-hidden-secret" : ""}`;

            const icon = shouldHide ? "❓" : ach.icon;
            const name = shouldHide ? "Secret Achievement" : ach.name;
            const desc = shouldHide ? "This achievement is hidden. Keep exploring to find it!" : ach.desc;

            let progressHtml = "";

            // --- INTEGRATED DISTANCE & STAT PROGRESS LOGIC ---
            if (!isUnlocked && (ach.goal || ach.goalType === "distance")) {
                let current = 0;
                let goal = ach.goal;
                let displayCurrent = "";
                let displayGoal = "";

                if (ach.goalType === "item") {
                    current = stats.itemCounts[ach.itemKey] || 0;
                    displayCurrent = current;
                    displayGoal = goal;
                } else if (ach.goalType === "stat") {
                    current = stats[ach.statKey] || 0;

                    // Formatting for specific stats
                    if (ach.statKey === "totalPlaytime") {
                        displayCurrent = Math.floor(current / 60000) + "m";
                        displayGoal = Math.floor(goal / 60000) + "m";
                    } else if (ach.statKey === "currentStreak") {
                        displayCurrent = current + " Days";
                        displayGoal = goal + " Days";
                    } else {
                        displayCurrent = current;
                        displayGoal = goal;
                    }
                } else if (ach.goalType === "distance") {
                    // Logic specifically for distance achievements
                    current = lifetimeDist;
                    goal = ach.threshold; // Assumes your config uses 'threshold' for distance

                    // Format meters to KM for display
                    displayCurrent = (current / 1000).toFixed(1) + "km";
                    displayGoal = (goal / 1000).toLocaleString() + "km";
                } else if (ach.goalType === "custom") {
                    if (ach.id === "island_hopper") {
                        current = (visited("united kingdom") ? 1 : 0) + (visited("australia") ? 1 : 0);
                    } else if (ach.id === "scandinavian_scout") {
                        current =
                            (visited("norway") ? 1 : 0) + (visited("sweden") ? 1 : 0) + (visited("denmark") ? 1 : 0);
                    }
                    displayCurrent = current;
                    displayGoal = goal;
                }

                const percent = Math.min(100, Math.round((current / goal) * 100));

                progressHtml = `
                    <div class="ach-progress-wrapper">
                        <div class="ach-progress-bar" style="width: ${percent}%"></div>
                        <span class="ach-progress-text">${displayCurrent} / ${displayGoal}</span>
                    </div>
                `;
            }

            const dateDisplay = earnedDates[ach.id] || "Achieved recently";

            card.innerHTML = `
                <div class="ach-icon">${icon}</div>
                <div style="width: 100%;">
                    <span class="type-tag ${ach.type}">${ach.type}</span>
                    <h3>${name}</h3>
                    <p>${desc}</p>
                    ${progressHtml} 
                    ${isUnlocked ? `<div class="ach-date">Unlocked: ${dateDisplay}</div>` : ""}
                </div>
            `;

            card.setAttribute("data-id", ach.id);
            grid.appendChild(card);
        });

        section.appendChild(grid);
        list.appendChild(section);
    }

    // --- 3. Deep Linking Logic ---
    const targetId = window.location.hash.substring(1);
    if (targetId) {
        const targetCard = document.querySelector(`[data-id="${targetId}"]`);
        if (targetCard) {
            setTimeout(() => {
                targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
                targetCard.classList.add("highlight-pulse");
                setTimeout(() => targetCard.classList.remove("highlight-pulse"), 3000);
            }, 500);
        }
    }
}

loadAchievements();
