async function loadAchievements() {
    // FIX: Added "global_stats" to the request list
    const data = await browser.storage.local.get([
        "achievements",
        "achievement_dates",
        "global_stats",
        "world_history",
    ]);

    const earned = data.achievements || [];
    const earnedDates = data.achievement_dates || {};
    const stats = data.global_stats || { itemCounts: {}, totalPlaytime: 0, dailyChallengeWins: 0, currentStreak: 0 };
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

    // --- 2. Category Grouping & Rendering ---
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

            // Determine if we should mask the content
            const shouldHide = ach.hidden && !isUnlocked;

            const card = document.createElement("div");
            card.className = `ach-card ${ach.type} ${isUnlocked ? "unlocked" : ""} ${shouldHide ? "is-hidden-secret" : ""}`;

            // Values to display
            const icon = shouldHide ? "❓" : ach.icon;
            const name = shouldHide ? "Secret Achievement" : ach.name;
            const desc = shouldHide ? "This achievement is hidden. Keep exploring to find it!" : ach.desc;

            let progressHtml = "";
            if (!isUnlocked && ach.goal) {
                let current = 0;
                if (ach.goalType === "item") {
                    // This now works because stats.itemCounts is populated
                    current = stats.itemCounts[ach.itemKey] || 0;
                } else if (ach.goalType === "stat") {
                    current = stats[ach.statKey] || 0;
                } else if (ach.goalType === "custom") {
                    // Specific logic for our new exploration goals
                    if (ach.id === "island_hopper") {
                        current = (visited("united kingdom") ? 1 : 0) + (visited("australia") ? 1 : 0);
                    } else if (ach.id === "scandinavian_scout") {
                        current =
                            (visited("norway") ? 1 : 0) + (visited("sweden") ? 1 : 0) + (visited("denmark") ? 1 : 0);
                    }
                }

                const percent = Math.min(100, Math.round((current / ach.goal) * 100));

                let displayCurrent = current;
                let displayGoal = ach.goal;

                if (ach.statKey === "totalPlaytime") {
                    displayCurrent = Math.floor(current / 60000) + "m";
                    displayGoal = Math.floor(ach.goal / 60000) + "m";
                }
                // Optional: Add a suffix for wins or days to make it clearer
                else if (ach.statKey === "dailyChallengeWins") {
                    displayCurrent = current + " Wins";
                    displayGoal = ach.goal + " Wins";
                } else if (ach.statKey === "currentStreak") {
                    displayCurrent = current + " Days";
                    displayGoal = ach.goal + " Days";
                }

                progressHtml = `
                    <div class="ach-progress-wrapper">
                        <div class="ach-progress-bar" style="width: ${percent}%"></div>
                        <span class="ach-progress-text">${displayCurrent} / ${displayGoal}</span>
                    </div>
                `;
            }

            const dateDisplay = earnedDates[ach.id] || "Achieved before v1.2.0";

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

            card.setAttribute("data-id", ach.id); // For deep linking

            grid.appendChild(card);
        });

        section.appendChild(grid);
        list.appendChild(section);

        const targetId = window.location.hash.substring(1); // remove the '#'
        if (targetId) {
            // Find the card with a matching data attribute or ID
            // Note: You'll need to ensure your cards have an ID set during creation
            const targetCard = document.querySelector(`[data-id="${targetId}"]`);

            if (targetCard) {
                setTimeout(() => {
                    targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
                    targetCard.classList.add("highlight-pulse");

                    // Remove the highlight after the animation finishes
                    setTimeout(() => {
                        targetCard.classList.remove("highlight-pulse");
                    }, 3000);
                }, 500); // Small delay to ensure rendering is 100% complete
            }
        }
    }
}

loadAchievements();
