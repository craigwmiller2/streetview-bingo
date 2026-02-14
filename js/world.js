async function initWorldMap() {
    const data = await browser.storage.local.get("world_history");
    const history = data.world_history || [];

    const map = L.map("world-map").setView([20, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Helper function for the copy logic (now safe from CSP)
    async function handleCopyClick(lat, lng, btn) {
        const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
        try {
            await navigator.clipboard.writeText(url);
            const originalText = btn.innerText;
            btn.innerText = "Copied! ✓";
            btn.style.background = "#2ecc71";
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = "#34495e";
            }, 2000);
        } catch (err) {
            console.error("Clipboard copy failed", err);
        }
    }

    history.forEach((point) => {
        const color = point.isBingo ? "#2ecc71" : "#e74c3c";
        const svUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${point.lat},${point.lng}`;

        const marker = L.circleMarker([point.lat, point.lng], {
            radius: 8,
            fillColor: color,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
        }).addTo(map);

        // We give the button a unique class so we can find it after it renders
        marker.bindPopup(`
            <div style="font-family: sans-serif; min-width: 160px; text-align: center;">
                <strong style="font-size: 1.1rem; display: block; margin-bottom: 2px;">${point.city}</strong>
                <span style="color: #7f8c8d; font-size: 0.9rem;">${point.country}</span>
                <hr style="margin: 8px 0; border: 0; border-top: 1px solid #eee;">
                
                <div style="margin-bottom: 8px; font-size: 0.9rem;">
                    Found: <strong>${point.found}/25</strong><br>
                    Result: <span style="color: ${color}; font-weight: bold;">${point.isBingo ? "BINGO" : "TIMEOUT"}</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <a href="${svUrl}" target="_blank" style="
                        background: #4285F4; color: white; text-decoration: none; 
                        padding: 6px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;
                    ">📍 Open Street View</a>
                    
                    <button class="share-copy-btn" data-lat="${point.lat}" data-lng="${point.lng}" style="
                        background: #34495e; color: white; border: none; cursor: pointer;
                        padding: 6px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;
                        transition: background 0.2s;
                    ">📋 Copy Share Link</button>
                </div>

                <div style="margin-top: 8px; font-size: 0.7rem; color: #bdc3c7;">
                    ${new Date(point.timestamp).toLocaleDateString()}
                </div>
            </div>
        `);
    });

    // CSP FIX: Listen for when ANY popup opens on the map
    map.on("popupopen", function (e) {
        const container = e.popup._contentNode;
        const copyBtn = container.querySelector(".share-copy-btn");

        if (copyBtn) {
            const lat = copyBtn.getAttribute("data-lat");
            const lng = copyBtn.getAttribute("data-lng");

            // Attach the click event properly via JavaScript
            copyBtn.addEventListener("click", () => {
                handleCopyClick(lat, lng, copyBtn);
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", initWorldMap);
