import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { getSession } from "@/system/lib/whatsapp-session";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.name) {
    return NextResponse.json(
      { status: false, message: message.auth.loginRequired },
      { status: 401 }
    );
  }

  try {
    const username = token.name as string;
    const session = getSession(username);

    if (!session) {
      return NextResponse.json({
        status: true,
        connected: false,
        message: "No active session",
      });
    }

    return NextResponse.json({
      status: true,
      connected: session.connected,
      phoneNumber: session.phoneNumber,
      connectedAt: session.connectedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: false, message: err.message || message.api.serverError },
      { status: 500 }
    );
  }
}