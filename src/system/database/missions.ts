import { getUserByUsername, updateUserMissions, updateUserLimit, updateUserActivity } from "@/system/lib/account-db";
import { message } from "@/system/lib/responses";
import { addCoins } from "./products";

export const MISSION_LIST = {
    daily: [
        { id: "daily_limit", name: "Daily API Limit", reward: 10, rewardType: "limit" }, 
        { id: "daily_login", name: "Daily Login Bonus", reward: 10 }, 
        { id: "daily_api_call_10", name: "Use API v1 (10x)", reward: 50 }
    ],
    weekly: [{ id: "weekly_login_7", name: "7 Days Streak", reward: 200 }],
    social: [
        { id: "follow_github", name: "Follow GitHub Kagenou", reward: 50, url: "https://github.com/kagenouReal" },
        { id: "follow_tiktok", name: "Follow TikTok Kagenou", reward: 50, url: "https://www.tiktok.com/@veryy_lazyy" }
    ],
    achievement: [{ id: "first_premium", name: "First Premium", reward: 500 }]
};

export function getAvailableMissions(user: any) {
    const isPremium = !!user.premiumStatus?.isPremium;
    const role = user.role || 'user';
    const dailyLimitAmount = role === 'admin' 
        ? parseInt(process.env.LIMIT_ADMIN || "1000", 10)
        : (isPremium || role === 'premium' ? parseInt(process.env.LIMIT_PREMIUM || "100", 10) : parseInt(process.env.LIMIT_USER || "10", 10));

    const data: any = JSON.parse(JSON.stringify(MISSION_LIST));
    data.daily[0].reward = dailyLimitAmount;
    return data;
}

export async function completeMission(username: string, missionId: string, reward: number = 0, rewardType: 'coins' | 'limit' = 'coins') {
    try {
        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };
        
        // Robust initialization
        const missions = {
            completed: user.missions?.completed || [],
            lastClaimedDaily: user.missions?.lastClaimedDaily || null
        };
        const activity = {
            totalLogins: user.activity?.totalLogins || 0,
            dailyApiCalls: user.activity?.dailyApiCalls || 0,
            loginStreak: user.activity?.loginStreak || 0
        };

        const isDaily = missionId.startsWith("daily_");
        if (isDaily && missions.lastClaimedDaily) {
            const lastDate = new Date(missions.lastClaimedDaily).toDateString();
            const nowDate = new Date().toDateString();
            
            if (lastDate !== nowDate) {
                // Reset daily missions
                missions.completed = missions.completed.filter((id: string) => !id.startsWith("daily_"));
                missions.lastClaimedDaily = Date.now();
            } else if (missions.completed.includes(missionId)) {
                return { status: false, error: "Daily mission already completed today" };
            }
        } else if (isDaily) {
            missions.lastClaimedDaily = Date.now();
        }

        if (missions.completed.includes(missionId)) {
            return { status: false, error: "Mission already completed" };
        }

        // Mission specific checks
        if (missionId === "daily_login" || missionId === "daily_limit") {
            // Perbaikan: Update ke DB jika ini login pertama user
            if (!user.activity || !user.activity.totalLogins || user.activity.totalLogins === 0) {
                const newActivity = { ...(user.activity || {}), totalLogins: 1 };
                updateUserActivity(username, newActivity);
                activity.totalLogins = 1;
            }
        } else if (missionId === "daily_api_call_10") {
            if (activity.dailyApiCalls < 10) return { status: false, error: "You need at least 10 API calls today" };
        } else if (missionId === "weekly_login_7") {
            if (activity.loginStreak < 7) return { status: false, error: "You need a 7-day login streak" };
        } else if (missionId === "first_premium") {
            if (!user.premiumStatus?.isPremium) return { status: false, error: "You must be a premium member to claim this" };
        }

        missions.completed.push(missionId);
        updateUserMissions(username, missions);
        
        if (reward > 0) {
            if (rewardType === 'limit') {
                const newLimit = (user.limit || 0) + reward;
                updateUserLimit(username, newLimit);
            } else {
                await addCoins(username, reward, `Mission completed: ${missionId}`);
            }
        }

        return { status: true, message: `Mission completed!`, reward, rewardType };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}
