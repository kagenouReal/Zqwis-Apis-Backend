import { NextResponse } from "next/server";
import axios from "axios";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";
//==================
async function pinsearchapi(query: string, pageSize: number = 10) {
try {
function shuffleArray(arr: any[]) {
return [...arr].sort(() => Math.random() - 0.5);
}
const res = await axios.get(
"https://api.pinterest.com/v3/search/pins/",
{
params: {
query,
page_size: pageSize
},
headers: {
"Authorization": "Bearer pina_AEATFWAVAB7AKBIAGDAHKDYIIT6RHHQBABHO3RF6KIWJPWLV5VH3CNPXO6KFGKHCZL4L2YCO5BH4LDNPLW5ZE7QUWMLAVKAA",
"User-Agent": "Pinterest/14.17.2",
"Accept-Language": "en-GB"
}
}
);
const pins = res.data?.data || [];
let results = pins
.map((p: any) => ({
id: p.id,
description: p.description?.trim() || null,
image: {
large: p.image_large_url || null,
medium: p.image_medium_url || null,
thumb: p.image_square_url || null
},
stats: {
repin: p.repin_count || 0,
comment: p.comment_count || 0
},
type: {
repin: p.is_repin || false,
uploaded: p.is_uploaded || false
},
source: `https://www.pinterest.com/pin/${p.id}`,
created: p.created_at || null
}))
.filter((v: any) => v.image.large);
results = shuffleArray(results);
return {
status: true,
data: {
query,
total: results.length,
results
}
};
} catch (err) {
return { status: false };
}
}
//==================
export async function GET(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
try {
const { searchParams } = new URL(req.url);
const query = searchParams.get("query");
const limit = parseInt(searchParams.get("limit") || "10", 10);
if (!query) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const result = await pinsearchapi(query, limit);
if (!result || !result.status || !result.data || result.data.results.length === 0) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.scrape.noResult }, { status: 404 });
}
addSuccess(auth.user.username);
return NextResponse.json({
status: true,
message: message.status.success,
creator: "@Zqwis-Apis",
limit_left: auth.user?.role === "user" ? auth.user.limit : 999999,
data: result.data
}, { status: 200 });
} catch (err) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}