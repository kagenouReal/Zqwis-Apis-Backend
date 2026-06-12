import fs from "fs-extra";
import path from "path";
import Database from "better-sqlite3";

const jsonPath = path.join(process.cwd(), "src/system/database/users.json");
const dbPath = path.join(process.cwd(), "src/system/database/database.db");

async function migrate() {
    if (!fs.existsSync(jsonPath)) {
        console.log("No users.json found, skipping migration.");
        return;
    }

    const users = await fs.readJson(jsonPath);
    const db = new Database(dbPath);

    // Initialize tables
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            apikey TEXT UNIQUE NOT NULL,
            "limit" INTEGER DEFAULT 0,
            maxIpQuota INTEGER DEFAULT 3,
            whitelistIp TEXT DEFAULT '[]',
            lastReset INTEGER,
            createdAt TEXT,
            premiumStatus TEXT DEFAULT '{}',
            coins TEXT DEFAULT '{}',
            coinHistory TEXT DEFAULT '[]',
            missions TEXT DEFAULT '{}',
            activity TEXT DEFAULT '{}'
        );
    `);

    const insert = db.prepare(`
        INSERT OR REPLACE INTO users (
            username, password, role, apikey, "limit", maxIpQuota, 
            whitelistIp, lastReset, createdAt, premiumStatus, 
            coins, coinHistory, missions, activity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((data) => {
        for (const user of data) {
            insert.run(
                user.username,
                user.password,
                user.role,
                user.apikey,
                user.limit || 0,
                user.maxIpQuota || 3,
                JSON.stringify(user.whitelistIp || []),
                user.lastReset || Date.now(),
                user.createdAt || new Date().toISOString(),
                JSON.stringify(user.premiumStatus || {}),
                JSON.stringify(user.coins || {}),
                JSON.stringify(user.coinHistory || []),
                JSON.stringify(user.missions || {}),
                JSON.stringify(user.activity || {})
            );
        }
    });

    transaction(users);
    console.log(`Successfully migrated ${users.length} users to SQLite.`);
}

migrate().catch(console.error);
