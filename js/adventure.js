let map;
let selectedLevel = null;
let adventureProgress = {};

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Load Progress
    const data = await browser.storage.local.get("adventure_progress");
    adventureProgress = data.adventure_progress || {};

    // 2. Init Map (Norway by default)
    initMap("norway");

    document.getElementById("btn-back-main").onclick = () => window.close();
    document.getElementById("btn-start-level").onclick = launchLevel;
});

function initMap(countryId) {
    const config = ADVENTURE_CONFIG[countryId];

    map = L.map("adventure-map").setView(config.center, config.zoom);

    // Using a clean, dark tile style
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    renderCampaign(countryId);
}

function renderCampaign(countryId) {
    const country = ADVENTURE_CONFIG[countryId];
    const pathCoords = country.levels.map((lvl) => lvl.coords);

    // 1. Draw the road FIRST so it sits behind the markers
    L.polyline(pathCoords, {
        color: "#fff",
        weight: 3,
        dashArray: "10, 15",
        opacity: 0.3,
    }).addTo(map);

    // 2. Render the Levels
    country.levels.forEach((lvl, index) => {
        const progress = adventureProgress[countryId]?.[lvl.id] || { stars: 0, completed: false };

        // Logic: Level is unlocked if it's the first one, or the previous one is completed
        const isUnlocked = index === 0 || adventureProgress[countryId]?.[country.levels[index - 1].id]?.completed;

        // Create the string of stars (e.g., "★★★" or "★☆☆")
        const starHTML = "★".repeat(progress.stars) + "☆".repeat(3 - progress.stars);

        // Define the Square Numbered Icon
        const levelIcon = L.divIcon({
            className: "custom-level-icon", // Leaflet default class reset
            html: `
                <div class="marker-square ${isUnlocked ? "unlocked" : "locked"} ${progress.completed ? "completed" : ""}">
                    <span class="marker-id">${lvl.id}</span>
                    <div class="marker-stars">${starHTML}</div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20], // Center the 40x40 square on the coordinate
        });

        const marker = L.marker(lvl.coords, {
            icon: levelIcon,
            zIndexOffset: 1000, // Ensure markers stay above the line
        }).addTo(map);

        // Interaction
        marker.on("click", () => showLevelDetails(lvl, progress, isUnlocked, countryId));
    });
}

function showLevelDetails(lvl, progress, isUnlocked, countryId) {
    selectedLevel = { ...lvl, countryId };
    const card = document.getElementById("level-card");
    card.classList.remove("hidden");

    document.getElementById("lvl-city").textContent = lvl.city;
    document.getElementById("lvl-title").textContent = lvl.title;
    document.getElementById("lvl-desc").textContent = lvl.desc;

    // Stars UI
    for (let i = 1; i <= 3; i++) {
        const star = document.getElementById(`star-${i}`);
        star.textContent = i <= progress.stars ? "★" : "☆";
        star.classList.toggle("earned", i <= progress.stars);
    }

    const btn = document.getElementById("btn-start-level");
    btn.disabled = !isUnlocked;
    btn.style.opacity = isUnlocked ? "1" : "0.5";
    btn.textContent = isUnlocked ? "START LEVEL" : "LOCKED";
}

async function launchLevel() {
    if (!selectedLevel) return;

    // Save the "Active Adventure" context
    // We add 'isNewGame: true' so the sidebar knows to trigger the start logic
    await browser.storage.local.set({
        active_adventure: {
            countryId: selectedLevel.countryId,
            levelId: selectedLevel.id,
            startURL: selectedLevel.startURL,
            isNewGame: true,
        },
    });

    // Open Google Maps
    window.open(selectedLevel.startURL, "_blank");
}
