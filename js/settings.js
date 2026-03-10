// --- Export Logic ---
document.getElementById("export-btn").onclick = async () => {
    const allData = await browser.storage.local.get(null);

    // Create a copy of the data without the "current_game" key
    // This removes the heavy screenshots from the backup
    const { current_game, ...backupData } = allData;

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `bingo_backup_${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    // Clean up memory
    URL.revokeObjectURL(url);
};

// --- Import Logic ---
const fileInput = document.getElementById("import-file");
document.getElementById("import-trigger").onclick = () => fileInput.click();

fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const confirmOverwrite = confirm(
        "Importing data will DELETE all current progress. Are you sure you want to proceed?",
    );
    if (!confirmOverwrite) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            await browser.storage.local.clear();
            await browser.storage.local.set(importedData);
            // Redirect to show success
            window.location.href = window.location.pathname + "?status=import_success";
        } catch (err) {
            showStatusNotification("Error: Invalid backup file.", "#e74c3c");
        }
    };
    reader.readAsText(file);
};

// --- Reset Logic ---
document.getElementById("reset-stats-btn").onclick = async () => {
    const confirmed = confirm("Delete all career statistics and world history? This cannot be undone.");

    if (confirmed) {
        await browser.storage.local.clear();
        // Reload with a success flag in the URL
        window.location.href = window.location.pathname + "?status=reset_success";
    }
};

// --- Check for Success Flags on Load ---
window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("status") === "reset_success") {
        showStatusNotification("All data has been successfully cleared.", "#e74c3c");
    } else if (urlParams.get("status") === "import_success") {
        showStatusNotification("Data imported and restored successfully.", "#2ecc71");
    }
});

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

    // Auto-remove after 4 seconds
    setTimeout(() => {
        notify.style.opacity = "0";
        notify.style.transition = "opacity 0.5s ease";
        setTimeout(() => notify.remove(), 500);
    }, 4000);
}

// --- Volume Logic ---
const sysSlider = document.getElementById("sys-volume");
const sfxSlider = document.getElementById("sfx-volume");
const sysLabel = document.getElementById("sys-vol-label");
const sfxLabel = document.getElementById("sfx-vol-label");

// Load existing volumes
window.addEventListener("DOMContentLoaded", async () => {
    const data = await browser.storage.local.get(["sysVolume", "sfxVolume"]);

    // Default to 1 (100%) if never set
    const sysVol = data.sysVolume !== undefined ? data.sysVolume : 1;
    const sfxVol = data.sfxVolume !== undefined ? data.sfxVolume : 1;

    sysSlider.value = sysVol;
    sfxSlider.value = sfxVol;
    sysLabel.textContent = Math.round(sysVol * 100) + "%";
    sfxLabel.textContent = Math.round(sfxVol * 100) + "%";
});

// Save volumes on change
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

const defaultSfxCheckbox = document.getElementById("enable-default-sfx");

// Load existing setting
window.addEventListener("DOMContentLoaded", async () => {
    const data = await browser.storage.local.get(["sysVolume", "sfxVolume", "useDefaultSfx"]);

    // ... Existing volume loading ...

    // Default to true if never set
    defaultSfxCheckbox.checked = data.useDefaultSfx !== false;
});

// Save on change
defaultSfxCheckbox.onchange = (e) => {
    browser.storage.local.set({ useDefaultSfx: e.target.checked });
};
