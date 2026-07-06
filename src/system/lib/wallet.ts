import { getUserByUsername, updateUserCoins } from "./account-db";
import { message } from "@/system/lib/responses";

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

export async function adminSetCoins(username: string, amount: number, action: 'add' | 'set', reason: string = "Admin adjustment") {
    try {
        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };

        const coins = user.coins || { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() };

        if (action === 'add') {
            coins.total += amount;
            coins.earned += amount;
        } else {
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

export async function getCoins(username: string) {
    try {
        const user = getUserByUsername(username);
        if (!user) return { status: false, error: message.user.notFound };
        return { status: true, coins: user.coins || { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() } };
    } catch (e: unknown) {
        return { status: false, error: (e as Error).message || message.status.error };
    }
}
