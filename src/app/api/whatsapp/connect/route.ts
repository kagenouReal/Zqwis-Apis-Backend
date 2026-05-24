import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { createSession, getSession, getAllSessions, getMaxSessions } from "@/system/lib/whatsapp-session";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.name) {
    return NextResponse.json(
      { status: false, message: message.auth.loginRequired },
      { status: 401 }
    );
  }

  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { status: false, message: "Nomor WhatsApp wajib diisi (contoh: 62812345678)" },
        { status: 400 }
      );
    }

    const username = token.name as string;
    const role = (token.role as string) || "user";

    // 1. Cek Limit Berdasarkan Role / Paket Premium
    const allSessions = getAllSessions();
    const userSessions = allSessions.filter((s) => s.username === username);
    const maxSessions = getMaxSessions(role);

    if (userSessions.length >= maxSessions) {
      return NextResponse.json(
        {
          status: false,
          message: `Kuota sesi bot kamu penuh! Maksimal ${maxSessions} bot untuk role [${role}].`,
        },
        { status: 400 }
      );
    }

    // 2. Cek apakah nomor/user ini sudah terkoneksi sebelumnya
    const existingSession = getSession(username);
    if (existingSession?.connected) {
      return NextResponse.json({
        status: true,
        message: "Bot WhatsApp Anda sudah dalam status terhubung (Connected).",
        session: existingSession,
      });
    }

    // 3. Trigger pembuatan sesi baru dengan skema Pairing Code
    const result = await createSession(username, phoneNumber);

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.error },
        { status: 400 }
      );
    }

    // Return Pairing Code ke client
    return NextResponse.json({
      status: true,
      message: "Sesi berhasil dibuat! Silakan masukkan kode pairing berikut di WhatsApp Anda.",
      pairingCode: result.pairingCode, // Ini isi kodenya, misal: "ABCD-EFGH"
      sessionId: result.sessionId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: false, message: err.message || "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
