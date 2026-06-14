import makeWASocket, {
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs-extra";
import { smsg } from "@/app/api/whatsapp/system/lib/smsg";
import handler from "@/app/api/whatsapp/system/handler";
import { injectSockets } from "@/app/api/whatsapp/system/lib/injections";
import { message } from "@/system/lib/responses";
//==================
const DB_DIR = path.join(process.cwd(), "src/system/database/whatsapp");

export interface WABotInstance {
    username: string;
    phoneNumber: string;
    connected: boolean;
    connectedAt: number | null;
    socket?: any;
}

interface WASystem {
    bots: Map<string, WABotInstance>;
    connecting: Set<string>;
    initialized: boolean;
}

// Use global to preserve state across HMR/Reloads in Next.js
if (!(global as any).wa_system) {
    (global as any).wa_system = {
        bots: new Map<string, WABotInstance>(),
        connecting: new Set<string>(),
        initialized: false
    };
}

const wa_system = (global as any).wa_system as WASystem;

//==================
export class WABot {
private static get bots() { return wa_system.bots; }
private static get connecting() { return wa_system.connecting; }
private static get initialized() { return wa_system.initialized; }
private static set initialized(v: boolean) { wa_system.initialized = v; }

//==================
//==================
static async init() {
if (this.initialized) return;
this.initialized = true;
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
await this.loadPlugins();
const entries = fs.readdirSync(DB_DIR, { withFileTypes: true });
for (const entry of entries) {
if (entry.isDirectory()) {
const botDir = path.join(DB_DIR, entry.name);
const botRegistry = path.join(botDir, "bots.json");
if (fs.existsSync(botRegistry)) {
try {
const botData = fs.readJsonSync(botRegistry);
const botsToLoad = Array.isArray(botData) ? botData : [botData];
for (const bot of botsToLoad) {
if (bot.phoneNumber) { 
const botId = `${bot.username}_${bot.phoneNumber}`;
// ADD TO MAP IMMEDIATELY for visibility in status API
if (!this.bots.has(botId)) {
    this.bots.set(botId, {
        username: bot.username,
        phoneNumber: bot.phoneNumber,
        connected: false,
        connectedAt: bot.connectedAt || null
    });
}
// Try to connect in background
this.connect(bot.username, bot.phoneNumber).catch(() => {});
}
}
} catch (e) {
console.error(`[WA INIT FAILED] ${entry.name}:`, e);
}
}
}
}
}
//==================
static async loadPlugins() {
const pluginDir = path.join(process.cwd(), "src/app/api/whatsapp/system/plugins");
(global as any).plugins = {};
if (!fs.existsSync(pluginDir)) return;
const folders = fs.readdirSync(pluginDir, { withFileTypes: true })
.filter((dirent) => dirent.isDirectory())
.map((dirent) => dirent.name);
await Promise.all(folders.map(async (folder) => {
const folderPath = path.join(pluginDir, folder);
const files = fs.readdirSync(folderPath, { withFileTypes: true })
.filter((dirent) => dirent.isFile() && (dirent.name.endsWith(".js") || dirent.name.endsWith(".ts")))
.map((dirent) => dirent.name);
await Promise.all(files.map(async (file) => {
const filePath = path.join(folderPath, file);
try {
const dynamicImport = new Function('specifier', 'return import(specifier)');
const plugin = await dynamicImport(`file://${filePath}?t=${Date.now()}`);
const pluginObj = plugin.default || plugin;
const handlerFunc = typeof pluginObj === "function" ? pluginObj : pluginObj?.handler;
const commands = pluginObj?.command;
if (typeof handlerFunc === "function" && Array.isArray(commands)) {
const categoryName = folder.toLowerCase();
for (const cmd of commands) {
(global as any).plugins[cmd.toLowerCase()] = {
name: file,
category: categoryName,
handler: handlerFunc,
};
}
}
} catch (e) {
console.error(e);
}
}));
}));
}
//==================
static async connect(username: string, phoneNumber: string) {
const botId = `${username}_${phoneNumber}`;
const botDir = path.join(DB_DIR, botId);
const sessionPath = path.join(botDir, "session");

// Check if already connecting or connected to prevent loops
if (this.connecting.has(botId)) {
    console.log(`wa ${botId} connecting...`);
    return { status: "connecting", pairingCode: null };
}

const existing = this.bots.get(botId);
if (existing?.connected) {
    console.log(`wa ${botId} ${message.whatsapp.alreadyConnected.toLowerCase()}`);
    return { status: "already_connected", pairingCode: null };
}

if (!fs.existsSync(botDir)) fs.mkdirSync(botDir, { recursive: true });

// Ensure bot info is always in the map during the process
if (!this.bots.has(botId)) {
    this.bots.set(botId, { username, phoneNumber, connected: false, connectedAt: null });
} else {
    try { existing?.socket?.end?.(); } catch {}
}

this.connecting.add(botId);
//==================
try {
const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
const { version } = await fetchLatestBaileysVersion();
const socket = makeWASocket({
version,
keepAliveIntervalMs: 30000,
auth: state,
logger: pino({ level: "fatal" }),
printQRInTerminal: false,
browser: ["Mac OS", "Safari", "17.0"],
markOnlineOnConnect: false,
generateHighQualityLinkPreview: false,
getMessage: async () => {
return { conversation: "kyahh" };
},
});
(socket as any).username = username;
(socket as any).botId = botId;
injectSockets(socket);

// Update socket reference in existing map entry
const currentBot = this.bots.get(botId);
if (currentBot) {
    currentBot.socket = socket;
}

let pairingCode: string | null = null;
const isRegistered = socket.authState.creds.registered;
if (!isRegistered) {
try {
const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
await new Promise((r) => setTimeout(r, 3000));
pairingCode = await socket.requestPairingCode(cleanNumber, process.env.WA_PAIRINGCODE);
} catch (err) {
this.connecting.delete(botId);
throw err;
}
}
//==================
socket.ev.on("connection.update", async (update) => {
const { connection, lastDisconnect } = update;
if (connection === "close") {
this.connecting.delete(botId);
const bot = this.bots.get(botId);
if (bot) {
bot.connected = false;
try { bot.socket?.end?.(); } catch {}
}
const reason = new Boom(lastDisconnect?.error as Error)?.output?.statusCode;
if (!socket.authState.creds.registered) {
this.bots.delete(botId);
if (fs.existsSync(botDir)) fs.removeSync(botDir);
return;
}
if (
reason !== DisconnectReason.loggedOut &&
reason !== DisconnectReason.badSession
) {
// Don't delete from Map, just update status and reconnect
if (bot) bot.connected = false;
setTimeout(() => {
this.connect(username, phoneNumber).catch(console.error);
}, 3000);
} else {
this.bots.delete(botId);
if (fs.existsSync(botDir)) fs.removeSync(botDir);
}
} else if (connection === "open") {
console.log(`wa ${botId} ${message.whatsapp.connected.toLowerCase()}`);
this.connecting.delete(botId);
this.bots.set(botId, {
username,
socket,
phoneNumber,
connected: true,
connectedAt: Date.now(),
});
this.saveBot(botId);
}
});
socket.ev.on("creds.update", saveCreds);
//==================
socket.ev.on("messages.upsert", async ({ messages, type }) => {
if (type !== "notify" || !messages?.length) return;
const msg = messages[0];
if (!msg.message || msg.key?.remoteJid === "status@broadcast") return;
try {
const m = smsg(socket, msg);
await handler(socket, m);
} catch (e) {
console.error(e);
}
});
//==================
// Final check to ensure it's in the map with the right socket reference
const finalBot = this.bots.get(botId);
if (finalBot) {
    finalBot.socket = socket;
}
//==================
return { status: "success", pairingCode };
} catch (e) {
this.connecting.delete(botId);
throw e;
}
}
//==================
static getBots(): WABotInstance[] {
return Array.from(this.bots.values());
}
//==================
static async disconnect(username: string, phoneNumber: string) {
const botId = `${username}_${phoneNumber}`;
const bot = this.bots.get(botId);
// If not in memory, check if directory exists to clean up orphaned sessions
const botDir = path.join(DB_DIR, botId);
if (!bot && !fs.existsSync(botDir)) return false;

if (bot) {
try { 
    bot.socket.ev.removeAllListeners("connection.update"); // Prevent auto-reconnect
    bot.socket.end(undefined); 
} catch {}
this.bots.delete(botId);
}

if (fs.existsSync(botDir)) {
    try {
        fs.removeSync(botDir);
    } catch (e) {
        console.error(`Failed to delete bot directory: ${botDir}`, e);
    }
}
return true;
}
//==================
private static saveBot(botId: string) {
const bot = this.bots.get(botId);
if (!bot) return;
const botDir = path.join(DB_DIR, botId);
if (!fs.existsSync(botDir)) fs.mkdirSync(botDir, { recursive: true });
const botRegistry = path.join(botDir, "bots.json");
const cleanBot = {
username: bot.username,
phoneNumber: bot.phoneNumber,
connected: bot.connected,
connectedAt: bot.connectedAt,
};
fs.writeJsonSync(botRegistry, cleanBot);
}
//==================
static getMaxBots(role: string) {
  const limits: Record<string, number> = {
    owner: Number(process.env.WA_MAXPAIRBOT_OWNER) || 999,
    admin: Number(process.env.WA_MAXPAIRBOT_ADMIN) || 10,
    premium: Number(process.env.WA_MAXPAIRBOT_PREMIUM) || 3,
    user: Number(process.env.WA_MAXPAIRBOT_USER) || 1
  };
  return limits[role] || 1;
}
}