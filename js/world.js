async function initWorldMap() {
    const data = await browser.storage.local.get("world_history");
    const history = data.world_history || [];

    // Initialize map centered on the world
    const map = L.map("world-map").setView([20, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    history.forEach((point) => {
        // Green for Bingo, Red for Timeout
        const color = point.isBingo ? "#2ecc71" : "#e74c3c";

        const marker = L.circleMarker([point.lat, point.lng], {
            radius: 8,
            fillColor: color,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
        }).addTo(map);

        marker.bindPopup(`
            <div style="font-family: sans-serif;">
                <strong style="font-size: 1.1rem;">${point.city}, ${point.country}</strong><br>
                <hr style="margin: 5px 0;">
                Found: <strong>${point.found}/25</strong> items<br>
                Result: <span style="color: ${color}; font-weight: bold;">${point.isBingo ? "BINGO" : "TIMEOUT"}</span><br>
                <small>${new Date(point.timestamp).toLocaleDateString()}</small>
            </div>
        `);
    });
}

document.addEventListener("DOMContentLoaded", initWorldMap);
