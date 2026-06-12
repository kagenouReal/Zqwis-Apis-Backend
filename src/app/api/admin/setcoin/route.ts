import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getUserByUsername, updateUserCoins } from "@/system/lib/account-db";
import { addCoins } from "@/system/lib/premium";

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || (token.role !== "admin" && token.role !== "owner")) {
        return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
    }

    try {
        const { username, amount, action, reason } = await req.json();
        if (!username || typeof amount !== "number") {
            return NextResponse.json({ status: false, message: message.input.invalid }, { status: 400 });
        }

        // Restriction: Cannot change owner's coins
        if (username === process.env.OWNER_USER) {
            return NextResponse.json({ status: false, message: message.auth.forbidden }, { status: 403 });
            }

            const user = getUserByUsername(username);
            if (!user) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });

            if (action === "add") {
            const res: any = await addCoins(username, amount, reason || "Admin reward");
            if (!res.status) return NextResponse.json({ status: false, message: res.error }, { status: 400 });
            return NextResponse.json({ status: true, message: message.coins.added, data: res.coins });
            } else if (action === "set") {
            if (!user.coins) user.coins = { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() };
            const old = user.coins.total;
            user.coins.total = amount;
            user.coins.lastUpdated = Date.now();
            if (!user.coinHistory) user.coinHistory = [];
            user.coinHistory.push({ 
                type: "admin_set", 
                amount: amount - old, 
                reason: reason || "Admin set coins", 
                timestamp: Date.now() 
            });
            updateUserCoins(username, user.coins, user.coinHistory);
            return NextResponse.json({ status: true, message: message.coins.set, data: user.coins });
            }

            return NextResponse.json({ status: false, message: message.input.invalid }, { status: 400 });
            } catch {
            return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
            }
            }
