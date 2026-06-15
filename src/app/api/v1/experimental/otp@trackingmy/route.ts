import { NextResponse } from "next/server";
import axios from "axios";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";
//==================
const cooldownMap = new Map<string, number>();
setInterval(() => {
const now = Date.now();
for (const [user, time] of cooldownMap.entries()) {
if (now - time > 3000) {
cooldownMap.delete(user);
}
}
}, 60 * 60 * 1000);
//==================
async function reqTrackingMy(phone: string) {
const url = 'https://appapi.tracking.my/otp';
const headers = {
'Host': 'appapi.tracking.my',
'locale': 'en'
};
const payload = {
identity: phone,
action: "login",
otp_login: true
};
try {
const response = await axios.post(url, payload, { headers });
return { status: true, data: response.data };
} catch (error: any) {
return { status: false, error: error.response?.data || error.message };
}
}
//==================
export async function POST(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
const username = auth.user?.username || "anonymous";
const now = Date.now();
const lastReqTime = cooldownMap.get(username);
if (lastReqTime && (now - lastReqTime < 3000)) {
const timeLeft = ((3000 - (now - lastReqTime)) / 1000).toFixed(1);
addFail(auth.user.username);
return NextResponse.json({
status: false,
message: message.api.rateLimit
}, { status: 429 });
}
cooldownMap.set(username, now);
try {
const body = await req.json().catch(() => ({}));
const { phone } = body;
if (!phone) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const result = await reqTrackingMy(phone);
if (!result || !result.status) {
addFail(auth.user.username);
return NextResponse.json({
status: false,
message: message.scrape.fetchFailed,
errorDetail: result?.error
}, { status: 500 });
}
addSuccess(auth.user.username);
return NextResponse.json({
status: true,
message: message.status.success,
creator: "@Zqwis-Apis",
limit_left: auth.user?.role === "user" ? auth.user.limit : 999999,
data: result.data
}, { status: 200 });
} catch (err) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}