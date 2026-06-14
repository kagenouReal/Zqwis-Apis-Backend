import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getStats } from "@/system/lib/request-stats";
import { message } from "@/system/lib/responses";

//==================
export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    // Cek apakah user sudah login dan apakah rolenya owner
    if (!token || token.role !== "owner") {
        return NextResponse.json({ status: false, message: message.auth.forbidden }, { status: 403 });
    }

    const stats = getStats();
    return NextResponse.json({ status: true, data: stats });
}