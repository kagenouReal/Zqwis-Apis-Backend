import { getStats } from "@/system/lib/request-stats";
import { getSettings } from "@/system/lib/owner";
//==================
export async function GET() {
const stats = getStats();
const settings = getSettings();
return Response.json({ ...stats, broadcast: settings.broadcast });
}