// ./src/app/api/v1/coins/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { getCoins, addCoins } from "@/system/lib/premium-coins";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token?.name) {
    return NextResponse.json(
      { status: false, message: message.auth.loginRequired },
      { status: 401 }
    );
  }

  try {
    const result = await getCoins(token.name as string);
    
    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      data: result.coins,
    });
  } catch (err) {
    return NextResponse.json(
      { status: false, message: message.api.serverError },
      { status: 500 }
    );
  }
}

// Hanya untuk admin/owner add coins ke user
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role as string;

  if (!token || (role !== "admin" && role !== "owner")) {
    return NextResponse.json(
      { status: false, message: message.auth.denied },
      { status: 403 }
    );
  }

  try {
    const { username, amount, reason } = await req.json();

    if (!username || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { status: false, message: message.input.invalid },
        { status: 400 }
      );
    }

    const result = await addCoins(username, amount, reason || "Admin reward");

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Coins added successfully",
      data: result.coins,
    });
  } catch (err) {
    return NextResponse.json(
      { status: false, message: message.api.serverError },
      { status: 500 }
    );
  }
}
