async function loadAchievements() {
    const data = await browser.storage.local.get(["achievements", "achievement_dates"]);
    const earned = data.achievements || [];
    const earnedDates = data.achievement_dates || {}; // We'll need to start saving dates
    const list = document.getElementById("achievements-list");
    list.innerHTML = "";

    // --- 1. Global Progress Calculation ---
    const totalPossible = ACH_DATA.length;
    const totalUnlocked = earned.length;
    const globalPercentage = Math.round((totalUnlocked / totalPossible) * 100);

    // Update the Hero section
    document.getElementById("global-percentage").textContent = `${globalPercentage}%`;
    document.getElementById("global-progress-bar").style.width = `${globalPercentage}%`;

    // --- 2. Category Grouping & Rendering (Existing Logic) ---
    const grouped = ACH_DATA.reduce((acc, ach) => {
        if (!acc[ach.type]) acc[ach.type] = [];
        acc[ach.type].push(ach);
        return acc;
    }, {});

    for (const [type, achievements] of Object.entries(grouped)) {
        // 1. Calculate Progress
        const totalInCategory = achievements.length;
        const unlockedInCategory = achievements.filter((a) => earned.includes(a.id)).length;
        const percentage = Math.round((unlockedInCategory / totalInCategory) * 100);

        // 2. Create Section with Progress Bar
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
            const dateReached = earnedDates[ach.id] || "";
            const card = document.createElement("div");

            card.className = `ach-card ${ach.type} ${isUnlocked ? "unlocked" : ""}`;

            // Fallback logic: If unlocked but no date exists, it's an "Early Discovery"
            const dateDisplay = dateReached ? dateReached : "Achieved before v1.2.0";

            card.innerHTML = `
                <div class="ach-icon">${ach.icon}</div>
                <div>
                    <span class="type-tag ${ach.type}">${ach.type}</span>
                    <h3>${ach.name}</h3>
                    <p>${ach.desc}</p>
                    ${isUnlocked ? `<div class="ach-date">Unlocked: ${dateDisplay}</div>` : ""}
                </div>
            `;
            grid.appendChild(card);
        });

        section.appendChild(grid);
        list.appendChild(section);
    }
}
loadAchievements();
