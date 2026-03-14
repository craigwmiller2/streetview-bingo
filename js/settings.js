// --- Elements ---
const sysSlider = document.getElementById("sys-volume");
const sfxSlider = document.getElementById("sfx-volume");
const sysLabel = document.getElementById("sys-vol-label");
const sfxLabel = document.getElementById("sfx-vol-label");
const fileInput = document.getElementById("import-file");

// --- Initialization: Load all settings ---
window.addEventListener("DOMContentLoaded", async () => {
    // 1. Fetch data
    const data = await browser.storage.local.get(["sysVolume", "sfxVolume", "itemAudioMode"]);

    // 2. Set Volume Sliders
    const sysVol = data.sysVolume !== undefined ? data.sysVolume : 1;
    const sfxVol = data.sfxVolume !== undefined ? data.sfxVolume : 1;
    sysSlider.value = sysVol;
    sfxSlider.value = sfxVol;
    sysLabel.textContent = Math.round(sysVol * 100) + "%";
    sfxLabel.textContent = Math.round(sfxVol * 100) + "%";

    // 3. Set Item Audio Mode (Radio Buttons)
    const mode = data.itemAudioMode || "all";
    const activeRadio = document.querySelector(`input[name="item-audio-mode"][value="${mode}"]`);
    if (activeRadio) activeRadio.checked = true;

    // 4. Check for URL Success Flags
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("status") === "reset_success") {
        showStatusNotification("All data has been successfully cleared.", "#e74c3c");
    } else if (urlParams.get("status") === "import_success") {
        showStatusNotification("Data imported and restored successfully.", "#2ecc71");
    }
});

// --- Volume Logic ---
sysSlider.oninput = (e) => {
    const val = parseFloat(e.target.value);
    sysLabel.textContent = Math.round(val * 100) + "%";
    browser.storage.local.set({ sysVolume: val });
};

sfxSlider.oninput = (e) => {
    const val = parseFloat(e.target.value);
    sfxLabel.textContent = Math.round(val * 100) + "%";
    browser.storage.local.set({ sfxVolume: val });
};

// --- Item Audio Mode Logic ---
document.querySelectorAll('input[name="item-audio-mode"]').forEach((radio) => {
    radio.onchange = (e) => {
        browser.storage.local.set({ itemAudioMode: e.target.value });
    };
});

// --- Export Logic ---
document.getElementById("export-btn").onclick = async () => {
    const allData = await browser.storage.local.get(null);
    const { current_game, ...backupData } = allData;

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `bingo_backup_${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
};

// --- Import Logic ---
document.getElementById("import-trigger").onclick = () => fileInput.click();

fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const confirmOverwrite = confirm("Importing data will DELETE all current progress. Proceed?");
    if (!confirmOverwrite) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            await browser.storage.local.clear();
            await browser.storage.local.set(importedData);
            window.location.href = window.location.pathname + "?status=import_success";
        } catch (err) {
            showStatusNotification("Error: Invalid backup file.", "#e74c3c");
        }
    };
    reader.readAsText(file);
};

// --- Reset Logic ---
document.getElementById("reset-stats-btn").onclick = async () => {
    if (confirm("Delete all career statistics and world history? This cannot be undone.")) {
        await browser.storage.local.clear();
        window.location.href = window.location.pathname + "?status=reset_success";
    }
};

/**
 * Simple in-page notification helper
 */
function showStatusNotification(message, color) {
    const notify = document.createElement("div");
    notify.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${color};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideDown 0.5s ease-out;
    `;
    notify.textContent = message;
    document.body.appendChild(notify);

    setTimeout(() => {
        notify.style.opacity = "0";
        notify.style.transition = "opacity 0.5s ease";
        setTimeout(() => notify.remove(), 500);
    }, 4000);
}
