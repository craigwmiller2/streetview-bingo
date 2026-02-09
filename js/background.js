browser.runtime.onMessage.addListener(async (request, sender) => {
    if (request.action === "take_screenshot") {
        try {
            // 1. Get the currently active tab in the window
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            const activeTab = tabs[0];

            if (!activeTab) throw new Error("No active tab found");

            // 2. Use captureTab (which showed up in your console log)
            // If captureVisibleTab is missing, captureTab is the Firefox MV3 equivalent
            const captureMethod = browser.tabs.captureTab || browser.tabs.captureVisibleTab;

            return await captureMethod(activeTab.id, { format: "png", quality: 70 });
        } catch (err) {
            console.error("Capture failed in background:", err);
            return null;
        }
    }
});
