// background.js

// 1. Handshake / Onboarding Logic
(async () => {
    const data = await browser.storage.local.get("isInitialized");

    // We only flip the switch if the sidebar has already
    // marked the user as "Waiting" (false).
    if (data.isInitialized === false) {
        await browser.storage.local.set({ isInitialized: true });
        console.log("Handshake successful. System online.");
    }
})();
// 2. Screenshot Logic
browser.runtime.onMessage.addListener(async (request, sender) => {
    if (request.action === "take_screenshot") {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            const activeTab = tabs[0];
            if (!activeTab) throw new Error("No active tab found");

            const captureMethod = browser.tabs.captureTab || browser.tabs.captureVisibleTab;
            return await captureMethod(activeTab.id, { format: "jpeg", quality: 30 });
        } catch (err) {
            console.error("Capture failed in background:", err);
            return null;
        }
    }
});
