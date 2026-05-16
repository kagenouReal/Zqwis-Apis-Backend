import { NextResponse } from "next/server";
import axios from "axios";
import { addSuccess, addFail } from "@/system/lib/store";
import { checkApikey } from "@/system/lib/apiguard";
import { message } from "@/system/lib/message";

async function trackingMY(resi: string) {
const headers = {
'X-Api-Key': "761614|sFRrJtLLSBIrNG8CceOGk4x8QP669GxBKt7g79p8",
'Accept': 'application/json'
};
try {
const det = await axios.post(`https://appapi.tracking.my/couriers/detect`, { tracking_number: resi, limit: 1 }, { headers });
if (!det.data?.courier?.handle) return { status: false };
const courier = det.data.courier.handle;
const reg = await axios.post(`https://appapi.tracking.my/trackings`, { tracking_number: resi, courier: courier, title: "Cek Paket" }, { headers });
const trackId = reg.data?.tracking?.id;
if (!trackId) return { status: false };
const res = await axios.get(`https://appapi.tracking.my/trackings/${trackId}`, { headers });
const info = res.data.tracking;
return { status: true, data: info };
} catch (e) {
return { status: false };
}
}

export async function GET(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
try {
const { searchParams } = new URL(req.url);
const resi = searchParams.get("resi");
if (!resi) {
addFail();
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const result = await trackingMY(resi);
if (!result || !result.status || !result.data) {
addFail();
return NextResponse.json({ status: false, message: message.scrape.fetchFailed }, { status: 404 });
}
addSuccess();
return NextResponse.json({
status: true,
message: message.status.success,
creator: "@Zqwis-Apis",
limit_left: auth.user?.role === "user" ? auth.user.limit : "UNLIMITED",
data: result.data
}, { status: 200 });
} catch (err) {
addFail();
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}
