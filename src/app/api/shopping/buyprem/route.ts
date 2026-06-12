import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { buyPremium } from "@/system/lib/premium";

//==================
const PACKAGES = {
    "7day": parseInt(process.env.PREMIUM_7DAY_COINS || "500", 10),
    "30day": parseInt(process.env.PREMIUM_30DAY_COINS || "1500", 10),
    "permanent": parseInt(process.env.PREMIUM_PERMANENT_COINS || "5000", 10),
};

//==================
export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });

    try {
        const { packageId } = await req.json();

        if (!packageId || !PACKAGES[packageId as keyof typeof PACKAGES]) {
            return NextResponse.json({ status: false, message: message.input.invalid }, { status: 400 });
        }

        const res: any = await buyPremium(token.name, packageId);
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
