import fs from "fs-extra";
import path from "node:path";
import { get, isPublic, setPublic, addAccessUser, delAccessUser } from "./lib/access";
//==================
const handler = async (conn: any, m: any) => {
try {
const body = m.body || "";
const prefix = (global as any).prefix.find((p: string) => body.startsWith(p)) || "";
if (!prefix) return;
const args = body.slice(prefix.length).trim().split(/ +/).slice(1);
const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();
const text = args.join(" ");
const botNumber = conn.decodeJid(conn.user.id);
const ownerNumber = `${(global as any).owner}@s.whatsapp.net`;
const dbId = conn.botId || "main";
const accessData = get(dbId);
const isAccess = [botNumber, ownerNumber, ...(accessData.access || []).map((u: any) => `${u.id.replace(/\D/g, "")}@s.whatsapp.net`)].includes(m.sender);
if (!isPublic(dbId) && !isAccess) return;
//==================
const mess = (global as any).mess;
const plugin = (global as any).plugins[command];
if (plugin) {
await plugin.handler(m, { conn, m, isBotAdmins, isAdmins, command, args, text, isAccess, prefix });
return;
}
const manualCmds: Record<string, string[]> = {
"Owner": ["public", "self", "addaccess", "delaccess", "listaccess"]
};
switch (command) {
//==================
case 'help':
case 'menu':
m.reply(`*Do You Mean Zqwis?*\nExample *: ${prefix}zqwis*`);
break;
//==================
case "zqwis": {
let teks = "";
const allCmds: Record<string, string[]> = { ...manualCmds };
for (const cmd in (global as any).plugins) {
const p = (global as any).plugins[cmd];
if (!allCmds[p.category]) allCmds[p.category] = [];
if (!allCmds[p.category].includes(cmd)) allCmds[p.category].push(cmd);
}
for (const cat in allCmds) {
teks += `*${cat.toUpperCase()}*\n${allCmds[cat].map(cmd => `> ${prefix + cmd}`).join("\n")}\n\n`;
}
await conn.sendExternalThumb(m.chat, {
text: teks.trim(),
body: "ɢɪᴛʜᴜʙ.ᴄᴏᴍ/ᴋᴀɢᴇɴᴏᴜʀᴇᴀʟ",
thumbUrl: path.join(process.cwd(), "src/app/api/whatsapp/system/media/mainthumb.jpg"),
iconUrl: path.join(process.cwd(), "src/app/api/whatsapp/system/media/iconthumb.png"),
sourceUrl: `https://github.com/kagenouReal`,
contextInfo: {
mentionedJid: [m.sender],
forwardingScore: 999,
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: "20101116777999@newsletter",
newsletterName: "[⌗] Whatsapp - Zqwis",
serverMessageId: 1
}
}
}, { 
quoted: {
key: { fromMe: true, participant: "0@s.whatsapp.net", remoteJid: m.sender },
message: {
orderMessage: {
orderId: "65bh4ddqr90",
thumbnail: fs.readFileSync(path.join(process.cwd(), "src/app/api/whatsapp/system/media/minithumb.jpg")),
itemCount: 97947,
status: "INQUIRY",
surface: "CATALOG",
orderTitle: "product",
message: prefix + command,
sellerJid: m.sender,
token: "775BBQR0",
totalAmount1000: 777,
totalCurrencyCode: "MYR"
}
}
} 
});
break;
}
//==================
case "public":
if (!isAccess) return m.reply(mess.owner);
if (isPublic(dbId)) return m.reply(mess.wrong);
setPublic(true, dbId);
m.reply(mess.success);
break;
//==================
case "self":
if (!isAccess) return m.reply(mess.owner);
if (!isPublic(dbId)) return m.reply(mess.wrong);
setPublic(false, dbId);
m.reply(mess.success);
break;
//==================
case "addaccess": {
if (!isAccess) return m.reply(mess.owner);
if (!text) return m.reply(`-Example: ${prefix + command} (nomor)`);
const user = text.replace(/[^\d]/g, "");
if (accessData.access.some((u: any) => u.id === user)) return m.reply(mess.wrong);
addAccessUser(user, dbId);
m.reply(mess.success);
break;
}
//==================
case "delaccess": {
if (!isAccess) return m.reply(mess.owner);
if (!text) return m.reply(`-Example: ${prefix + command} (nomor)`);
const user = text.replace(/[^\d]/g, "");
if (!accessData.access.some((u: any) => u.id === user)) return m.reply(mess.wrong);
delAccessUser(user, dbId);
m.reply(mess.success);
break;
}
//==================
case "listaccess":
if (!isAccess) return m.reply(mess.owner);
if (!accessData.access?.length) return m.reply(mess.wrong);
m.reply(`*ʟɪsᴛ ᴀᴄᴄᴇss*\n${accessData.access.map((u: any, i: number) => `> ${i + 1}: ${u.id}`).join("\n")}`);
break;
}
//==================
} catch (e) {
console.error(e);
}
};
export default handler;

