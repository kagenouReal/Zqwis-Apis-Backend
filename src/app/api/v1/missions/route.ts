// ./src/app/api/v1/missions/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { getMissions, completeMission, checkMission } from "@/system/lib/premium-coins";

const AVAILABLE_MISSIONS = {
  daily: [
    {
      id: "daily_login",
      name: "Login Harian",
      description: "Login ke sistem",
      reward: 10,
      type: "auto",
    },
    {
      id: "api_call_10",
      name: "API 10x",
      description: "Gunakan API 10 kali",
      reward: 50,
      type: "tracking",
      target: 10,
    },
    {
      id: "api_call_50",
      name: "API 50x",
      description: "Gunakan API 50 kali",
      reward: 100,
      type: "tracking",
      target: 50,
    },
  ],
  weekly: [
    {
      id: "weekly_login_5",
      name: "Konsisten 5 Hari",
      description: "Login 5 hari berturut-turut",
      reward: 200,
      type: "streak",
      target: 5,
    },
  ],
};

// GET user missions
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token?.name) {
    return NextResponse.json(
      { status: false, message: message.auth.loginRequired },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "list") {
      // List all available missions
      return NextResponse.json({
        status: true,
        data: {
          daily: AVAILABLE_MISSIONS.daily,
          weekly: AVAILABLE_MISSIONS.weekly,
        },
      });
    }

    // Get user's mission progress
    const result = await getMissions(token.name as string);

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.error },
        { status: 400 }
      );
    }

    // Enrich with mission details
    const enrichedMissions = {
      completed: result.missions.completed,
      available: [],
    };

    // Add available missions
    AVAILABLE_MISSIONS.daily.forEach((mission) => {
      if (!result.missions.completed.includes(mission.id)) {
        enrichedMissions.available.push(mission);
      }
    });

    return NextResponse.json({
      status: true,
      data: enrichedMissions,
    });
  } catch (err) {
    return NextResponse.json(
      { status: false, message: message.api.serverError },
      { status: 500 }
    );
  }
}

// POST complete mission
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.name) {
    return NextResponse.json(
      { status: false, message: message.auth.loginRequired },
      { status: 401 }
    );
  }

  try {
    const { missionId } = await req.json();

    if (!missionId) {
      return NextResponse.json(
        { status: false, message: message.input.missing },
        { status: 400 }
      );
    }

    // Find mission details
    let missionDetails: any = null;
    for (const category of Object.values(AVAILABLE_MISSIONS)) {
      const found = (category as any[]).find((m) => m.id === missionId);
      if (found) {
        missionDetails = found;
        break;
      }
    }

    if (!missionDetails) {
      return NextResponse.json(
        { status: false, message: "Mission not found" },
        { status: 404 }
      );
    }

    const result = await completeMission(
      token.name as string,
      missionId,
      missionDetails.reward
    );

    if (!result.status) {
      return NextResponse.json(
        { status: false, message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Mission completed successfully",
      data: {
        missionId,
        reward: result.reward,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { status: false, message: message.api.serverError },
      { status: 500 }
    );
  }
}
