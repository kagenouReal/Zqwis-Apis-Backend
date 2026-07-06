import { NextResponse } from "next/server";
import { getSettings } from "@/system/lib/owner";

export async function GET() {
    const settings = getSettings();
    return NextResponse.json({ 
        status: true, 
        data: { 
            broadcast: settings.broadcast || "",
            maintenance: settings.maintenance || false
        } 
    });
}
