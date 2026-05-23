// ./src/app/api/admin/coins/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { readDB, writeDB } from "@/system/lib/db";
import { addCoins, getCoins } from "@/system/lib/premium-coins";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role as string;

  if (!token || (role !== "admin" && role !== "owner")) {
    return NextResponse.json(
      { status: false, message: message.auth.denied },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { status: false, message: message.input.missing },
        { status: 400 }
      );
    }

    const result = await getCoins(username);

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      data: result.coins,
    });
  } catch (err) {
    return NextResponse.json(
      { status: false, message: message.api.serverError },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role as string;

  if (!token || (role !== "admin" && role !== "owner")) {
    return NextResponse.json(
      { status: false, message: message.auth.denied },
      { status: 403 }
    );
  }

  try {
    const { username, amount, reason, action } = await req.json();

    if (!username || typeof amount !== "number") {
      return NextResponse.json(
        { status: false, message: message.input.invalid },
        { status: 400 }
      );
    }

    let users = await readDB();
    const userIndex = users.findIndex((u: any) => u.username === username);

    if (userIndex === -1) {
      return NextResponse.json(
        { status: false, message: message.user.notFound },
        { status: 404 }
      );
    }

    if (action === "add") {
      const result = await addCoins(username, amount, reason || "Admin reward");

      if (!result.status) {
        return NextResponse.json(
          { status: false, message: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        status: true,
        message: "Coins added successfully",
        data: result.coins,
      });
    } else if (action === "set") {
      // Set coins to specific amount
      if (!users[userIndex].coins) {
        users[userIndex].coins = { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() };
      }

      const oldAmount = users[userIndex].coins.total;
      users[userIndex].coins.total = amount;
      users[userIndex].coins.lastUpdated = Date.now();

      if (!users[userIndex].coinHistory) users[userIndex].coinHistory = [];
      users[userIndex].coinHistory.push({
        type: "admin_set",
        amount: amount - oldAmount,
        reason: reason || "Admin set coins",
        timestamp: Date.now(),
      });

      await writeDB(users);

      return NextResponse.json({
        status: true,
        message: "Coins set successfully",
        data: users[userIndex].coins,
      });
    }

    return NextResponse.json(
      { status: false, message: message.input.invalid },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { status: false, message: message.api.serverError },
      { status: 500 }
    );
  }
}

// DELETE: Reset coins
export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role as string;

  if (!token || (role !== "admin" && role !== "owner")) {
    return NextResponse.json(
      { status: false, message: message.auth.denied },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { status: false, message: message.input.missing },
        { status: 400 }
      );
    }

    let users = await readDB();
    const userIndex = users.findIndex((u: any) => u.username === username);

    if (userIndex === -1) {
      return NextResponse.json(
        { status: false, message: message.user.notFound },
        { status: 404 }
      );
    }

    users[userIndex].coins = {
      total: 0,
      earned: 0,
      spent: 0,
      lastUpdated: Date.now(),
    };

    await writeDB(users);

    return NextResponse.json({
      status: true,
      message: "Coins reset successfully",
    });
  } catch (err) {
    return NextResponse.json(
      { status: false, message: message.api.serverError },
      { status: 500 }
    );
  }
}
