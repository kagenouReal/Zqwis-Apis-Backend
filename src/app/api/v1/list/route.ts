import { NextResponse } from "next/server";
import { apiRegistry } from "@/system/database/myapis";
import { message } from "@/system/lib/responses";
//==================
export async function GET() {
try {
const sortedList = [...apiRegistry].sort((a, b) => a.category.localeCompare(b.category));
return NextResponse.json(sortedList);
} catch (e) {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}