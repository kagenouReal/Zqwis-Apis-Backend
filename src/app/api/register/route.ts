import { NextResponse } from "next/server";
import { message } from "@/system/lib/responses";
import { getUserByUsername, generateApiKey, hashPassword, writeDB } from "@/system/lib/account-db";
//==================
const userLimit = parseInt(process.env.LIMIT_USER || "10", 10);
//==================
const ipLimit = parseInt(process.env.LIMIT_IP_USER || "3", 10);
//==================
export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();
        if (!username || !password) {
            return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
        }
        
        const rootOwner = process.env.OWNER_USER || "owner";
        if (username.toLowerCase() === rootOwner.toLowerCase() || username.toLowerCase() === "admin") {
            return NextResponse.json({ status: false, message: message.auth.forbidden }, { status: 403 });
        }

        if (getUserByUsername(username)) {
            return NextResponse.json({ status: false, message: message.user.exists }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);
        
        const newUser = {
            username,
            password: hashedPassword,
            role: "user",
            apikey: generateApiKey(),
            limit: userLimit,
            maxIpQuota: ipLimit,
            whitelistIp: [],
            lastReset: Date.now(),
            createdAt: new Date().toISOString(),
            premiumStatus: {
                isPremium: false,
                premiumType: null,
                premiumExpiry: null,
                startDate: null,
            },
            coins: {
                total: 50,
                earned: 50,
                spent: 0,
                lastUpdated: Date.now(),
            },
            coinHistory: [
                {
                    type: "earn",
                    amount: 50,
                    reason: "Welcome bonus",
                    timestamp: Date.now(),
                },
            ],
            missions: {
                completed: [],
                inProgress: [],
            },
            activity: {
                lastLogin: null,
                loginStreak: 0,
                totalLogins: 0,
                apiCalls: 0,
                dailyApiCalls: 0,
            },
        };
        
        // writeDB can take an array, but here we just need to insert one.
        // I'll use writeDB for now but wrap it in an array as it expects data: any[]
        await writeDB([newUser]);
        
        return NextResponse.json({ status: true, message: message.status.success });
    } catch (err) {
        return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
    }
}