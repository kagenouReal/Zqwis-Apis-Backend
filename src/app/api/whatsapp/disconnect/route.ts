import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { deleteSession } from "@/system/lib/whatsapp-session";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.name) {
    return NextResponse.json(
      { status: false, message: message.auth.loginRequired },
      { status: 401 }
    );
  }

  try {
    const username = token.name as string;
    deleteSession(username);

    return NextResponse.json({
      status: true,
      message: "WhatsApp session disconnected",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: false, message: err.message || message.api.serverError },
      { status: 500 }
    );
  }
}