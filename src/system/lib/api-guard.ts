import { NextResponse, NextRequest } from "next/server";
import { getUserByApiKey, getUserByUsername, updateUserLimit, updateUserActivity } from "@/system/lib/account-db";
import { message } from "@/system/lib/responses";
import { getSettings } from "@/system/lib/owner";
//==================
const systemIps = ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"];
//==================
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
//==================
const apiRateConfig = (process.env.API_MAX_REQUESTS || "").split(",");
//==================
const MAX_REQUESTS = parseInt(apiRateConfig[0], 10) || 10;
//==================
const WINDOW_MS = parseInt(apiRateConfig[1], 10) || 2000;
//==================
const LIMIT_USER = parseInt(process.env.LIMIT_USER || "", 10) || 10;
//==================
const LIMIT_PREMIUM = parseInt(process.env.LIMIT_PREMIUM || "", 10) || 100;
//==================
const LIMIT_ADMIN = parseInt(process.env.LIMIT_ADMIN || "", 10) || 1000;
//==================
function checkRateLimit(ip: string) {
    const now = Date.now();
    if (rateLimitMap.size > 10000) {
        for (const [key, value] of rateLimitMap.entries()) {
            if (now > value.resetTime) rateLimitMap.delete(key);
            if (rateLimitMap.size <= 5000) break;
        }
    }
    const record = rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        return true;
    }
    if (record.count >= MAX_REQUESTS) return false;
    record.count += 1;
    rateLimitMap.set(ip, record);
    return true;
}
//==================
export async function checkApikey(req: Request) {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : (req.headers.get("x-real-ip") || "Unknown IP");
    
    // Check maintenance mode
    const settings = getSettings();
    if (settings.maintenance) {
        return { status: false, response: NextResponse.json({ status: false, message: message.system.maintenance }, { status: 503 }) };
    }

    if (!checkRateLimit(clientIp)) {
        return { status: false, response: NextResponse.json({ status: false, message: message.api.rateLimit }, { status: 429 }) };
    }

    const nextUrl = (req as NextRequest).nextUrl;
    const path = nextUrl.pathname;
    
    // Check API toggles
    if (settings.apiToggles && settings.apiToggles[path] === false) {
        return { status: false, response: NextResponse.json({ status: false, message: message.api.disabled }, { status: 403 }) };
    }

    const apikey = nextUrl?.searchParams.get("apikey") || new URL(req.url).searchParams.get("apikey") || req.headers.get("apikey") || req.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!apikey) return { status: false, response: NextResponse.json({ status: false, message: message.apikey.required }, { status: 401 }) };
    
    if (process.env.OWNER_APIKEY && apikey === process.env.OWNER_APIKEY) {
        return { status: true, user: { username: "owner", role: "owner", limit: 999999 } };
    }

    const user = getUserByApiKey(apikey);
    if (!user) {
        return { status: false, response: NextResponse.json({ status: false, message: message.apikey.invalid }, { status: 401 }) };
    }

    if (!user.whitelistIp || !Array.isArray(user.whitelistIp) || user.whitelistIp.length === 0) {
        return { status: false, response: NextResponse.json({ status: false, message: message.ip.whitelistRequired }, { status: 403 }) };
    }

    if (!systemIps.includes(clientIp) && !user.whitelistIp.includes(clientIp)) {
        return { status: false, response: NextResponse.json({ status: false, message: message.ip.notWhitelisted }, { status: 403 }) };
    }

    if (user.limit <= 0) {
        return { status: false, response: NextResponse.json({ status: false, message: message.limit.exhausted }, { status: 429 }) };
    }

    user.limit -= 1;
    updateUserLimit(user.username, user.limit);

    // Update activity
    const activity = user.activity || {};
    activity.apiCalls = (activity.apiCalls || 0) + 1;
    activity.dailyApiCalls = (activity.dailyApiCalls || 0) + 1;
    
    updateUserActivity(user.username, activity);
    
    return { status: true, user };
}

//==================
// New helpers to track per-user stats similar to Live Metrics
export function trackUserSuccess(username: string) {
    if (username === "owner") return;
    const user = getUserByUsername(username);
    if (!user) return;
    const activity = user.activity || {};
    activity.totalSuccess = (activity.totalSuccess || 0) + 1;
    updateUserActivity(username, activity);
}

export function trackUserFail(username: string) {
    if (username === "owner") return;
    const user = getUserByUsername(username);
    if (!user) return;
    const activity = user.activity || {};
    activity.totalFailed = (activity.totalFailed || 0) + 1;
    activity.lastCrash = new Date().toISOString();
    updateUserActivity(username, activity);
}