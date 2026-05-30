/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs-extra";
import "@/app/api/whatsapp/system/lib/config";
import { smsg } from "@/app/api/whatsapp/system/lib/myfunction";
import handler from "@/app/api/whatsapp/system/handler";
import { injectMethods } from "@/app/api/whatsapp/system/lib/injections";

const BASE_DB_DIR = path.join(process.cwd(), "src/system/database/whatsapp");

export class WABot {
  private static bots = new Map<string, any>();
  private static connecting = new Set<string>();
  private static initialized = false;

  static async init() {
    if (this.initialized) return;
    this.initialized = true;

    if (!fs.existsSync(BASE_DB_DIR)) fs.mkdirSync(BASE_DB_DIR, { recursive: true });  

    await this.loadPlugins();  

    const entries = fs.readdirSync(BASE_DB_DIR, { withFileTypes: true });  
    for (const entry of entries) {  
      if (entry.isDirectory()) {  
        const botDir = path.join(BASE_DB_DIR, entry.name);  
        const botRegistry = path.join(botDir, "bots.json");  
        if (fs.existsSync(botRegistry)) {  
          try {  
            const botData = fs.readJsonSync(botRegistry);  
            const botsToLoad = Array.isArray(botData) ? botData : [botData];  
            for (const bot of botsToLoad) {  
              if (bot.connected) {
                this.connect(bot.username, bot.phoneNumber).catch(e =>   
                  console.error(`Failed to reconnect bot ${bot.username}:`, e)
                );
                await new Promise((r) => setTimeout(r, 1000));  
              }
            }  
          } catch (e) {  
            console.error(`Error loading bot from ${entry.name}:`, e);  
          }  
        }  
      }  
    }
  }

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
          console.error(`Error loading plugin ${file} from ${folder}:`, e);  
        }  
      }));  
    }));  
    console.log(`[ PLUGIN ] Total ${Object.keys((global as any).plugins).length} commands loaded.`);
  }

  static async connect(username: string, phoneNumber: string) {
    const botId = `${username}_${phoneNumber}`;
    const botDir = path.join(BASE_DB_DIR, botId);
    const sessionPath = path.join(botDir, "session");

    if (!fs.existsSync(botDir)) fs.mkdirSync(botDir, { recursive: true });  

    if (this.connecting.has(botId)) {
      const activeBot = this.bots.get(botId);
      if (!activeBot) this.connecting.delete(botId); 
    }  
      
    if (this.bots.has(botId)) {  
      const existing = this.bots.get(botId);  
      if (existing?.connected) return { status: "already_connected", pairingCode: null };  
      
      try { existing.socket?.end?.(); } catch {}
      this.bots.delete(botId);
    }  

    this.connecting.add(botId);  

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

      injectMethods(socket);  

      let pairingCode: string | null = null;  
      const isRegistered = socket.authState.creds.registered;

      if (!isRegistered) {  
        try {  
          const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");  
          await new Promise((r) => setTimeout(r, 3000));  
          pairingCode = await socket.requestPairingCode(cleanNumber);  
        } catch (err) {
          this.connecting.delete(botId);
          throw err;
        }  
      }  

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
            console.log(`[ BOT ] Pairing failed or closed for ${username} (${phoneNumber}). Stopping reconnection lifecycle.`);
            this.bots.delete(botId);
            if (fs.existsSync(botDir)) fs.removeSync(botDir);
            return;
          }

          if (  
            reason !== DisconnectReason.loggedOut &&  
            reason !== DisconnectReason.badSession  
          ) {  
            console.log(`[ BOT ] Connection closed for ${username} (${phoneNumber}), reconnecting...`);  
            this.bots.delete(botId);  
            setTimeout(() => {  
              this.connect(username, phoneNumber).catch(console.error);  
            }, 3000);  
          } else {  
            console.log(`[ BOT ] Logout detected for ${username} (${phoneNumber}), cleaning up...`);  
            this.bots.delete(botId);  
            if (fs.existsSync(botDir)) fs.removeSync(botDir);  
          }  
        } else if (connection === "open") {  
          console.log("-[ WhatsApp Connected! ]");  
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

      socket.ev.on("messages.upsert", async ({ messages, type }) => {  
        if (type !== "notify" || !messages?.length) return;  
        const msg = messages[0];  
        if (!msg.message || msg.key?.remoteJid === "status@broadcast") return;  
          
        try {  
          const m = smsg(socket, msg);  
          await handler(socket, m);  
        } catch (e) {  
          console.error("Error handling message:", e);  
        }  
      });  

      if (isRegistered) {
        this.bots.set(botId, {  
          username,  
          socket,  
          phoneNumber,  
          connected: false,  
          connectedAt: null,  
        });
      }

      return { status: "pending", pairingCode };  
    } catch (e) {  
      this.connecting.delete(botId);  
      throw e;  
    }
  }

  static getBots() {
    return Array.from(this.bots.values());
  }

  static async disconnect(username: string, phoneNumber: string) {
    const botId = `${username}_${phoneNumber}`;
    const bot = this.bots.get(botId);
    if (!bot) return false;

    try { bot.socket.end(undefined); } catch {}  
    this.bots.delete(botId);  

    const botDir = path.join(BASE_DB_DIR, botId);  
    if (fs.existsSync(botDir)) fs.removeSync(botDir);  

    return true;
  }

  private static saveBot(botId: string) {
    const bot = this.bots.get(botId);
    if (!bot) return;

    const botDir = path.join(BASE_DB_DIR, botId);  
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

  static getMaxBots(role: string) {
    const limits: Record<string, number> = { owner: 999, admin: 5, premium: 3, user: 1 };
    return limits[role] || 1;
  }
}
