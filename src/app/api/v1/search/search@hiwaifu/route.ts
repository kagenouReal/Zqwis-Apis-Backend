import { NextResponse } from "next/server";
import axios from "axios";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";
//==================
export const dynamic = 'force-dynamic';
//==================
async function searchHiWaifu(keyword: string) {
try {
const res = await axios.post('https://api.hiwaifu.com/client/common/robot/search', {
"page": 1,
"keyword": keyword,
"limit": 30,
"sign": "dfcf8c72372841106dec7fda8389e601"
}, {
headers: {
'user-agent': 'Dart/3.10 (dart:io)',
'connection': 'keep-alive',
'phone-brand': 'Xiaomi',
'accept-encoding': 'gzip',
'channel': 'google',
'age': '1',
'device-id': 'BP1A.250505.005',
'content-type': 'application/json',
'phone-platform': 'android',
'app-ver': '3.7.0',
'gaid': '912da4cd-9252-4566-a21b-1e7e083923cc',
'request-id': '57a1c6f549ce94949073072cd49f0d27',
'request-timestamp': '1778915689717',
'lang': 'en',
'host': 'api.hiwaifu.com',
'package': 'com.hiwaifu.app',
'phone-device-width': '411.42857142857144',
'phone-device-height': '890.2857142857143',
'phone-model': '23127PN0CC'
}
});
if (res.data.status === 200) {
const results = res.data.data.data.map((bot: any) => ({
id: bot.robots_id,
name: bot.robot_name,
avatar: bot.avatar || bot.robot_avatar || "",
description: bot.scene || bot.description || bot.intro || "",
greeting: bot.greeting || "",
categories: bot.categories || "",
chat_count: bot.chat_num || 0,
upvotes: bot.upvote_count || 0,
author: bot.username || "Unknown"
}));
return { status: true, data: results };
}
return { status: false };
} catch (err) {
return { status: false };
}
}
//==================
export async function GET(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
try {
const { searchParams } = new URL(req.url);
const keyword = searchParams.get("keyword");
if (!keyword) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const result = await searchHiWaifu(keyword);
if (!result || !result.status || !result.data) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.scrape.noResult }, { status: 404 });
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