/* eslint-disable @typescript-eslint/no-explicit-any */
import { proto, delay, downloadContentFromMessage } from "@whiskeysockets/baileys";
import jid from "@whiskeysockets/baileys";

export const downloadMediaMessage = async (message: any) => {
  let mtype = Object.keys(message)[0];
  mtype = mtype === "quotedMessage" ? Object.keys(message.quotedMessage)[0] : mtype;
  const msg = mtype === "quotedMessage" ? message.quotedMessage[mtype] : message[mtype];
  
  const stream = await downloadContentFromMessage(
    msg,
    mtype.replace("Message", "") as any
  );
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
};

export function smsg(conn: any, m: any) {
  if (!m) return m;

  m = { ...m }; // Membuka proteksi read-only objek bawaan Baileys

  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16;
    
    // --- [ FIXED LOGIKA CHAT JID VS LID ] ---
    let chat = m.key.remoteJid;
    // Jika remoteJid terdeteksi sebagai akun LID, paksa ambil JID alternatifnya
    if (chat && chat.includes("@lid") && m.key.remoteJidAlt) {
      chat = m.key.remoteJidAlt;
    }
    m.chat = chat;
    
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat.endsWith("@g.us");
    
    // --- [ FIXED LOGIKA SENDER JID VS LID ] ---
    let sender = m.fromMe 
      ? (conn.user.id.split(":")[0] + "@s.whatsapp.net" || conn.user.id) 
      : (m.key.participant || m.key.remoteJid);
      
    // Jika sender terdeteksi menggunakan format LID, bongkar ke JID asli
    if (sender && sender.includes("@lid")) {
      sender = m.key.participantAlt || m.key.remoteJidAlt || sender;
    }
    m.sender = conn.decodeJid(sender);
  }

  if (m.message) {
    m.mtype = Object.keys(m.message)[0];
    
    // Penanganan jika ada messageContextInfo atau ephememeral
    if (m.mtype === "viewOnceMessageV2") {
      m.message = m.message.viewOnceMessageV2.message;
      m.mtype = Object.keys(m.message)[0];
    } else if (m.mtype === "ephemeralMessage") {
      m.message = m.message.ephemeralMessage.message;
      m.mtype = Object.keys(m.message)[0];
    } else if (m.mtype === "documentWithCaptionMessage") {
      m.message = m.message.documentWithCaptionMessage.message;
      m.mtype = Object.keys(m.message)[0];
    }

    m.msg = m.message[m.mtype];
    
    // Ekstraksi Text Body
    m.body = m.mtype === "conversation" 
      ? m.message.conversation 
      : m.mtype === "imageMessage" 
      ? m.message.imageMessage.caption 
      : m.mtype === "videoMessage" 
      ? m.message.videoMessage.caption 
      : m.mtype === "extendedTextMessage" 
      ? m.message.extendedTextMessage.text 
      : m.mtype === "buttonsResponseMessage" 
      ? m.message.buttonsResponseMessage.selectedButtonId 
      : m.mtype === "listResponseMessage" 
      ? m.message.listResponseMessage.singleSelectReply.selectedRowId 
      : m.mtype === "templateButtonReplyMessage" 
      ? m.message.templateButtonReplyMessage.selectedId 
      : m.mtype === "interactiveResponseMessage"
      ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson || "{}").id
      : "";

    m.text = m.body || "";
    m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
  }

  // Fungsi utilitas reply bawaan pesan
  m.reply = (text: string, chatId = m.chat, options = {}) => 
    conn.sendMessage(chatId, { text: text, ...options }, { quoted: m });

  return m;
}
