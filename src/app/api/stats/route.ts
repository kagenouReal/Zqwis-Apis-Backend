import { getStats } from "@/system/lib/request-stats";
//==================
export async function GET() {
return Response.json(getStats());
}