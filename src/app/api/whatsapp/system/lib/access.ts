import fs from "fs-extra";
import path from "node:path";
//==================
const dir = path.join(process.cwd(), "src/system/database/whatsapp");
fs.ensureDirSync(dir);
//==================
const dbCache = new Map<string, any>();
//==================
const getPath = (botId: string) => {
const botDir = botId === "main" ? path.join(dir, "main") : path.join(dir, botId);
fs.ensureDirSync(botDir);
return path.join(botDir, "access.json");
};
//==================
const load = (botId: string) => {
if (dbCache.has(botId)) return dbCache.get(botId);
const p = getPath(botId);
const def = { access: [], public: true };
try {
if (fs.existsSync(p)) {
const res = fs.readJsonSync(p);
if (Array.isArray(res.access)) {
dbCache.set(botId, res);
return res;
}
}
} catch (_e) {}
fs.writeJsonSync(p, def, { spaces: 2 });
dbCache.set(botId, def);
return def;
};
//==================
const save = (botId: string, data: any) => {
dbCache.set(botId, data);
fs.writeJson(getPath(botId), data, { spaces: 2 }).catch(() => {});
return true;
};
//==================
export const addAccessUser = (id: string, botId: string) => {
const data = load(botId);
if (data.access.some((u: any) => u.id === id)) return false;
data.access.push({ id });
return save(botId, data);
};
//==================
export const delAccessUser = (id: string, botId: string) => {
const data = load(botId);
const i = data.access.findIndex((u: any) => u.id === id);
if (i === -1) return false;
data.access.splice(i, 1);
return save(botId, data);
};
//==================
export const setPublic = (val: boolean, botId: string) => {
const data = load(botId);
data.public = !!val;
return save(botId, data);
};
//==================
export const isPublic = (botId: string) => load(botId).public;
//==================
export const get = (botId: string) => load(botId);