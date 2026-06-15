import { NextResponse } from "next/server";
import axios from "axios";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";
//==================
export const dynamic = 'force-dynamic';
//==================
async function stalkPinterest(username: string) {
try {
const { data: html } = await axios.get(
`https://www.pinterest.com/${username}/`,
{
headers: { "user-agent": "Zqwis/9.9.9" }
}
);
const match = html.match(/<script id="__PWS_INITIAL_PROPS__" type="application\/json">(.*?)<\/script>/);
if (!match) return { status: false };
const json = JSON.parse(match[1]);
const users = json.initialReduxState?.users;
if (!users) return { status: false };
const userKey = Object.keys(users).find(k => k && users[k].username === username);
if (!userKey) return { status: false };
const profile = users[userKey];
const pinsObj = json.initialReduxState?.pins || {};
const pins = Object.values(pinsObj).map((pin: any) => ({
id: pin.id,
title: pin.seo_title,
created_at: pin.created_at,
image: pin.images?.["736x"]?.url || null,
dominant_color: pin.dominant_color
}));
return {
status: true,
data: {
profile: {
id: profile.id,
username: profile.username,
full_name: profile.full_name,
followers: profile.follower_count,
following: profile.following_count,
pins: profile.pin_count,
image: profile.image_xlarge_url
},
total_pins: pins.length,
pins
}
};
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
const username = searchParams.get("username");
if (!username) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const result = await stalkPinterest(username);
if (!result || !result.status || !result.data) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });
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