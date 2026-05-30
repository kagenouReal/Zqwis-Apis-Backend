import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { exec } from "child_process";
import util from "util";
import { message } from "@/system/lib/message";

const execPromise = util.promisify(exec);

export async function POST(req: NextRequest) {
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!token || token.role !== "owner") {
return NextResponse.json({ status: false, message: message.auth.owner }, { status: 403 });
}
try {
const body = await req.json();
const { command } = body;
if (!command) {
return NextResponse.json({ status: false, message: message.exec.missing }, { status: 400 });
}
try {
const { stdout, stderr } = await execPromise(command);
const output = stdout || stderr || message.exec.success;
return NextResponse.json({ status: true, output });
} catch (execError: any) {
return NextResponse.json({ 
status: false, 
output: execError.stderr || execError.message || message.exec.failed 
}, { status: 500 });
}
} catch (err) {
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
