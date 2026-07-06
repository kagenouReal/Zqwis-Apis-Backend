import crypto from "crypto";
import bcrypt from "bcryptjs";
import db from "./db";
import fs from "fs-extra";
import path from "path";

//==================
// PRE-COMPILED STATEMENTS: Perintah SQL dikompilasi sekali pas startup
// Biar backend gak perlu mikir ulang tiap ada request masuk.
const stmtSelectAll = db.prepare("SELECT * FROM users");
const stmtSelectByApiKey = db.prepare("SELECT * FROM users WHERE apikey = ?");
const stmtSelectByUsername = db.prepare("SELECT * FROM users WHERE username = ?");
const stmtUpdateLimit = db.prepare('UPDATE users SET "limit" = ? WHERE username = ?');
const stmtResetLimit = db.prepare('UPDATE users SET "limit" = ?, lastReset = ? WHERE username = ?');
const stmtUpdateCoins = db.prepare('UPDATE users SET coins = ?, coinHistory = ? WHERE username = ?');
const stmtUpdatePremium = db.prepare('UPDATE users SET premiumStatus = ? WHERE username = ?');
const stmtUpdateWhitelist = db.prepare('UPDATE users SET whitelistIp = ? WHERE username = ?');
const stmtUpdateMissions = db.prepare('UPDATE users SET missions = ? WHERE username = ?');
const stmtUpdateActivity = db.prepare('UPDATE users SET activity = ? WHERE username = ?');
const stmtUpdateIpQuota = db.prepare('UPDATE users SET maxIpQuota = ? WHERE username = ?');
const stmtDeleteUser = db.prepare("DELETE FROM users WHERE username = ?");
const stmtInsertUser = db.prepare(`
    INSERT OR REPLACE INTO users (
        username, password, role, apikey, "limit", maxIpQuota, 
        whitelistIp, createdAt, premiumStatus, 
        coins, coinHistory, missions, activity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

//==================
export const generateApiKey = () => (process.env.GLOBAL_APIKEY || "") + crypto.randomBytes(6).toString("hex");

export const hashPassword = async (password: string) => await bcrypt.hash(password, 10);
export const comparePassword = async (password: string, hash: string) => await bcrypt.compare(password, hash);

const parseJSON = (str: string) => {
    try { return JSON.parse(str); } catch { return {}; }
};
const parseJSONArray = (str: string) => {
    try { return JSON.parse(str); } catch { return []; }
};

const mapUser = (user: any) => {
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
};

//==================
export async function readDB() {
    try {
        const users = stmtSelectAll.all();
        return users.map(mapUser);
    } catch (err) {
        console.error("Database read failed:", err);
        return [];
    }
}

export async function writeDB(data: any[]) {
    const transaction = db.transaction((users) => {
        for (const user of users) {
            stmtInsertUser.run(
                user.username, user.password, user.role, user.apikey,
                user.limit, user.maxIpQuota, JSON.stringify(user.whitelistIp),
                user.createdAt, JSON.stringify(user.premiumStatus),
                JSON.stringify(user.coins), JSON.stringify(user.coinHistory),
                JSON.stringify(user.missions), JSON.stringify(user.activity)
            );
        }
    });
    try { transaction(data); } catch (err) { console.error("Database write failed:", err); }
}

export function getUserByApiKey(apikey: string) {
    return mapUser(stmtSelectByApiKey.get(apikey));
}

export function getUserByUsername(username: string) {
    return mapUser(stmtSelectByUsername.get(username));
}

export function saveUser(user: any) {
    db.prepare(`
        UPDATE users SET 
        "limit" = ?, 
        maxIpQuota = ?, 
        whitelistIp = ?, 
        premiumStatus = ?, 
        coins = ?, 
        coinHistory = ?, 
        missions = ?, 
        activity = ?,
        sessionToken = ?
        WHERE username = ?
    `).run(
        user.limit,
        user.maxIpQuota,
        JSON.stringify(user.whitelistIp),
        JSON.stringify(user.premiumStatus),
        JSON.stringify(user.coins),
        JSON.stringify(user.coinHistory),
        JSON.stringify(user.missions),
        JSON.stringify(user.activity),
        user.sessionToken,
        user.username
    );
}

export function updateSessionToken(username: string, token: string | null) {
    db.prepare('UPDATE users SET sessionToken = ? WHERE username = ?').run(token, username);
}

export function updateUserLimit(username: string, limit: number) {
    const user = getUserByUsername(username);
    if (user) {
        user.limit = limit;
        saveUser(user);
    }
}

export function resetUserLimit(username: string, limit: number, now: number) {
    stmtResetLimit.run(limit, now, username);
}

export function updateUserCoins(username: string, coins: any, coinHistory: any[]) {
    const user = getUserByUsername(username);
    if (user) {
        user.coins = coins;
        user.coinHistory = coinHistory;
        saveUser(user);
    }
}

export function updateUserPremium(username: string, premiumStatus: any) {
    const user = getUserByUsername(username);
    if (user) {
        user.premiumStatus = premiumStatus;
        saveUser(user);
    }
}

export function updateUserWhitelist(username: string, whitelistIp: string[]) {
    const user = getUserByUsername(username);
    if (user) {
        user.whitelistIp = whitelistIp;
        saveUser(user);
    }
}

export function updateUserAccount(username: string, data: { password?: string, username?: string, apikey?: string }) {
    // Dynamic update masih perlu prepare manual karena field-nya berubah-ubah
    const fields: string[] = [];
    const values: any[] = [];
    if (data.password) { fields.push("password = ?"); values.push(data.password); }
    if (data.username) { fields.push("username = ?"); values.push(data.username); }
    if (data.apikey) { fields.push("apikey = ?"); values.push(data.apikey); }
    if (fields.length === 0) return;
    values.push(username);
    db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE username = ?`).run(...values);
}

export function updateUserMissions(username: string, missions: any) {
    const user = getUserByUsername(username);
    if (user) {
        user.missions = missions;
        saveUser(user);
    }
}

export function updateUserIpQuota(username: string, quota: number) {
    const user = getUserByUsername(username);
    if (user) {
        user.maxIpQuota = quota;
        saveUser(user);
    }
}

export function updateUserActivity(username: string, activity: any) {
    const user = getUserByUsername(username);
    if (user) {
        user.activity = activity;
        saveUser(user);
    }
}

export function deleteUser(username: string) {
    stmtDeleteUser.run(username);
}

