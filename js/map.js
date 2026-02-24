// --- LEAFLET ICON FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: browser.runtime.getURL("images/marker-icon-2x.png"),
    iconUrl: browser.runtime.getURL("images/marker-icon.png"),
    shadowUrl: browser.runtime.getURL("images/marker-shadow.png"),
});

async function initMap() {
    // 1. Fetch all session data from storage
    const data = await browser.storage.local.get([
        "current_game",
        "start_time",
        "end_time",
        "session_items",
        "current_game_mode",
        "session_distance", // Our new source of truth
    ]);

    const finds = data.current_game || [];
    const modeName = data.current_game_mode || "Standard";
    const startTimestamp = data.start_time;
    const endTimestamp = data.end_time;
    const distance = data.session_distance || 0; // Use pre-calculated value

    const activeItems = data.session_items || CORE_ITEMS;

    if (finds.length === 0) {
        document.getElementById("share-container").innerHTML = "<h1>No data found. Go find some Bingo items!</h1>";
        return;
    }

    // 2. Setup Mode Indicator on Summary
    const shareContainer = document.getElementById("share-container");
    const modeBadge = document.createElement("div");
    modeBadge.className = `mode-badge-summary mode-${modeName.toLowerCase()}`;
    modeBadge.textContent = `${modeName} Mode`;
    shareContainer.insertBefore(modeBadge, shareContainer.firstChild);

    // 3. Setup Leaflet Map
    const firstCoord = finds[0].coords ? [finds[0].coords.lat, finds[0].coords.lng] : [0, 0];
    const map = L.map("final-map").setView(firstCoord, 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        crossOrigin: true,
    }).addTo(map);

    const shareGrid = document.getElementById("share-grid");
    const pathPoints = [];

    // 4. Process Findings & Populate Map
    const foundItemNames = finds.map((f) => f.item);

    finds.forEach((find) => {
        if (find.coords) {
            const currentPos = L.latLng(find.coords.lat, find.coords.lng);
            pathPoints.push(currentPos);

            // Marker with mode identification in popup
            L.marker(currentPos).addTo(map).bindPopup(`
                <div style="text-align:center">
                    <strong class="popup-mode-label" style="color:var(--text-muted); font-size:0.7rem;">${modeName} Mode</strong><br>
                    <b>${find.item}</b><br>
                    <img src="${find.image}" width="100" style="border-radius:4px; margin-top:5px">
                </div>
            `);

            // Grid Item for the Summary
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

    // 5. Identify Missing Items
    const missingItems = activeItems.filter((item) => !foundItemNames.includes(item));
    if (missingItems.length > 0) {
        const missingSection = document.createElement("div");
        missingSection.id = "missing-items-summary";
        missingSection.innerHTML = `
            <h3 class="missing-title">🔍 Items Not Found (${missingItems.length})</h3>
            <div class="missing-tags-container">
                ${missingItems.map((item) => `<span class="missing-tag">${item}</span>`).join("")}
            </div>
        `;
        document.getElementById("share-container").appendChild(missingSection);
    }

    // 6. Finalize Map View and Stats
    if (pathPoints.length > 0) {
        const bounds = L.latLngBounds(pathPoints);
        map.fitBounds(bounds.pad(0.2));
    }

    // Use the stored timestamps for precise timing
    const diffMs = endTimestamp - startTimestamp;
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);

    // Display consistent distance and time
    document.getElementById("stat-distance").textContent =
        distance < 1000 ? `Distance: ${Math.floor(distance)}m` : `Distance: ${(distance / 1000).toFixed(2)} km`;

    document.getElementById("stat-time").textContent = `Time Taken: ${mins}m ${secs}s`;

    // 7. Download & Clipboard Logic
    setupActionButtons();
}

/**
 * Encapsulated buttons to keep initMap clean
 */
function setupActionButtons() {
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
            btn.textContent = "Error copying image";
        }
    };
}

// Lightbox Close Logic
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
        alert("Clipboard copy failed. Your browser might require a secure context (HTTPS).");
    }
}
