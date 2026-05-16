import { NextResponse } from "next/server";
import axios from "axios";
import WebSocket from "ws";
import { addSuccess, addFail } from "@/system/lib/store";
import { checkApikey } from "@/system/lib/apiguard";
import { message } from "@/system/lib/message";

async function chatHiWaifu(robotId: string | number, prompt: string) {
return await new Promise(async (resolve) => {
try {
const createRes = await axios.post('https://api.hiwaifu.com/client/session/single', {
"robot_id": parseInt(robotId as string, 10),
"sign": "771d08a89e4d674f25da0358b1d2ee34"
}, {
headers: {
'user-agent': 'Dart/3.10 (dart:io)',
'connection': 'keep-alive',
'phone-brand': 'Xiaomi',
'accept-encoding': 'gzip',
'channel': 'google',
'age': '1',
'authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjbGllbnQudnVaYWRtaW4iLCJhdWQiOiJzZXJ2ZXIudnVlYWRtaW4iLCJpYXQiOjE3Nzg5MTY4MzguNDc3MDg5LCJuYmYiOjE3Nzg5MTY4MzguNDc3MDg5LCJleHAiOjEwNDE4ODM0MDM4LjQ3NzA4OSwidWlkIjoie1widXNlcl9pZFwiOjExMDIyOTY2fSJ9.BIQzUvt0qmJpzdOr3OZqQLOL97DkOaZqKsc1HXHoH1M',
'device-id': 'BP1A.250505.005',
'content-type': 'application/json',
'phone-platform': 'android',
'app-ver': '3.7.0',
'gaid': '912da4cd-9252-4566-a21b-1e7e083923cc',
'token': 'JDJ5JDEwJE1iaGhzTFRHWUFRNVNHellPamNMMy5MWEdlWi5pS21WU2F2UTJJUnlHV1hhRlY2SEVQamgy',
'request-id': '7f2b9d003c61f7981f2e61e694bbf043',
'request-timestamp': '1778916868370',
'lang': 'en',
'uid': '11022966',
'host': 'api.hiwaifu.com',
'package': 'com.hiwaifu.app',
'phone-device-width': '411.42857142857144',
'phone-device-height': '890.2857142857143',
'phone-model': '23127PN0CC'
}
});
if (createRes.data.status !== 200) {
return resolve({ status: false });
}
const chatId = createRes.data.data.chat_id;
const sessionId = createRes.data.data.session_id;
const channelName = `private-chat-${sessionId}`;
let activeSocketId = "";
const ws = new WebSocket('wss://wss.hiwaifu.com/app/workbunny', { headers: { 'User-Agent': 'Dart/3.10 (dart:io)' } });
const timeout = setTimeout(() => {
ws.close();
resolve({ status: false });
}, 60000);
ws.on('message', async (data: any) => {
const msg = JSON.parse(data.toString());
if (msg.event === 'pusher:connection_established') {
activeSocketId = typeof msg.data === 'string' ? JSON.parse(msg.data).socket_id : msg.data.socket_id;
try {
const authRes = await axios.post('https://api.hiwaifu.com/subscribe/auth', {
channel_name: channelName,
socket_id: activeSocketId
}, {
headers: { 'user-agent': 'Dart/3.10 (dart:io)', 'content-type': 'application/json; charset=UTF-8' }
});
ws.send(JSON.stringify({ event: 'pusher:subscribe', data: { channel: channelName, auth: authRes.data.auth } }));
} catch (err) {
clearTimeout(timeout);
ws.close();
resolve({ status: false });
}
}
if (msg.event === 'pusher_internal:subscription_succeeded') {
try {
await axios.post('https://api.hiwaifu.com/client/session/send', {
"chat_id": chatId,
"session_id": parseInt(sessionId, 10),
"content": prompt,
"stream": false,
"sign": "3e52a84140e92d8f793491166faaba67"
}, {
headers: {
'user-agent': 'Dart/3.10 (dart:io)',
'connection': 'keep-alive',
'phone-brand': 'Xiaomi',
'accept-encoding': 'gzip',
'channel': 'google',
'age': '1',
'authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjbGllbnQudnVlYWRtaW4iLCJhdWQiOiJzZXJ2ZXIudnVlYWRtaW4iLCJpYXQiOjE3Nzg5MTY4MzguNDc3MDg5LCJuYmYiOjE3Nzg5MTY4MzguNDc3MDg5LCJleHAiOjEwNDE4ODM0MDM4LjQ3NzA4OSwidWlkIjoie1widXNlcl9pZFwiOjExMDIyOTY2fSJ9.BIQzUvt0qmJpzdOr3OZqQLOL97DkOaZqKsc1HXHoH1M',
'device-id': 'BP1A.250505.005',
'content-type': 'application/json',
'phone-platform': 'android',
'app-ver': '3.7.0',
'gaid': '912da4cd-9252-4566-a21b-1e7e083923cc',
'token': 'JDJ5JDEwJE1iaGhzTFRHWUFRNVNHellPamNMMy5MWEdlWi5pS21WU2F2UTJJUnlHV1hhRlY2SEVQamgy',
'request-id': 'f707cbeae3fb57e0351e076c768db22c',
'request-timestamp': '1778913928350',
'lang': 'en',
'uid': '11022966',
'host': 'api.hiwaifu.com',
'package': 'com.hiwaifu.app',
'phone-device-width': '411.42857142857144',
'phone-device-height': '890.2857142857143',
'phone-model': '23127PN0CC'
}
});
} catch (err) {
clearTimeout(timeout);
ws.close();
resolve({ status: false });
}
}
if (msg.event === 'client-message') {
const msgData = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
if (msgData.type === 1 && msgData.robot_id !== 0) {
clearTimeout(timeout);
ws.close();
resolve({ status: true, reply: msgData.content });
}
}
});
ws.on('error', () => {
clearTimeout(timeout);
resolve({ status: false });
});
} catch (err) {
resolve({ status: false });
}
});
}

export async function POST(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
try {
const body = await req.json().catch(() => ({}));
const { robotId, prompt } = body;
if (!robotId || !prompt) {
addFail();
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const result: any = await chatHiWaifu(robotId, prompt);
if (!result || !result.status) {
addFail();
return NextResponse.json({ status: false, message: message.scrape.fetchFailed }, { status: 500 });
}
addSuccess();
return NextResponse.json({
status: true,
message: message.status.success,
creator: "@Zqwis-Apis",
limit_left: auth.user?.role === "user" ? auth.user.limit : "UNLIMITED",
data: { reply: result.reply }
}, { status: 200 });
} catch (err) {
addFail();
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
