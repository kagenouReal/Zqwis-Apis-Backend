import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getAvailableMissions } from "@/system/database/missions";
import { getUserByUsername } from "@/system/lib/account-db";

export async function GET(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
try {
const user = getUserByUsername(token.name);
if (!user) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });

const available = getAvailableMissions(user);
const completed = user.missions?.completed || [];
const activity = user.activity || { lastLogin: null, loginStreak: 0, totalLogins: 0, apiCalls: 0, dailyApiCalls: 0, gamePlayed: 0, gameWins: 0 };
const lastClaimedDaily = user.missions?.lastClaimedDaily || 0;

const data: any = JSON.parse(JSON.stringify(available));
const nowDate = new Date().toDateString();
const lastDate = new Date(lastClaimedDaily).toDateString();
const isNewDay = lastDate !== nowDate;

for (const cat of Object.keys(data)) {
    for (const m of data[cat]) {
        const isDaily = m.id.startsWith("daily_");
        m.isCompleted = isDaily ? (!isNewDay && completed.includes(m.id)) : completed.includes(m.id);
        m.canClaim = false;
        
        if (!m.isCompleted) {
            if (m.id === "daily_limit") m.canClaim = true;
            else if (m.id === "daily_login") m.canClaim = activity.totalLogins > 0;
            else if (m.id === "daily_api_call_10") m.canClaim = (activity.dailyApiCalls || 0) >= 10;
            else if (m.id === "weekly_login_7") m.canClaim = (activity.loginStreak || 0) >= 7;
            else if (m.id === "game_play_1") m.canClaim = (activity.gamePlayed || 0) >= 1;
            else if (m.id === "game_win_3") m.canClaim = (activity.gameWins || 0) >= 3;
            else if (m.id.startsWith("follow_")) m.canClaim = true;
            else if (m.id === "first_premium") m.canClaim = !!user.premiumStatus?.isPremium;
        }
    }
}
return NextResponse.json({ status: true, data });
} catch {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
