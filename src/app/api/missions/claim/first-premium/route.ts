import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { completeMission, getAvailableMissions } from "@/system/database/missions";
import { getUserByUsername } from "@/system/lib/account-db";

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
try {
const user = getUserByUsername(token.name);
if (!user) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });
const mId = "first_premium";
const available = getAvailableMissions(user);
let mDetails: any = null;
for (const c of Object.values(available)) {
mDetails = (c as any[]).find((m: any) => m.id === mId);
if (mDetails) break;
}
if (!mDetails) return NextResponse.json({ status: false, message: message.mission.notFound }, { status: 404 });
const res: any = await completeMission(token.name, mId, mDetails.reward, "coins");
if (!res.status) return NextResponse.json({ status: false, message: res.error }, { status: 400 });
return NextResponse.json({ status: true, message: message.mission.completed, data: { missionId: mId, reward: mDetails.reward, rewardType: "coins" } });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}