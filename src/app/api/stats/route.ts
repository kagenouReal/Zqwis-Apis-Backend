import { getStats } from "@/system/lib/store";
export async function GET() {
return Response.json(getStats());
}