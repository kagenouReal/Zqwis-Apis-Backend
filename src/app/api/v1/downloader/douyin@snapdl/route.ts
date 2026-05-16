import { NextResponse } from "next/server";
import axios from "axios";
import { addSuccess, addFail } from "@/system/lib/store";
import { checkApikey } from "@/system/lib/apiguard";
import { message } from "@/system/lib/message";

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

export async function GET(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
try {
const { searchParams } = new URL(req.url);
const url = searchParams.get("url");

if (!url) {
addFail();
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}

const result = await douyin(url);
if (!result || !result.status || !result.data) {
addFail();
return NextResponse.json({ status: false, message: message.scrape.fetchFailed }, { status: 500 });
}

addSuccess();
return NextResponse.json({
status: true,
message: message.status.success,
creator: "@Zqwis-Apis",
limit_left: auth.user?.role === "user" ? auth.user.limit : "UNLIMITED",
data: result.data
}, { status: 200 });
} catch (err) {
addFail();
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
