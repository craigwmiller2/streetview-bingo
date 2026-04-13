/**
 * Daily Country Challenge Data & Logic
 * v1.5.1 - 2026-02-18
 */

const DAILY_COUNTRIES = [
    { name: "Qatar", flag: "🇶🇦" },
    { name: "Ireland", flag: "🇮🇪" },
    { name: "Australia", flag: "🇦🇺" },
    { name: "Senegal", flag: "🇸🇳" },
    { name: "Christmas Island", flag: "🇨🇽" },
    { name: "Belgium", flag: "🇧🇪" },
    { name: "Uganda", flag: "🇺🇬" },
    { name: "Bermuda", flag: "🇧🇲" },
    { name: "Malaysia", flag: "🇲🇾" },
    { name: "Taiwan", flag: "🇹🇼" },
    { name: "Japan", flag: "🇯🇵" },
    { name: "New Zealand", flag: "🇳🇿" },
    { name: "United Arab Emirates", flag: "🇦🇪" },
    { name: "Israel", flag: "🇮🇱" },
    { name: "Hungary", flag: "🇭🇺" },
    { name: "Netherlands", flag: "🇳🇱" },
    { name: "Bulgaria", flag: "🇧🇬" },
    { name: "Slovakia", flag: "🇸🇰" },
    { name: "United States", flag: "🇺🇸" },
    { name: "Chile", flag: "🇨🇱" },
    { name: "Uruguay", flag: "🇺🇾" },
    { name: "Poland", flag: "🇵🇱" },
    { name: "Italy", flag: "🇮🇹" },
    { name: "United States Virgin Islands", flag: "🇻🇮" },
    { name: "Thailand", flag: "🇹🇭" },
    { name: "Indonesia", flag: "🇮🇩" },
    { name: "Madagascar", flag: "🇲🇬" },
    { name: "Mexico", flag: "🇲🇽" },
    { name: "Montenegro", flag: "🇲🇪" },
    { name: "Germany", flag: "🇩🇪" },
    { name: "Sweden", flag: "🇸🇪" },
    { name: "Singapore", flag: "🇸🇬" },
    { name: "Canada", flag: "🇨🇦" },
    { name: "Slovenia", flag: "🇸🇮" },
    { name: "Brazil", flag: "🇧🇷" },
    { name: "Estonia", flag: "🇪🇪" },
    { name: "Philippines", flag: "🇵🇭" },
    { name: "Kazakhstan", flag: "🇰🇿" },
    { name: "Lesotho", flag: "🇱🇸" },
    { name: "Iceland", flag: "🇮🇸" },
    { name: "Ghana", flag: "🇬🇭" },
    { name: "Dominican Republic", flag: "🇩🇴" },
    { name: "Denmark", flag: "🇩🇰" },
    { name: "Faroe Islands", flag: "🇫🇴" },
    { name: "Colombia", flag: "🇨🇴" },
    { name: "Andorra", flag: "🇦🇩" },
    { name: "Portugal", flag: "🇵🇹" },
    { name: "Isle of Man", flag: "🇮🇲" },
    { name: "United Kingdom", flag: "🇬🇧" },
    { name: "Ukraine", flag: "🇺🇦" },
    { name: "Norway", flag: "🇳🇴" },
    { name: "Tunisia", flag: "🇹🇳" },
    { name: "Romania", flag: "🇷🇴" },
    { name: "Sri Lanka", flag: "🇱🇰" },
    { name: "Czechia", flag: "🇨🇿" },
    { name: "Serbia", flag: "🇷🇸" },
    { name: "Russia", flag: "🇷🇺" },
    { name: "Latvia", flag: "🇱🇻" },
    { name: "Finland", flag: "🇫🇮" },
    { name: "France", flag: "🇫🇷" },
    { name: "Guatemala", flag: "🇬🇹" },
    { name: "North Macedonia", flag: "🇲🇰" },
    { name: "Switzerland", flag: "🇨🇭" },
    { name: "Botswana", flag: "🇧🇼" },
    { name: "Austria", flag: "🇦🇹" },
    { name: "Pakistan", flag: "🇵🇰" },
    { name: "Ecuador", flag: "🇪🇨" },
    { name: "Puerto Rico", flag: "🇵🇷" },
    { name: "Eswatini", flag: "🇸🇿" },
    { name: "Kenya", flag: "🇰🇪" },
    { name: "Guam", flag: "🇬🇺" },
    { name: "Kyrgyzstan", flag: "🇰🇬" },
    { name: "Bolivia", flag: "🇧🇴" },
    { name: "Bangladesh", flag: "🇧🇩" },
    { name: "Bhutan", flag: "🇧🇹" },
    { name: "Vietnam", flag: "🇻🇳" },
    { name: "Hong Kong", flag: "🇭🇰" },
    { name: "India", flag: "🇮🇳" },
    { name: "Lithuania", flag: "🇱🇹" },
    { name: "South Korea", flag: "🇰🇷" },
    { name: "Curaçao", flag: "🇨🇼" },
    { name: "Croatia", flag: "🇭🇷" },
    { name: "Malta", flag: "🇲🇹" },
    { name: "Turkey", flag: "🇹🇷" },
    { name: "South Africa", flag: "🇿🇦" },
    { name: "Peru", flag: "🇵🇪" },
    { name: "Greece", flag: "🇬🇷" },
    { name: "Albania", flag: "🇦🇱" },
    { name: "China", flag: "🇨🇳" },
    { name: "Rwanda", flag: "🇷🇼" },
    { name: "Mongolia", flag: "🇲🇳" },
    { name: "Panama", flag: "🇵🇦" },
    { name: "Northern Mariana Islands", flag: "🇲🇵" },
    { name: "Argentina", flag: "🇦🇷" },
    { name: "Monaco", flag: "🇲🇨" },
    { name: "Nigeria", flag: "🇳🇬" },
    { name: "Luxembourg", flag: "🇱🇺" },
    { name: "Greenland", flag: "🇬🇱" },
    { name: "Spain", flag: "🇪🇸" },
    { name: "Cambodia", flag: "🇰🇭" },
    { name: "Réunion", flag: "🇷🇪" },
    { name: "Costa Rica", flag: "🇨🇷" },
];

/**
 * Deterministically get a country based on the current date.
 * Everyone playing today will get the same country.
 */
function getDailyCountry() {
    // Reference date (Version 1.5 launch)
    const startDate = new Date("2026-02-18").setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);

    // Calculate difference in days
    const dayIndex = Math.round((today - startDate) / (24 * 60 * 60 * 1000));

    // 3. Prevent negative indices just in case of system clock errors
    const safeIndex = Math.max(0, dayIndex);

    // 4. Select country
    return DAILY_COUNTRIES[safeIndex % DAILY_COUNTRIES.length];
}

/**
 * Updates the sidebar UI with the latest challenge info
 */
async function updateDailyChallengeHUD() {
    const daily = getDailyCountry();
    const todayKey = new Date().toLocaleDateString("en-GB"); // e.g. "18/02/2026"

    const data = await browser.storage.local.get("daily_stats");
    const dailyStats = data.daily_stats || {};
    const todayStats = dailyStats[todayKey] || { best: 0, completed: false };

    // Update Text Elements
    document.getElementById("challenge-flag").innerText = daily.flag;
    document.getElementById("challenge-country-name").innerText = daily.name;
    document.getElementById("challenge-progress").innerText = `Best: ${todayStats.best}/25`;

    // Update Status Badge
    const badge = document.getElementById("challenge-status");
    if (todayStats.completed) {
        badge.innerText = "COMPLETED";
        badge.classList.add("completed");
    } else {
        badge.innerText = "UNCOMPLETED";
        badge.classList.remove("completed");
    }

    // Launch Button Logic
    document.getElementById("btn-launch-challenge").onclick = () => {
        const url = `https://www.google.com/maps/search/${encodeURIComponent(daily.name)}`;

        browser.tabs.create({ url });
    };
}

/**
 * Saves progress specifically for the Daily Country Challenge
 */
async function updateDailyChallengeProgress(playedCountry, targetCountry, score) {
    const todayKey = new Date().toLocaleDateString("en-GB");
    const data = await browser.storage.local.get("daily_stats");
    let dailyStats = data.daily_stats || {};

    // Initialize today's entry if it doesn't exist
    if (!dailyStats[todayKey]) {
        dailyStats[todayKey] = { best: 0, completed: false };
    }

    // Check if the game was played in the correct country
    if (playedCountry.toLowerCase().includes(targetCountry.toLowerCase())) {
        // Update high score for today
        if (score > dailyStats[todayKey].best) {
            dailyStats[todayKey].best = score;
        }

        // Mark as completed if they got a Bingo (25/25)
        if (score === 25) {
            // Check if they already won today to avoid double-counting the achievement stat
            if (!dailyStats[todayKey].completed) {
                dailyStats[todayKey].completed = true;

                // Increment total challenge wins for achievements
                const globalData = await browser.storage.local.get("global_stats");
                let global = globalData.global_stats || {};

                // Only increment the permanent stat once per day
                global.dailyChallengeWins = (global.dailyChallengeWins || 0) + 1;

                await browser.storage.local.set({ global_stats: global });
            }
        }
    }

    await browser.storage.local.set({ daily_stats: dailyStats });
}
