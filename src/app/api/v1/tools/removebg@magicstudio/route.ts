import { NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";
//==================
async function removeBg(buffer: Buffer) {
const base64 = buffer.toString("base64");
const form = new FormData();
form.append("image", `data:image/png;base64,${base64}`);
const res = await axios.post(
"https://ai-api.magicstudio.com/api/remove-background",
form,
{
headers: {
...form.getHeaders(),
Origin: "https://magicstudio.com",
Referer: "https://magicstudio.com/remove-background/",
},
}
);
return res.data;
}
//==================
export async function POST(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
try {
const contentType = req.headers.get("content-type") || "";
let buffer: Buffer | null = null;
if (contentType.includes("multipart/form-data")) {
const formData = await req.formData();
const file = formData.get("image") as File;
if (!file) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.file.missing }, { status: 400 });
}
const arrayBuffer = await file.arrayBuffer();
buffer = Buffer.from(arrayBuffer);
}
else if (contentType.includes("application/json")) {
const body = await req.json().catch(() => ({}));
if (body.url) {
const imgRes = await fetch(body.url);
if (!imgRes.ok) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.api.fetchFailed }, { status: 400 });
}
buffer = Buffer.from(await imgRes.arrayBuffer());
} else if (body.base64) {
buffer = Buffer.from(body.base64, "base64");
} else {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
} else {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.input.invalidFormat }, { status: 400 });
}
if (!buffer) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.file.invalid }, { status: 500 });
}
const result = await removeBg(buffer);
addSuccess(auth.user.username);
return NextResponse.json({
status: true,
message: message.status.success,
creator: "@Zqwis-Apis",
limit_left: auth.user?.role === "user" ? auth.user.limit : 999999,
data: result
}, { status: 200 });
} catch (err: any) {
addFail(auth.user.username);
return NextResponse.json({
status: false,
message: message.api.serverError
}, { status: 500 });
}
}