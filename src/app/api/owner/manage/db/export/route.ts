import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import fs from "fs-extra";
import path from "path";

export async function GET(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (token?.role !== "owner") return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
try {
const dbPath = path.join(process.cwd(), "src/system/database/database.db");
if (!fs.existsSync(dbPath)) return NextResponse.json({ status: false, message: "DB not found" }, { status: 404 });
const buffer = await fs.readFile(dbPath);
return new NextResponse(buffer, {
    headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": 'attachment; filename="database.db"',
    }
});
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}