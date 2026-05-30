import { promises as fs } from "fs";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import crypto from "crypto";
import { message } from "@/system/lib/message";

const dbDir = path.join(process.cwd(), "src", "system", "database");
const dbPath = path.join(dbDir, "users.json");
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
if (!existsSync(dbPath)) writeFileSync(dbPath, "[]", "utf8");
export const generateApiKey = () => process.env.GLOBAL_APIKEY + crypto.randomBytes(6).toString("hex");

let cachedUsers: any[] | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export async function readDB() {
  if (cachedUsers !== null) return cachedUsers;
  try {
    const data = await fs.readFile(dbPath, "utf8");
    cachedUsers = JSON.parse(data);
    return cachedUsers || [];
  } catch {
    return [];
  }
}

export async function writeDB(data: any[]) {
  cachedUsers = data;
  
  // Chain the write operations to ensure they happen sequentially
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
      console.error(message.db.writeFail, err);
    }
  });

  return writeQueue;
}