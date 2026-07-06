import { NextResponse } from "next/server";
import { PREMIUM_PACKAGES, LIMIT_PACKAGES } from "@/system/database/products";

export async function GET() {
    return NextResponse.json({
        status: true,
        data: {
            premium: PREMIUM_PACKAGES,
            limit: LIMIT_PACKAGES
        }
    });
}
