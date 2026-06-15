import { NextResponse } from "next/server";
import axios from "axios";
import WebSocket from "ws";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";
//==================
async function freegen(prompt: string) {
try {
const { ts, sig } = (await axios.post("https://prompt-signer.freegen.app", { prompt })).data;
const { job_id } = (await axios.post("https://image-generator.freegen.app", { prompt, ts, sig, selected_style: "" })).data;
return await new Promise((resolve, reject) => {
const ws = new WebSocket("wss://websocket-bridge.freegen.app/ws");
const timer = setTimeout(() => {
ws.close();
reject(new Error("Timeout"));
}, 60000);
ws.on("open", () => ws.send(JSON.stringify({ type: "subscribe", job_id, auth: job_id })));
ws.on("message", async (data: any) => {
const msg = JSON.parse(data);
if (msg.type === "result") {
clearTimeout(timer);
ws.close();
resolve({ status: true, buffer: msg.image_data.replace(/^data:image\/\w+;base64,/, "") });
} else if (msg.type === "error") {
clearTimeout(timer);
ws.close();
reject(new Error(msg.message));
}
});
ws.on("error", (err) => {
clearTimeout(timer);
reject(err);
});
});
} catch (e) {
return { status: false };
}
}
//==================
export async function GET(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
try {
const { searchParams } = new URL(req.url);
const prompt = searchParams.get("prompt");
if (!prompt) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const result: any = await freegen(prompt);
if (!result || !result.status) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.scrape.fetchFailed }, { status: 500 });
}
addSuccess(auth.user.username);
return NextResponse.json({
status: true,
message: message.status.success,
creator: "@Zqwis-Apis",
limit_left: auth.user?.role === "user" ? auth.user.limit : 999999,
data: { mimetype: "image/png", buffer: result.buffer }
}, { status: 200 });
} catch (err) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}