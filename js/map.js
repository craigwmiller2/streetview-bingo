// --- LEAFLET ICON FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: browser.runtime.getURL("images/marker-icon-2x.png"),
    iconUrl: browser.runtime.getURL("images/marker-icon.png"),
    shadowUrl: browser.runtime.getURL("images/marker-shadow.png"),
});

async function initMap() {
    const data = await browser.storage.local.get(["current_game", "start_time", "end_time"]);
    const finds = data.current_game || [];
    const startTimestamp = data.start_time;
    const endTimestamp = data.end_time;

    if (finds.length === 0) {
        document.getElementById("share-container").innerHTML = "<h1>No data found. Go find some Bingo items!</h1>";
        return;
    }

    // 1. Setup Map
    const firstCoord = finds[0].coords ? [finds[0].coords.lat, finds[0].coords.lng] : [0, 0];
    const map = L.map("final-map").setView(firstCoord, 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        crossOrigin: true,
    }).addTo(map);

    const shareGrid = document.getElementById("share-grid");
    const pathPoints = [];
    let totalDistance = 0;

    // 2. Process Findings
    const foundItemNames = finds.map((f) => f.item);

    finds.forEach((find, index) => {
        if (find.coords) {
            const currentPos = L.latLng(find.coords.lat, find.coords.lng);
            pathPoints.push(currentPos);

            if (pathPoints.length > 1) {
                totalDistance += pathPoints[pathPoints.length - 2].distanceTo(currentPos);
            }

            L.marker(currentPos).addTo(map).bindPopup(`<b>${find.item}</b><br><img src="${find.image}" width="100">`);

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

    // --- NEW: Identify and Render Missing Items ---
    const missingItems = ITEMS.filter((item) => !foundItemNames.includes(item));

    if (missingItems.length > 0) {
        const missingSection = document.createElement("div");
        missingSection.id = "missing-items-summary";
        missingSection.innerHTML = `
            <h3 class="missing-title">🔍 Items Not Found (${missingItems.length})</h3>
            <div class="missing-tags-container">
                ${missingItems.map((item) => `<span class="missing-tag">${item}</span>`).join("")}
            </div>
        `;
        // Append to share-container so it is included in the JPG export
        document.getElementById("share-container").appendChild(missingSection);
    }

    // 3. Draw Path & Stats
    if (pathPoints.length > 1) {
        map.fitBounds(
            L.featureGroup(pathPoints.map((p) => L.marker(p)))
                .getBounds()
                .pad(0.2),
        );
    }

    const start = new Date(startTimestamp);
    const end = endTimestamp ? new Date(endTimestamp) : new Date(finds[finds.length - 1].timestamp);
    const diffMs = end - start;

    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);

    const timeStr = hours > 0 ? `${hours}h ${mins}m ${secs}s` : `${mins}m ${secs}s`;

    document.getElementById("stat-distance").textContent = `Distance: ${(totalDistance / 1000).toFixed(2)} km`;
    document.getElementById("stat-time").textContent = `Time Taken: ${timeStr}`;

    // 4. Download Functionality
    document.getElementById("download-share-btn").onclick = async () => {
        const btn = document.getElementById("download-share-btn");
        btn.textContent = "Generating Image...";

        const canvas = await html2canvas(document.getElementById("share-container"), {
            useCORS: true,
            allowTaint: false,
            scale: 1.1,
        });

        const link = document.createElement("a");
        link.download = `bingo-summary-${Date.now()}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 0.8);
        link.click();

        btn.textContent = "Download Shareable Summary (JPG)";
    };

    // 5. Copy to Clipboard Functionality
    document.getElementById("copy-share-btn").onclick = async () => {
        const btn = document.getElementById("copy-share-btn");
        const originalText = btn.textContent;
        btn.textContent = "Generating Image...";
        btn.disabled = true;

        try {
            const canvas = await html2canvas(document.getElementById("share-container"), {
                useCORS: true,
                allowTaint: false,
                scale: 1.0,
            });
            const dataUrl = canvas.toDataURL("image/png");
            await copyImageToClipboard(dataUrl, btn, originalText);
        } catch (err) {
            console.error("Error copying summary:", err);
            btn.textContent = "Error copying image";
        } finally {
            if (btn.textContent === "Generating Image...") {
                btn.textContent = "📋 Copy Summary Image to Clipboard";
            }
        }
    };
}

document.getElementById("lightbox").onclick = () => {
    document.getElementById("lightbox").style.display = "none";
};

document.addEventListener("DOMContentLoaded", initMap);

async function copyImageToClipboard(dataUrl, btn, originalText) {
    try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);

        btn.innerHTML = "Copied! ✓";
        btn.style.backgroundColor = "#2ecc71";

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = "";
            btn.disabled = false;
        }, 2000);
    } catch (err) {
        console.error("Failed to copy image:", err);
        alert("Clipboard copy failed. Your browser might require a secure context.");
    }
}
