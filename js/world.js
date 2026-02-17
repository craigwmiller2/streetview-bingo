async function initWorldMap() {
    const data = await browser.storage.local.get("world_history");
    const history = data.world_history || [];

    // Initialize map centered on the world
    const map = L.map("world-map").setView([20, 0], 2);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "©OpenStreetMap, ©CartoDB",
        subdomains: "abcd",
        maxZoom: 20,
    }).addTo(map);

    // 1. Initialize the Cluster Group
    // spiderfyOnMaxZoom: spreads out markers that are at the exact same location
    // showCoverageOnHover: shows the area bounds of a cluster
    const clusters = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 15,
    });

    // Helper function for the copy logic (CSP safe)
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

        // 2. Create marker with custom DivIcon to replicate your circle style
        const marker = L.marker([point.lat, point.lng], {
            icon: L.divIcon({
                className: "custom-bingo-dot",
                html: `<div style="
                    background-color: ${color}; 
                    width: 12px; 
                    height: 12px; 
                    border-radius: 50%; 
                    border: 2px solid white; 
                    box-shadow: 0 0 4px rgba(0,0,0,0.3);
                    display: block;
                "></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
            }),
        });

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

        // 3. Add marker to the cluster group
        clusters.addLayer(marker);
    });

    // 4. Add the cluster group to the map
    map.addLayer(clusters);

    // CSP FIX: Event delegation for buttons inside popups
    map.on("popupopen", function (e) {
        const container = e.popup._contentNode;
        const copyBtn = container.querySelector(".share-copy-btn");

        if (copyBtn) {
            const lat = copyBtn.getAttribute("data-lat");
            const lng = copyBtn.getAttribute("data-lng");

            // Attach listener to fresh DOM element
            copyBtn.addEventListener("click", () => {
                handleCopyClick(lat, lng, copyBtn);
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", initWorldMap);
