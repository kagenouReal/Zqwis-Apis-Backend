import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { getMissions, completeMission } from "@/system/lib/premium-coins";
const AVAILABLE = {
  daily: [{ id: "daily_login", name: "Login Harian", reward: 10 }, { id: "api_call_10", name: "API 10x", reward: 50 }],
  weekly: [{ id: "weekly_login_5", name: "Konsisten 5 Hari", reward: 200 }]
};
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
  try {
    const action = new URL(req.url).searchParams.get("action");
    if (action === "list") return NextResponse.json({ status: true, data: AVAILABLE });
    const res: any = await getMissions(token.name);
    if (!res.status) return NextResponse.json({ status: false, message: res.error }, { status: 400 });
    return NextResponse.json({ status: true, data: res.missions });
  } catch {
    return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
  try {
    const { missionId } = await req.json();
    if (!missionId) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
    let mDetails: any = null;
    for (const c of Object.values(AVAILABLE)) {
      mDetails = (c as any[]).find(m => m.id === missionId);
      if (mDetails) break;
    }
    if (!mDetails) return NextResponse.json({ status: false, message: message.mission.notFound }, { status: 404 });
    const res: any = await completeMission(token.name, missionId, mDetails.reward);
    if (!res.status) return NextResponse.json({ status: false, message: res.error }, { status: 400 });
    return NextResponse.json({ status: true, message: message.mission.completed, data: { missionId, reward: res.reward } });
  } catch {
    return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
  }
}
