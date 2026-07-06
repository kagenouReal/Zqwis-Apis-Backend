import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "src/system/database/database.db");
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 5000');

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
        activity TEXT DEFAULT '{}',
        sessionToken TEXT
    );
`);

// Pastikan sessionToken sudah ada
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
if (!tableInfo.find(column => column.name === 'sessionToken')) {
    db.exec('ALTER TABLE users ADD COLUMN sessionToken TEXT');
}

db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
`);

export default db;
