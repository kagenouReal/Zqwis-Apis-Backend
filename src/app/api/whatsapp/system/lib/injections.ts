import { generateWAMessageFromContent, prepareWAMessageMedia } from "@whiskeysockets/baileys";
import crypto from "node:crypto";
//==================
export function injectSockets(conn: any) {
conn.decodeJid = (jid: string) => {
if (!jid) return jid;
const clean = jid.split(":")[0];
if (/@s\.whatsapp\.net$|@g\.us$/.test(clean)) return clean;
if (/^\d+$/.test(clean)) return `${clean}@s.whatsapp.net`;
return clean;
};
//==================
conn.sendText = (jid: string, text: string, quoted = "", opts = {}) =>
conn.sendMessage(jid, { text, ...opts }, { quoted } as any);
//==================
conn.sendExternalThumb = async (jid: string, data: any = {}, options: any = {}) => {
const { text = '', title = '', body = '', thumbUrl, iconUrl, sourceUrl, renderLarger = true, ...rest } = data;
const finalText = (sourceUrl || '') + '\n' + (text || '');
let jpegBuf = null;
const tasks = [];
let thumbData = {}, iconData = {};
if (thumbUrl) {
tasks.push(prepareWAMessageMedia({ image: { url: thumbUrl } }, { upload: conn.waUploadToServer, mediaTypeOverride: "thumbnail-link" as any }).then((wam: any) => {
const i = wam.imageMessage || wam;
jpegBuf = i.jpegThumbnail || null;
thumbData = {
thumbnailDirectPath: i.directPath || "",
thumbnailSha256: i.fileSha256?.toString('base64') || "",
thumbnailEncSha256: i.fileEncSha256?.toString('base64') || "",
mediaKey: i.mediaKey?.toString('base64') || "",
mediaKeyTimestamp: i.mediaKeyTimestamp || Math.floor(Date.now() / 1000),
thumbnailHeight: i.height || 736,
thumbnailWidth: i.width || 1308
};
}).catch(() => {}));
}
if (iconUrl) {
tasks.push(prepareWAMessageMedia({ image: { url: iconUrl } }, { upload: conn.waUploadToServer, mediaTypeOverride: "thumbnail-link" as any }).then((wam: any) => {
const i = wam.imageMessage || wam;
iconData = { faviconMMSMetadata: {
thumbnailDirectPath: i.directPath || "",
thumbnailSha256: i.fileSha256?.toString('base64') || "",
thumbnailEncSha256: i.fileEncSha256?.toString('base64') || "",
mediaKey: i.mediaKey?.toString('base64') || "",
mediaKeyTimestamp: i.mediaKeyTimestamp || Math.floor(Date.now() / 1000),
thumbnailHeight: i.height || 48,
thumbnailWidth: i.width || 48
}};
}).catch(() => {}));
}
await Promise.all(tasks);
const ctx = { ...rest.contextInfo };
if (options.quoted) {
ctx.stanzaId = options.quoted.key.id;
ctx.participant = options.quoted.key.participant || options.quoted.key.remoteJid;
ctx.quotedMessage = options.quoted.message || { conversation: "" };
}
const content = {
extendedTextMessage: {
text: finalText,
matchedText: sourceUrl,
title,
description: body,
previewType: 1,
renderLargerThumbnail: renderLarger,
jpegThumbnail: jpegBuf,
...thumbData,
...iconData,
...rest,
contextInfo: ctx
},
messageContextInfo: { messageSecret: crypto.randomBytes(32) }
};
return await conn.relayMessage(jid, content, { quoted: options.quoted, ...options });
};
//==================
conn.sendAiMsg = async (jid: string, content: any = {}, options: any = {}) => {
let submsgs = [];
let sections = [];
let unifiedData = content.unifiedData;
if (content.text) submsgs.push({ messageType: 2, messageText: content.text });
if (content.table) submsgs.push({ messageType: 4, tableMetadata: content.table });
if (content.code) submsgs.push({ messageType: 5, codeMetadata: content.code });
if (content.gridImage) submsgs.push({ messageType: 1, gridImageMetadata: content.gridImage });
if (content.image) submsgs.push({ messageType: 3, imageMetadata: content.image });
if (content.dynamic) submsgs.push({ messageType: 6, dynamicMetadata: content.dynamic });
if (content.map) submsgs.push({ messageType: 7, mapMetadata: content.map });
if (content.latex) submsgs.push({ messageType: 8, latexMetadata: content.latex });
if (content.reels) {
submsgs.push({ messageType: 9, contentItemsMetadata: { contentType: 1, itemsMetadata: content.reels.map((i: any) => ({ reelItem: i })) } });
sections = [
{ view_model: { primitive: { text: content.text || "", __typename: "GenAIMarkdownTextUXPrimitive" }, __typename: "GenAISingleLayoutViewModel" } },
{ view_model: { primitives: content.reels.map((i: any) => ({ reels_url: i.videoUrl, thumbnail_url: i.thumbnailUrl, creator: i.title, avatar_url: i.profileIconUrl, reel_source: "IG", __typename: "GenAIReelPrimitive" })), __typename: "GenAIHScrollLayoutViewModel" } },
];
unifiedData = { response_id: crypto.randomUUID(), sections };
} else if (content.text && !content.gridImage && !content.image && !content.map && !content.code && !content.dynamic && !content.latex && !content.table) {
sections.push({ view_model: { primitive: { text: content.text, __typename: "GenAIMarkdownTextUXPrimitive" }, __typename: "GenAISingleLayoutViewModel" } });
}
if (content.submessages) submsgs = content.submessages;
const ctxInfo = {
forwardingScore: 1,
isForwarded: true,
forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
forwardOrigin: 4,
...(content.contextInfo || {}),
};
if (options.quoted) {
ctxInfo.stanzaId = options.quoted.key.id;
ctxInfo.participant = options.quoted.sender || options.quoted.key.participant || options.quoted.key.remoteJid;
ctxInfo.quotedMessage = options.quoted.message;
}
const msgData = {
messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2, botMetadata: { pluginMetadata: {}, richResponseSourcesMetadata: { sources: content.sources || [] } } },
botForwardedMessage: {
message: {
richResponseMessage: {
messageType: 1,
submessages: submsgs,
unifiedResponse: { data: JSON.stringify(unifiedData || { response_id: crypto.randomUUID(), sections }) },
contextInfo: ctxInfo
}
}
}
};
const msg = generateWAMessageFromContent(jid, msgData as any, { userJid: conn.user?.id, ...options } as any);
await conn.relayMessage(jid, msg.message, { messageId: msg.key.id, ...options });
return msg;
};
//==================
}