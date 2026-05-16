import { NextResponse } from "next/server";
import axios from "axios";
import { addSuccess, addFail } from "@/system/lib/store";
import { checkApikey } from "@/system/lib/apiguard";
import { message } from "@/system/lib/message";

async function scrapePinterest(query: string, limit: number = 5) {
try {
const url = "https://www.pinterest.com/resource/BaseSearchResource/get/";
const results = [];
let bookmark = null;
let maxIter = 0; 

while (results.length < limit && maxIter < 5) {
maxIter++;
const payload: any = {
options: {
query: query,
scope: "pins",
page_size: 50,
bookmarks: bookmark ? [bookmark] : [],
},
context: {},
};
const { data } = await axios.get(url, {
params: {
source_url: `/search/pins/?q=${query}`,
data: JSON.stringify(payload),
},
headers: {
"user-agent": "Mozilla/5.0",
"x-pinterest-pws-handler": "www/search/[scope].js",
},
});
const pins = data.resource_response.data.results;
for (const pin of pins) {
const img =
pin.images?.orig?.url ||
pin.images?.["736x"]?.url ||
pin.images?.["474x"]?.url ||
pin.images?.["236x"]?.url ||
pin.images?.["170x"]?.url;
if (!img) continue;
results.push({
id: pin.id,
title: pin.title || pin.grid_title || "",
image: img,
link: `https://www.pinterest.com/pin/${pin.id}/`,
created_at: pin.created_at,
pinner: {
id: pin.pinner?.id,
username: pin.pinner?.username,
full_name: pin.pinner?.full_name,
},
});
}
bookmark = data.resource_response.bookmark;
if (!bookmark) break;
}
for (let i = results.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[results[i], results[j]] = [results[j], results[i]];
}
return { status: true, data: results.slice(0, limit) };
} catch (e) {
return { status: false };
}
}

export async function GET(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
try {
const { searchParams } = new URL(req.url);
const query = searchParams.get("query");
const limit = parseInt(searchParams.get("limit") || "5", 10);

if (!query) {
addFail();
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}

const result = await scrapePinterest(query, limit);
if (!result || !result.status || !result.data || result.data.length === 0) {
addFail();
return NextResponse.json({ status: false, message: message.scrape.noResult }, { status: 404 });
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
