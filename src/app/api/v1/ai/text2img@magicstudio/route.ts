import { NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import { addSuccess, addFail } from "@/system/lib/store";
import { checkApikey } from "@/system/lib/apiguard";
import { message } from "@/system/lib/message";

async function aiIMGGenerator(prompt: string) {
try {
const form = new FormData();
form.append('prompt', prompt);
const response = await axios.post('https://ai-api.magicstudio.com/api/ai-art-generator', form, {
headers: {
...form.getHeaders(),
'Accept': 'application/json',
'Origin': 'https://magicstudio.com',
'Referer': 'https://magicstudio.com/ai-art-generator/',
'User-Agent': 'Mozilla/5.0'
},
responseType: 'arraybuffer'
});
return { status: true, buffer: Buffer.from(response.data) };
} catch (err: any) {
return { status: false, error: err.message };
}
}

export async function GET(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
try {
const { searchParams } = new URL(req.url);
const prompt = searchParams.get("prompt");
if (!prompt) {
addFail();
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const result = await aiIMGGenerator(prompt);
if (!result.status || !result.buffer) {
addFail();
return NextResponse.json({ status: false, message: message.scrape.fetchFailed }, { status: 500 });
}
addSuccess();
return NextResponse.json({
status: true,
message: message.status.success,
creator: "@Zqwis-Apis",
limit_left: auth.user?.role === "user" ? auth.user.limit : "UNLIMITED",
data: {
mimetype: "image/png",
buffer: result.buffer.toString("base64")
}
}, { status: 200 });
} catch (err) {
addFail();
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
