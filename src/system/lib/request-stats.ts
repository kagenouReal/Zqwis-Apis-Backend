import { getSettings } from "./owner";
import { getUserByUsername, updateUserActivity } from "./account-db";

// Global Live Metrics
let globalStats: { total: number; success: number; failed: number; lastCrash: string | null } = {
    total: 0,
    success: 0,
    failed: 0,
    lastCrash: null
};

//==================
export function getStats() {
    const settings = getSettings();
    return {
        ...globalStats,
        broadcast: settings.broadcast || ""
    };
}

//==================
export function addSuccess(username?: string) {
    // 1. Update Global Stats
    globalStats.total++;
    globalStats.success++;

    // 2. Update User-Specific Stats (if provided)
    if (username && username !== "owner") {
        const user = getUserByUsername(username);
        if (user) {
            const activity = user.activity || {};
            activity.totalSuccess = (activity.totalSuccess || 0) + 1;
            // dailyApiCalls is already handled in api-guard
            updateUserActivity(username, activity);
        }
    }
}

//==================
export function addFail(username?: string) {
    // 1. Update Global Stats
    globalStats.total++;
    globalStats.failed++;
    globalStats.lastCrash = new Date().toISOString();

    // 2. Update User-Specific Stats (if provided)
    if (username && username !== "owner") {
        const user = getUserByUsername(username);
        if (user) {
            const activity = user.activity || {};
            activity.totalFailed = (activity.totalFailed || 0) + 1;
            activity.lastCrash = new Date().toISOString();
            updateUserActivity(username, activity);
        }
    }
}
