import { NextResponse } from "next/server";
import { message } from "@/system/lib/message";
import { readDB, writeDB, generateApiKey } from "@/system/lib/db";

const userLimit = parseInt(process.env.LIMIT_USER || "10", 10);
const ipLimit = parseInt(process.env.LIMIT_IP_USER || "3", 10);

export async function POST(req: Request) {
try {
const { username, password } = await req.json();
if (!username || !password) {
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const rootOwner = process.env.OWNER_USER || "owner";
if (username.toLowerCase() === rootOwner.toLowerCase() || username.toLowerCase() === "admin") {
return NextResponse.json({ status: false, message: message.auth.forbidden }, { status: 403 });
}
const users = await readDB();
if (users.find((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
return NextResponse.json({ status: false, message: message.user.exists }, { status: 400 });
}
users.push({ 
username, 
password,
role: "user",
apikey: generateApiKey(),
limit: userLimit, 
maxIpQuota: ipLimit, 
whitelistIp: [], 
lastReset: Date.now(),
createdAt: new Date().toISOString() 
});
await writeDB(users);
return NextResponse.json({ status: true, message: message.status.success });
} catch (err) {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
