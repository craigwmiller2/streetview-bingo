async function loadAchievements() {
    const data = await browser.storage.local.get("achievements");
    const earned = data.achievements || [];
    const list = document.getElementById("achievements-list");
    list.innerHTML = ""; // Clear existing content

    // 1. Group achievements by type
    const grouped = ACH_DATA.reduce((acc, ach) => {
        if (!acc[ach.type]) acc[ach.type] = [];
        acc[ach.type].push(ach);
        return acc;
    }, {});

    // 2. Iterate through categories
    for (const [type, achievements] of Object.entries(grouped)) {
        // Create a category header/section
        const section = document.createElement("div");
        section.className = "ach-category-group";
        section.innerHTML = `<h2 class="category-title">${type.replace("_", " ")}</h2>`;

        const grid = document.createElement("div");
        grid.className = "ach-grid"; // Ensure your CSS supports a grid layout

        achievements.forEach((ach) => {
            const isUnlocked = earned.includes(ach.id);
            const card = document.createElement("div");

            // Use 'type' for styling instead of 'rarity'
            card.className = `ach-card ${ach.type} ${isUnlocked ? "unlocked" : ""}`;

            card.innerHTML = `
                <div class="ach-icon">${ach.icon}</div>
                <div>
                    <span class="type-tag ${ach.type}">${ach.type}</span>
                    <h3>${ach.name}</h3>
                    <p>${ach.desc}</p>
                </div>
            `;
            grid.appendChild(card);
        });

        section.appendChild(grid);
        list.appendChild(section);
    }
}
loadAchievements();
