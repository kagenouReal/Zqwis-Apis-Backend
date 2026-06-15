import { NextResponse } from "next/server";
import axios from "axios";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";
//==================
async function douyin(url: string) {
try {
const res = await axios.post(
"http://159.65.140.205/get-link-douyin",
{
name: "",
url: url.trim()
}
);
if (!res.data) return { status: false };
return { status: true, data: res.data };
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
const url = searchParams.get("url");
if (!url) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const result = await douyin(url);
if (!result || !result.status || !result.data) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.scrape.fetchFailed }, { status: 500 });
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