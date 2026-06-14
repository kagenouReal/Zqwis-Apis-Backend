import { getUserByUsername, updateUserCoins, updateUserPremium, updateUserLimit } from "@/system/lib/account-db";
import { message } from "@/system/lib/responses";

export const PREMIUM_PACKAGES: Record<string, { days: number, coinsRequired: number }> = {
    "7day": { days: 7, coinsRequired: 500 },
    "30day": { days: 30, coinsRequired: 1500 },
    "permanent": { days: -1, coinsRequired: 5000 }
};

export const LIMIT_PACKAGES: Record<string, { limit: number, coinsRequired: number }> = {
    "100": { limit: 100, coinsRequired: 100 },
    "500": { limit: 500, coinsRequired: 450 },
    "1000": { limit: 1000, coinsRequired: 800 }
};

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

        updateUserCoins(username, coins, history.slice(-50));
        return { status: true, message: `Added ${amount} coins. Total: ${coins.total}` };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}

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
export async function adminSetCoins(username: string, amount: number, action: 'add' | 'set', reason: string = "Admin adjustment") {
try {
const user = getUserByUsername(username);
if (!user) return { status: false, error: message.user.notFound };

const coins = user.coins || { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() };

if (action === 'add') {
    coins.total += amount;
    coins.earned += amount;
} else {
    // Direct set as requested
    coins.total = amount;
}

coins.lastUpdated = Date.now();
const history = user.coinHistory || [];
history.push({ type: action === 'add' ? "earn" : "set", amount, reason, date: Date.now() });

updateUserCoins(username, coins, history.slice(-50));
return { status: true, message: `Coins ${action}ed for ${username}. Total: ${coins.total}`, coins };
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

export async function buyPremium(username: string, packageType: "7day" | "30day" | "permanent") {
    try {
        const pkg = PREMIUM_PACKAGES[packageType];
        if (!pkg) return { status: false, error: message.input.invalid };

        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };

        const currentStatus = user.premiumStatus || { isPremium: false, premiumType: null, premiumExpiry: null, startDate: null };

        if (currentStatus.premiumType === "permanent") {
            return { status: false, error: "You already have permanent access" };
        }

        if (!user.coins || user.coins.total < pkg.coinsRequired) {
            return { status: false, error: "Insufficient coins" };
        }

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

export async function buyLimit(username: string, packageType: "100" | "500" | "1000") {
    try {
        const pkg = LIMIT_PACKAGES[packageType];
        if (!pkg) return { status: false, error: message.input.invalid };

        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };

        if (!user.coins || user.coins.total < pkg.coinsRequired) {
            return { status: false, error: "Insufficient coins" };
        }

        const spendResult = await spendCoins(username, pkg.coinsRequired, `Buy Limit (${packageType})`);
        if (!spendResult.status) return spendResult;

        const newLimit = (user.limit || 0) + pkg.limit;
        updateUserLimit(username, newLimit);

        return { status: true, message: `Successfully purchased ${packageType} limit. New limit: ${newLimit}` };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}

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
