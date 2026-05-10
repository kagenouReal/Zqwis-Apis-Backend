import { NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import { addSuccess, addFail } from "@/system/lib/store";
import { checkApikey } from "@/system/lib/apiguard";

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
addFail();
return NextResponse.json({ status: false, message: "No image file provided in form-data 'image'" }, { status: 400 });
}
const arrayBuffer = await file.arrayBuffer();
buffer = Buffer.from(arrayBuffer);
} 
else if (contentType.includes("application/json")) {
const body = await req.json().catch(() => ({}));
if (body.url) {
const imgRes = await fetch(body.url);
if (!imgRes.ok) {
addFail();
return NextResponse.json({ status: false, message: "Failed to fetch image from URL." }, { status: 400 });
}
buffer = Buffer.from(await imgRes.arrayBuffer());
} else if (body.base64) {
buffer = Buffer.from(body.base64, "base64");
} else {
addFail();
return NextResponse.json({ status: false, message: "Provide 'url', 'base64', or send via multipart/form-data" }, { status: 400 });
}
} else {
addFail();
return NextResponse.json({ status: false, message: "Unsupported content-type. Use application/json or multipart/form-data" }, { status: 400 });
}
if (!buffer) {
addFail();
return NextResponse.json({ status: false, message: "Failed to process image buffer" }, { status: 500 });
}
const result = await removeBg(buffer);
addSuccess();
return NextResponse.json({
status: true,
creator: "@Zqwis-Apis",
limit_left: auth.user?.role === "user" ? auth.user.limit : "UNLIMITED",
data: result
}, { status: 200 });
} catch (err: any) {
addFail();
console.error("REMOVE BG ERROR:", err?.response?.data || err.message);
return NextResponse.json({ 
status: false, 
message: "Internal Server Error or MagicStudio API failed." 
}, { status: 500 });
}
}
