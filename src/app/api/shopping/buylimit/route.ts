import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { buyLimit } from "@/system/lib/premium";

//==================
const LIMIT_PACKAGES = {
    "100": parseInt(process.env.LIMIT_100_COINS || "100", 10),
    "500": parseInt(process.env.LIMIT_500_COINS || "450", 10),
    "1000": parseInt(process.env.LIMIT_1000_COINS || "800", 10),
};

//==================
export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });

    try {
        const { packageId } = await req.json();

        if (!packageId || !LIMIT_PACKAGES[packageId as keyof typeof LIMIT_PACKAGES]) {
            return NextResponse.json({ status: false, message: message.input.invalid }, { status: 400 });
        }

        const res: any = await buyLimit(token.name, packageId as any);
        if (!res.status) {
            return NextResponse.json({ status: false, message: res.error || message.status.error }, { status: 400 });
        }

        return NextResponse.json({ 
            status: true, 
            message: message.status.success, 
            data: res 
        });
    } catch {
        return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
    }
}
