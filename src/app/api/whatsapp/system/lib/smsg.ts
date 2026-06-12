import { proto } from "@whiskeysockets/baileys";
//==================
export function smsg(sock: any, m: any) {
if (!m || !m.key) return m;
const botJid = sock.decodeJid(sock.user.id);
m.id = m.key.id; 
let chat = m.key.remoteJid;
if (chat && chat.includes("@lid") && m.key.remoteJidAlt) {
chat = m.key.remoteJidAlt;
}
m.chat = chat;
m.fromMe = m.key.fromMe;
m.isGroup = m.chat.endsWith("@g.us"); 
let sender = m.fromMe ? botJid : (m.key.participant || m.key.remoteJid);
if (sender && sender.includes("@lid")) {
sender = m.key.participantAlt || m.key.remoteJidAlt || sender;
}
m.sender = sock.decodeJid(sender);
if (m.message) {
m.mtype = Object.keys(m.message)[0];
if (["viewOnceMessageV2", "ephemeralMessage", "documentWithCaptionMessage"].includes(m.mtype)) {
m.message = m.message[m.mtype].message;
m.mtype = Object.keys(m.message)[0];
}
m.msg = m.message[m.mtype];
m.body = m.mtype === "conversation" ? m.message.conversation
: m.mtype === "imageMessage" ? m.message.imageMessage.caption
: m.mtype === "videoMessage" ? m.message.videoMessage.caption
: m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text
: "";
m.text = m.body || m.msg?.caption || m.msg?.text || m.msg?.contentText || "";
m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
m.quoted = m.msg?.contextInfo?.quotedMessage ? m.msg.contextInfo : null;
if (m.quoted) {
m.quoted.sender = sock.decodeJid(m.quoted.participant);
const quotedType = Object.keys(m.quoted.quotedMessage)[0];
m.quoted.text = m.quoted.quotedMessage[quotedType]?.text || m.quoted.quotedMessage[quotedType]?.caption || "";
}
} 
m.reply = (text: string, chatId: string = m.chat, options: any = {}) =>
sock.sendMessage(chatId, { text: text, ...options }, { quoted: m });
return m;
}
