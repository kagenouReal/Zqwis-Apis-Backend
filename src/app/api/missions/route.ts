import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getMissions, completeMission } from "@/system/lib/premium";
import { getUserByUsername } from "@/system/lib/account-db";
//==================
const AVAILABLE = {
daily: [
    { id: "daily_login", name: "Daily Login", reward: 10 }, 
    { id: "api_call_10", name: "Use API v1 (10x)", reward: 50 }
],
weekly: [
    { id: "weekly_login_7", name: "7 Days Streak", reward: 200 }
],
game: [
    { id: "game_play_1", name: "Play 1 Game", reward: 20 },
    { id: "game_win_3", name: "Win 3 Matches", reward: 100 }
],
social: [
    { id: "follow_github", name: "Follow GitHub Kagenou", reward: 50, url: "https://github.com/kagenouReal" },
    { id: "follow_tiktok", name: "Follow TikTok Kagenou", reward: 50, url: "https://www.tiktok.com/@veryy_lazyy" }
],
achievement: [
    { id: "first_premium", name: "First Premium", reward: 500 }
]
};
//==================
export async function GET(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
try {
const action = new URL(req.url).searchParams.get("action");
const user = getUserByUsername(token.name);
if (!user) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });

const completed = user.missions?.completed || [];
const activity = user.activity || { lastLogin: null, loginStreak: 0, totalLogins: 0, apiCalls: 0, dailyApiCalls: 0, gamePlayed: 0, gameWins: 0 };

if (action === "list") {
    const data: any = JSON.parse(JSON.stringify(AVAILABLE));
    for (const cat of Object.keys(data)) {
        for (const m of data[cat]) {
            m.isCompleted = completed.includes(m.id);
            m.canClaim = false;
            
            if (!m.isCompleted) {
                if (m.id === "daily_login") {
                    m.canClaim = activity.totalLogins > 0;
                } else if (m.id === "api_call_10") {
                    m.canClaim = (activity.dailyApiCalls || 0) >= 10;
                } else if (m.id === "weekly_login_7") {
                    m.canClaim = (activity.loginStreak || 0) >= 7;
                } else if (m.id === "game_play_1") {
                    m.canClaim = (activity.gamePlayed || 0) >= 1;
                } else if (m.id === "game_win_3") {
                    m.canClaim = (activity.gameWins || 0) >= 3;
                } else if (m.id.startsWith("follow_")) {
                    m.canClaim = true;
                } else if (m.id === "first_premium") {
                    m.canClaim = !!user.premiumStatus?.isPremium;
                }
            }
        }
    }
    return NextResponse.json({ status: true, data });
}

return NextResponse.json({ status: true, data: user.missions || { completed: [] } });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
//==================
export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
try {
const body = await req.json();
const missionId = body.missionId || body.id;

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