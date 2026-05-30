import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { readDB, writeDB } from "@/system/lib/db";
import { addCoins, getCoins } from "@/system/lib/premium-coins";
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || (token.role !== "admin" && token.role !== "owner")) return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
  try {
    const username = new URL(req.url).searchParams.get("username");
    if (!username) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
    const res: any = await getCoins(username);
    if (!res.status) return NextResponse.json({ status: false, message: res.error }, { status: 400 });
    return NextResponse.json({ status: true, data: res.coins });
  } catch {
    return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || (token.role !== "admin" && token.role !== "owner")) return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
  try {
    const { username, amount, reason, action } = await req.json();
    if (!username || typeof amount !== "number") return NextResponse.json({ status: false, message: message.input.invalid }, { status: 400 });
    let users = await readDB();
    const idx = users.findIndex((u: any) => u.username === username);
    if (idx === -1) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });
    if (action === "add") {
      const res: any = await addCoins(username, amount, reason || "Admin reward");
      if (!res.status) return NextResponse.json({ status: false, message: res.error }, { status: 400 });
      return NextResponse.json({ status: true, message: message.coins.added, data: res.coins });
    } else if (action === "set") {
      if (!users[idx].coins) users[idx].coins = { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() };
      const old = users[idx].coins.total;
      users[idx].coins.total = amount;
      users[idx].coins.lastUpdated = Date.now();
      if (!users[idx].coinHistory) users[idx].coinHistory = [];
      users[idx].coinHistory.push({ type: "admin_set", amount: amount - old, reason: reason || "Admin set coins", timestamp: Date.now() });
      await writeDB(users);
      return NextResponse.json({ status: true, message: message.coins.set, data: users[idx].coins });
    }
    return NextResponse.json({ status: false, message: message.input.invalid }, { status: 400 });
  } catch {
    return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || (token.role !== "admin" && token.role !== "owner")) return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
  try {
    const username = new URL(req.url).searchParams.get("username");
    if (!username) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
    let users = await readDB();
    const idx = users.findIndex((u: any) => u.username === username);
    if (idx === -1) return NextResponse.json({ status: false, message: message.user.notFound }, { status: 404 });
    users[idx].coins = { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() };
    await writeDB(users);
    return NextResponse.json({ status: true, message: message.coins.reset });
  } catch {
    return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
  }
}
