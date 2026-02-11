async function loadAchievements() {
    const data = await browser.storage.local.get("achievements");
    const earned = data.achievements || [];
    const list = document.getElementById("achievements-list");

    ACH_DATA.forEach((ach) => {
        const isUnlocked = earned.includes(ach.id);
        const card = document.createElement("div");

        // Add the rarity class to the card for styling
        card.className = `ach-card ${ach.rarity} ${isUnlocked ? "unlocked" : ""}`;

        card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div>
            <span class="rarity-tag ${ach.rarity}">${ach.rarity}</span>
            <h3>${ach.name}</h3>
            <p>${ach.desc}</p>
        </div>
    `;
        list.appendChild(card);
    });
}
loadAchievements();
