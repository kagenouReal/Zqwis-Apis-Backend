// ./src/app/api/profile/route.ts - UPDATED VERSION
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getUserByUsername, generateApiKey, hashPassword, updateUserAccount, updateUserWhitelist, resetUserLimit } from "@/system/lib/account-db";
import { getPremiumStatus } from "@/system/database/products";
//==================
const LIMIT_USER = parseInt(process.env.LIMIT_USER || "10", 10);
//==================
const LIMIT_ADMIN = parseInt(process.env.LIMIT_ADMIN || "1000", 10);
//==================
const LIMIT_RESET_TIME = parseInt(process.env.LIMIT_RESET_TIME || "3600000", 10);
//==================
const AUTO_RESET_LIMIT = process.env.AUTO_RESET_LIMIT === "true";
//==================
const LIMIT_IP_USER = parseInt(process.env.LIMIT_IP_USER || "3", 10);
//==================
const LIMIT_IP_ADMIN = parseInt(process.env.LIMIT_IP_ADMIN || "10", 10);
//==================
export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });

    const rootOwner = process.env.OWNER_USER || "owner";
    if (token.name === rootOwner) {
        return NextResponse.json({
            status: true,
            data: {
                username: rootOwner,
                role: "owner",
                apikey: process.env.OWNER_APIKEY || "Notdefined",
                limit: 999999,
                whitelistIp: [],
                isRoot: true,
                premium: { isPremium: true, type: "permanent", daysLeft: null, expiry: null },
                coins: { total: 999999, earned: 999999, spent: 0 },
                missions: { completed: ["all"] },
                createdAt: new Date(0).toISOString(),
            }
        });
    }

    const user = getUserByUsername(token.name);
    if (!user) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });

    const premiumResult = await getPremiumStatus(user.username);
    return NextResponse.json({
        status: true,
        data: {
            username: user.username,
            role: user.role,
            apikey: user.apikey,
            limit: user.limit,
            whitelistIp: user.whitelistIp || [],
            isRoot: false,
            premium: premiumResult.status ? {
                isPremium: premiumResult.isPremium,
                type: premiumResult.type,
                daysLeft: premiumResult.daysLeft,
                expiry: premiumResult.expiry,
            } : { isPremium: false, type: null, daysLeft: 0, expiry: null },
            coins: user.coins || { total: 0, earned: 0, spent: 0 },
            coinHistory: user.coinHistory || [],
            missions: user.missions || { completed: [] },
            createdAt: user.createdAt,
            activity: user.activity || {},
        }
    });
}