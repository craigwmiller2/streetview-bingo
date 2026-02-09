// --- LEAFLET ICON FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: browser.runtime.getURL("images/marker-icon-2x.png"),
    iconUrl: browser.runtime.getURL("images/marker-icon.png"),
    shadowUrl: browser.runtime.getURL("images/marker-shadow.png"),
});

async function initMap() {
    const data = await browser.storage.local.get(["current_game", "start_time"]);
    const finds = data.current_game || [];
    const startTimestamp = data.start_time;

    if (finds.length === 0) {
        document.getElementById("share-container").innerHTML = "<h1>No data found. Go find some Bingo items!</h1>";
        return;
    }

    // 1. Setup Map
    const firstCoord = finds[0].coords ? [finds[0].coords.lat, finds[0].coords.lng] : [0, 0];
    const map = L.map("final-map").setView(firstCoord, 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        crossOrigin: true, // Crucial for html2canvas to read the map tiles
    }).addTo(map);

    const shareGrid = document.getElementById("share-grid");
    const pathPoints = [];
    let totalDistance = 0;

    // 2. Process Findings
    finds.forEach((find, index) => {
        if (find.coords) {
            const currentPos = L.latLng(find.coords.lat, find.coords.lng);
            pathPoints.push(currentPos);

            if (pathPoints.length > 1) {
                totalDistance += pathPoints[pathPoints.length - 2].distanceTo(currentPos);
            }

            // Map Marker
            L.marker(currentPos).addTo(map).bindPopup(`<b>${find.item}</b><br><img src="${find.image}" width="100">`);

            // Grid Item
            const itemDiv = document.createElement("div");
            itemDiv.className = "grid-item";
            itemDiv.innerHTML = `
                <img src="${find.image}">
                <div class="label">${find.item}</div>
            `;
            itemDiv.onclick = () => {
                document.getElementById("lightbox-img").src = find.image;
                document.getElementById("lightbox-caption").textContent = find.item;
                document.getElementById("lightbox").style.display = "flex";
            };
            shareGrid.appendChild(itemDiv);
        }
    });

    // 3. Draw Path & Stats
    if (pathPoints.length > 1) {
        L.polyline(pathPoints, { color: "#1877f2", weight: 3, dashArray: "5, 10" }).addTo(map);
        map.fitBounds(
            L.featureGroup(pathPoints.map((p) => L.marker(p)))
                .getBounds()
                .pad(0.2),
        );
    }

    // Time Calculation
    const start = new Date(startTimestamp);
    const end = new Date(finds[finds.length - 1].timestamp);

    // Calculate the difference in milliseconds
    const diffMs = end - start;

    // Format into H:M:S
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);

    const timeStr = `${hours}h ${mins}m ${secs}s`;

    document.getElementById("stat-distance").textContent = `Distance: ${(totalDistance / 1000).toFixed(2)} km`;
    document.getElementById("stat-time").textContent = `Time Taken: ${timeStr}`;

    // 4. Download Functionality
    document.getElementById("download-share-btn").onclick = async () => {
        const btn = document.getElementById("download-share-btn");
        btn.textContent = "Generating Image...";

        const canvas = await html2canvas(document.getElementById("share-container"), {
            useCORS: true,
            allowTaint: false,
            scale: 1.5,
        });

        const link = document.createElement("a");
        link.download = `bingo-summary-${Date.now()}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 0.8);
        link.click();

        btn.textContent = "Download Shareable Summary (JPG)";
    };
}

// Lightbox Close
document.getElementById("lightbox").onclick = () => {
    document.getElementById("lightbox").style.display = "none";
};

document.addEventListener("DOMContentLoaded", initMap);
