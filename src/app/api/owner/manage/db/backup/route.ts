import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import fs from "fs-extra";
import path from "path";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (token?.role !== "owner") return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
try {
const dbPath = path.join(process.cwd(), "src/system/database/database.db");
const backupPath = path.join(process.cwd(), `src/system/database/backup_${Date.now()}.db`);
await fs.copy(dbPath, backupPath);
return NextResponse.json({ status: true, message: message.system.backupCreated });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}