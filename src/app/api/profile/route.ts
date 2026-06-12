// ./src/app/api/profile/route.ts - UPDATED VERSION
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getUserByUsername, generateApiKey, hashPassword, updateUserAccount, updateUserWhitelist, resetUserLimit } from "@/system/lib/account-db";
import { getPremiumStatus } from "@/system/lib/premium";
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

    if (AUTO_RESET_LIMIT) {
        const now = Date.now();
        if (!user.lastReset || (now - user.lastReset > LIMIT_RESET_TIME)) {
            const defaultLimit = user.role === "admin" ? LIMIT_ADMIN : LIMIT_USER;
            if (user.limit < defaultLimit) {
                user.limit = defaultLimit;
                user.lastReset = now;
                resetUserLimit(user.username, defaultLimit, now);
            }
        }
    }

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
//==================
export async function PUT(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });

    try {
        const body = await req.json();
        const { action, payload } = body;
        const rootOwner = process.env.OWNER_USER || "owner";
        if (token.name === rootOwner) return NextResponse.json({ status: false, message: message.auth.forbidden }, { status: 403 });

        const user = getUserByUsername(token.name);
        if (!user) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });

        if (action === "change_password") {
            if (!payload?.newPassword) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
            const hashedPassword = await hashPassword(payload.newPassword);
            updateUserAccount(user.username, { password: hashedPassword });
            return NextResponse.json({ status: true, message: message.status.success });
        }

        if (action === "change_username") {
            const newUsername = payload?.newUsername;
            if (!newUsername) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
            if (getUserByUsername(newUsername)) return NextResponse.json({ status: false, message: message.user.exists }, { status: 400 });
            updateUserAccount(user.username, { username: newUsername });
            return NextResponse.json({ status: true, message: message.status.success });
        }

        if (action === "reset_apikey") {
            const newApikey = generateApiKey();
            updateUserAccount(user.username, { apikey: newApikey });
            return NextResponse.json({ status: true, message: message.status.success, apikey: newApikey });
        }

        if (action === "add_ip") {
            const newIp = payload?.ip;
            if (!newIp) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
            if (user.whitelistIp.includes(newIp)) return NextResponse.json({ status: false, message: message.ip.exists }, { status: 400 });

            const customQuota = user.maxIpQuota;
            const defaultQuota = user.role === "admin" ? LIMIT_IP_ADMIN : LIMIT_IP_USER;
            const finalQuota = (typeof customQuota === "number") ? customQuota : defaultQuota;

            if (user.whitelistIp.length >= finalQuota) return NextResponse.json({ status: false, message: message.ip.quotaFull }, { status: 400 });

            user.whitelistIp.push(newIp);
            updateUserWhitelist(user.username, user.whitelistIp);
            return NextResponse.json({ status: true, message: message.status.success, whitelistIp: user.whitelistIp });
        }

        if (action === "delete_ip") {
            const delIp = payload?.ip;
            if (!delIp) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
            const updatedWhitelist = user.whitelistIp.filter((ip: string) => ip !== delIp);
            updateUserWhitelist(user.username, updatedWhitelist);
            return NextResponse.json({ status: true, message: message.status.success, whitelistIp: updatedWhitelist });
        }

        return NextResponse.json({ status: false, message: message.input.wrong }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
    }
}