import crypto from "crypto";
import bcrypt from "bcryptjs";
import db from "./db";
import fs from "fs-extra";
import path from "path";

//==================
export const generateApiKey = () => process.env.GLOBAL_APIKEY + crypto.randomBytes(6).toString("hex");

//==================
// Helper to hash password
export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

// Helper to compare password
export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};

//==================
// Helper to parse JSON strings from SQLite
const parseJSON = (str: string) => {
    try {
        return JSON.parse(str);
    } catch {
        return {};
    }
};

const parseJSONArray = (str: string) => {
    try {
        return JSON.parse(str);
    } catch {
        return [];
    }
};

//==================
export async function readDB() {
    try {
        const users = db.prepare("SELECT * FROM users").all();
        return users.map((user: any) => ({
            ...user,
            whitelistIp: parseJSONArray(user.whitelistIp),
            premiumStatus: parseJSON(user.premiumStatus),
            coins: parseJSON(user.coins),
            coinHistory: parseJSONArray(user.coinHistory),
            missions: parseJSON(user.missions),
            activity: parseJSON(user.activity)
        }));
    } catch (err) {
        console.error("Database read failed:", err);
        return [];
    }
}

//==================
export async function writeDB(data: any[]) {
    const insert = db.prepare(`
        INSERT OR REPLACE INTO users (
            username, password, role, apikey, "limit", maxIpQuota, 
            whitelistIp, lastReset, createdAt, premiumStatus, 
            coins, coinHistory, missions, activity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((users) => {
        for (const user of users) {
            insert.run(
                user.username,
                user.password,
                user.role,
                user.apikey,
                user.limit,
                user.maxIpQuota,
                JSON.stringify(user.whitelistIp),
                user.lastReset,
                user.createdAt,
                JSON.stringify(user.premiumStatus),
                JSON.stringify(user.coins),
                JSON.stringify(user.coinHistory),
                JSON.stringify(user.missions),
                JSON.stringify(user.activity)
            );
        }
    });

    try {
        transaction(data);
    } catch (err) {
        console.error("Database write failed:", err);
    }
}

// Specific helper for performance (to be used in api-guard)
export function getUserByApiKey(apikey: string) {
    const user: any = db.prepare("SELECT * FROM users WHERE apikey = ?").get(apikey);
    if (!user) return null;
    return {
        ...user,
        whitelistIp: parseJSONArray(user.whitelistIp),
        premiumStatus: parseJSON(user.premiumStatus),
        coins: parseJSON(user.coins),
        coinHistory: parseJSONArray(user.coinHistory),
        missions: parseJSON(user.missions),
        activity: parseJSON(user.activity)
    };
}

export function getUserByUsername(username: string) {
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user) return null;
    return {
        ...user,
        whitelistIp: parseJSONArray(user.whitelistIp),
        premiumStatus: parseJSON(user.premiumStatus),
        coins: parseJSON(user.coins),
        coinHistory: parseJSONArray(user.coinHistory),
        missions: parseJSON(user.missions),
        activity: parseJSON(user.activity)
    };
}

export function updateUserLimit(username: string, limit: number) {
    db.prepare('UPDATE users SET "limit" = ? WHERE username = ?').run(limit, username);
}

export function resetUserLimit(username: string, limit: number, now: number) {
    db.prepare('UPDATE users SET "limit" = ?, lastReset = ? WHERE username = ?').run(limit, now, username);
}

//==================
// Targeted Update Functions
//==================

export function updateUserCoins(username: string, coins: any, coinHistory: any[]) {
    db.prepare('UPDATE users SET coins = ?, coinHistory = ? WHERE username = ?').run(
        JSON.stringify(coins),
        JSON.stringify(coinHistory),
        username
    );
}

export function updateUserPremium(username: string, premiumStatus: any) {
    db.prepare('UPDATE users SET premiumStatus = ? WHERE username = ?').run(
        JSON.stringify(premiumStatus),
        username
    );
}

export function updateUserWhitelist(username: string, whitelistIp: string[]) {
    db.prepare('UPDATE users SET whitelistIp = ? WHERE username = ?').run(
        JSON.stringify(whitelistIp),
        username
    );
}

export function updateUserAccount(username: string, data: { password?: string, username?: string, apikey?: string }) {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (data.password) {
        fields.push("password = ?");
        values.push(data.password);
    }
    if (data.username) {
        fields.push("username = ?");
        values.push(data.username);
    }
    if (data.apikey) {
        fields.push("apikey = ?");
        values.push(data.apikey);
    }
    
    if (fields.length === 0) return;
    
    values.push(username);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE username = ?`;
    db.prepare(query).run(...values);
}

export function updateUserMissions(username: string, missions: any) {
    db.prepare('UPDATE users SET missions = ? WHERE username = ?').run(
        JSON.stringify(missions),
        username
    );
}

export function deleteUser(username: string) {
    db.prepare("DELETE FROM users WHERE username = ?").run(username);
    
    // Cleanup WhatsApp session directories
    const waDir = path.join(process.cwd(), "src/system/database/whatsapp");
    if (fs.existsSync(waDir)) {
        const entries = fs.readdirSync(waDir);
        for (const entry of entries) {
            if (entry.startsWith(`${username}_`)) {
                fs.removeSync(path.join(waDir, entry));
            }
        }
    }
}

export function updateUserIpQuota(username: string, quota: number) {
    db.prepare('UPDATE users SET maxIpQuota = ? WHERE username = ?').run(quota, username);
}

export function updateUserActivity(username: string, activity: any) {
    db.prepare('UPDATE users SET activity = ? WHERE username = ?').run(
        JSON.stringify(activity),
        username
    );
}
