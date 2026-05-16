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
let cachedUsers: any = null;
let isWriting = false;
let pendingWrite = false;
export async function readDB() {
if (cachedUsers !== null) return cachedUsers;
try {
const data = await fs.readFile(dbPath, "utf8");
cachedUsers = JSON.parse(data);
return cachedUsers;
} catch (err) {
return [];
}
}
export async function writeDB(data: any) {
cachedUsers = data;
if (isWriting) {
pendingWrite = true;
return;
}
isWriting = true;
try {
await fs.writeFile(dbPath, JSON.stringify(cachedUsers, null, 2), "utf8");
} catch (err) {
console.error(message.db.writeFail, err);
} finally {
isWriting = false;
if (pendingWrite) {
pendingWrite = false;
writeDB(cachedUsers);
}
}
}