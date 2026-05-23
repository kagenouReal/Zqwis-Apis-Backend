// ./src/app/api/v1/premium/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { buyPremium, getPremiumStatus, isPremium } from "@/system/lib/premium-coins";

const PREMIUM_PACKAGES = {
  "7day": {
    name: "Premium 7 Hari",
    coinsRequired: 500,
  },
  "30day": {
    name: "Premium 30 Hari",
    coinsRequired: 1500,
  },
  permanent: {
    name: "Premium Permanen",
    coinsRequired: 5000,
  },
};

// GET premium status
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token?.name) {
    return NextResponse.json(
      { status: false, message: message.auth.loginRequired },
      { status: 401 }
    );
  }

  try {
    const result = await getPremiumStatus(token.name as string);

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: "error" in result ? result.error : "Unknown error" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      data: result,
    });
  } catch (err) {
    return NextResponse.json(
      { status: false, message: message.api.serverError },
      { status: 500 }
    );
  }
}

// POST buy premium
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.name) {
    return NextResponse.json(
      { status: false, message: message.auth.loginRequired },
      { status: 401 }
    );
  }

  try {
    const { packageType } = await req.json();

    if (!packageType || !PREMIUM_PACKAGES[packageType as keyof typeof PREMIUM_PACKAGES]) {
      return NextResponse.json(
        { status: false, message: "Invalid package type" },
        { status: 400 }
      );
    }

    const result = await buyPremium(token.name as string, packageType);

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: "error" in result ? result.error : "Unknown error" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      message: `Premium ${packageType} purchased successfully`,
      data: result,
    });
  } catch (err) {
    return NextResponse.json(
      { status: false, message: message.api.serverError },
      { status: 500 }
    );
  }
}
