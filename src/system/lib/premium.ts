import { getUserByUsername, updateUserCoins, updateUserPremium, updateUserMissions, updateUserLimit } from "@/system/lib/account-db";
import { message } from "@/system/lib/responses";

export const PREMIUM_PACKAGES: Record<string, { days: number, coinsRequired: number }> = {
    "7day": { days: 7, coinsRequired: 100 },
    "30day": { days: 30, coinsRequired: 350 },
    "permanent": { days: -1, coinsRequired: 1000 }
};

export const LIMIT_PACKAGES: Record<string, { limit: number, coinsRequired: number }> = {
    "100": { limit: 100, coinsRequired: 50 },
    "500": { limit: 500, coinsRequired: 200 },
    "1000": { limit: 1000, coinsRequired: 350 }
};

//==================
export async function addCoins(username: string, amount: number, reason: string = "Unknown") {
    try {
        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };

        const coins = user.coins || { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() };
        coins.total += amount;
        coins.earned += amount;
        coins.lastUpdated = Date.now();

        const history = user.coinHistory || [];
        history.push({ type: "earn", amount, reason, date: Date.now() });

        updateUserCoins(username, coins, history.slice(-50)); // Keep last 50 entries
        return { status: true, message: `Added ${amount} coins. Total: ${coins.total}` };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}

//==================
export async function spendCoins(username: string, amount: number, reason: string = "Unknown") {
    try {
        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };

        const coins = user.coins || { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() };
        if (coins.total < amount) {
            return { status: false, error: "Insufficient coins" };
        }

        coins.total -= amount;
        coins.spent += amount;
        coins.lastUpdated = Date.now();

        const history = user.coinHistory || [];
        history.push({ type: "spend", amount, reason, date: Date.now() });

        updateUserCoins(username, coins, history.slice(-50));
        return { status: true, message: `Spent ${amount} coins. Total: ${coins.total}` };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}

//==================
export async function getCoins(username: string) {
    try {
        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };
        return { status: true, coins: user.coins || { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() } };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}

//==================
export async function buyPremium(username: string, packageType: "7day" | "30day" | "permanent") {
    try {
        const pkg = PREMIUM_PACKAGES[packageType];
        if (!pkg) return { status: false, error: message.input.invalid };

        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };

        const currentStatus = user.premiumStatus || { isPremium: false, premiumType: null, premiumExpiry: null, startDate: null };

        // If already permanent, cannot buy anything else
        if (currentStatus.premiumType === "permanent") {
            return { status: false, error: "You already have permanent access" };
        }

        if (!user.coins || user.coins.total < pkg.coinsRequired) {
            return { status: false, error: "Insufficient coins" };
        }

        // Spend coins
        const spendResult = await spendCoins(username, pkg.coinsRequired, `Buy Premium (${packageType})`);
        if (!spendResult.status) return spendResult;

        let newExpiry = null;
        if (packageType !== "permanent") {
            const now = Date.now();
            const currentExpiry = (currentStatus.isPremium && currentStatus.premiumExpiry && currentStatus.premiumExpiry > now) ? currentStatus.premiumExpiry : now;
            newExpiry = currentExpiry + (pkg.days * 24 * 60 * 60 * 1000);
        }

        const newStatus = {
            isPremium: true,
            premiumType: packageType,
            premiumExpiry: newExpiry,
            startDate: currentStatus.startDate || Date.now()
        };

        updateUserPremium(username, newStatus);
        return { status: true, message: `Successfully purchased ${packageType} premium` };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}

//==================
export async function buyLimit(username: string, packageType: "100" | "500" | "1000") {
    try {
        const pkg = LIMIT_PACKAGES[packageType];
        if (!pkg) return { status: false, error: message.input.invalid };

        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };

        if (!user.coins || user.coins.total < pkg.coinsRequired) {
            return { status: false, error: "Insufficient coins" };
        }

        // Spend coins
        const spendResult = await spendCoins(username, pkg.coinsRequired, `Buy Limit (${packageType})`);
        if (!spendResult.status) return spendResult;

        const newLimit = (user.limit || 0) + pkg.limit;
        updateUserLimit(username, newLimit);

        return { status: true, message: `Successfully purchased ${packageType} limit. New limit: ${newLimit}` };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}

//==================
export async function getPremiumStatus(username: string) {
    try {
        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };
        
        const status = user.premiumStatus || { isPremium: false, premiumType: null, premiumExpiry: null, startDate: null };
        const now = Date.now();
        if (status.isPremium && status.premiumExpiry && status.premiumExpiry < now) {
            status.isPremium = false;
            status.premiumType = null;
            updateUserPremium(username, status);
        }
        
        let daysLeft = 0;
        if (status.isPremium) {
            if (status.premiumType === "permanent") {
                daysLeft = 9999;
            } else if (status.premiumExpiry) {
                daysLeft = Math.ceil((status.premiumExpiry - now) / (1000 * 60 * 60 * 24));
            }
        }

        return { 
            status: true, 
            isPremium: status.isPremium,
            type: status.premiumType,
            expiry: status.premiumExpiry,
            daysLeft: daysLeft,
            premium: status 
        };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}

//==================
export async function checkMission(username: string, missionId: string) {
    try {
        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };
        const missions = user.missions || { completed: [] };
        return { status: true, completed: missions.completed.includes(missionId) };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}

//==================
export async function completeMission(username: string, missionId: string, reward: number = 0, rewardType: 'coins' | 'limit' = 'coins') {
    try {
        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };
        const missions = user.missions || { completed: [], lastClaimedDaily: null };
        const activity = user.activity || { lastLogin: null, loginStreak: 0, totalLogins: 0, apiCalls: 0 };

        // Handle Daily Reset logic for specific missions
        const isDaily = missionId.startsWith("daily_");
        if (isDaily && missions.lastClaimedDaily) {
            const lastDate = new Date(missions.lastClaimedDaily).toDateString();
            const nowDate = new Date().toDateString();
            if (lastDate === nowDate && missions.completed.includes(missionId)) {
                return { status: false, error: "Daily mission already completed today" };
            }
            // If it's a new day, clear daily missions from completed list
            if (lastDate !== nowDate) {
                missions.completed = missions.completed.filter((id: string) => !id.startsWith("daily_"));
                missions.lastClaimedDaily = Date.now();
            }
        } else if (isDaily) {
            missions.lastClaimedDaily = Date.now();
        }

        if (missions.completed.includes(missionId)) {
            return { status: false, error: "Mission already completed" };
        }

        // Validation based on mission ID
        if (missionId === "daily_login") {
            if (activity.totalLogins === 0) return { status: false, error: "You haven't logged in yet" };
        } else if (missionId === "daily_limit") {
            // Always allow if logged in, just as a daily bonus
            if (activity.totalLogins === 0) return { status: false, error: "You haven't logged in yet" };
        } else if (missionId === "api_call_10") {
            if ((activity.dailyApiCalls || 0) < 10) return { status: false, error: "You need at least 10 API calls today" };
        } else if (missionId === "weekly_login_7") {
            if ((activity.loginStreak || 0) < 7) return { status: false, error: "You need a 7-day login streak" };
        } else if (missionId === "game_play_1") {
            if ((activity.gamePlayed || 0) < 1) return { status: false, error: "You need to play at least 1 game" };
        } else if (missionId === "game_win_3") {
            if ((activity.gameWins || 0) < 3) return { status: false, error: "You need to win at least 3 games" };
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

        return { status: true, message: `Mission ${missionId} completed!`, reward, rewardType };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}

//==================
export async function getMissions(username: string) {
    try {
        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };
        return { status: true, missions: user.missions || { completed: [] } };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}
