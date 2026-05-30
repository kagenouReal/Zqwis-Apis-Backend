import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/message";
import { buyPremium, getPremiumStatus } from "@/system/lib/premium-coins";
const PACKAGES = { "7day": 500, "30day": 1500, permanent: 5000 };
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
  try {
    const res: any = await getPremiumStatus(token.name);
    if (!res.status) return NextResponse.json({ status: false, message: res.error || message.status.error }, { status: 400 });
    return NextResponse.json({ status: true, data: res });
  } catch {
    return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.name) return NextResponse.json({ status: false, message: message.auth.loginRequired }, { status: 401 });
  try {
    const { packageType } = await req.json();
    if (!packageType || !PACKAGES[packageType as keyof typeof PACKAGES]) return NextResponse.json({ status: false, message: message.input.invalid }, { status: 400 });
    const res: any = await buyPremium(token.name, packageType);
    if (!res.status) return NextResponse.json({ status: false, message: res.error || message.status.error }, { status: 400 });
    return NextResponse.json({ status: true, message: message.status.success, data: res });
  } catch {
    return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
  }
}
