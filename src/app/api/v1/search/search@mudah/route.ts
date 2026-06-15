import { NextResponse } from "next/server";
import axios from "axios";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";
//==================
async function searchMudahMy(query: string, limit = 20) {
try {
const baseUrl = 'https://search.mudah.my/v1/search/include/featured';
const headers = {
'user-agent': 'UAAPK2410; SDK35; a5b4f0df1e29ba3f; houji REL v15; 175.141.46.138 23127PN0CC Xiaomi;',
'device_id': 'a5b4f0df1e29ba3f',
'accept': 'application/json',
'content-type': 'application/json'
};
const params = {
q: query,
from: 0,
limit: 50
};
const response = await axios.get(baseUrl, { headers, params });
if (!response.data || !response.data.data) return { status: false };
let results = response.data.data.map((ad: any) => {
const attr = ad.attributes;
return {
id: ad.id,
title: attr.subject,
price: attr.price,
oldPrice: attr.old_price || null,
priceLabel: attr.price_label,
brand: attr.phone_brand_name,
category: attr.category_name,
location: { subarea: attr.subarea_name, region: attr.region_name },
condition: attr.condition_name,
images: attr.image_count,
seller: { name: attr.name, id: attr.user_id, type: attr.ad_seller_type === 1 ? 'Private' : 'Company' },
url: attr.adview_url,
thumbnail: `https://img.rnudah.com/images${attr.image}`,
timestamp: attr.list_ts,
expiry: attr.ad_expiry
};
});
for (let i = results.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[results[i], results[j]] = [results[j], results[i]];
}
return { status: true, data: results.slice(0, limit) };
} catch (error) {
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
if (!query) {
addFail(auth.user.username);
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const result = await searchMudahMy(query);
if (!result || !result.status || !result.data) {
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