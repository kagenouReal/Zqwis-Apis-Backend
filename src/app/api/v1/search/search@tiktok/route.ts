import { NextResponse } from "next/server";
import axios from "axios";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";
//==================
async function ttsearchM(keyword: string) {
const url = "https://search22-normal-c-alisg.tiktokv.com/aweme/v2/search/general/stream/?device_platform=android&aid=1180&app_name=trill&version_name=44.5.3&region=MY";
const encodedKeyword = encodeURIComponent(keyword).replace(/%20/g, '+');
try {
const response = await axios({
method: 'POST',
url,
data: `keyword=${encodedKeyword}&offset=0&count=10&search_source=normal_search&hot_search=0&is_filter_search=0&publish_time=0&sort_type=0`,
responseType: 'text'
});
const chunks = response.data.split('\n');
let resData: any = null;
for (let c of chunks) {
c = c.trim();
if (c.startsWith('{') && c.endsWith('}')) {
try {
let j = JSON.parse(c);
if (j?.data?.length) { resData = j; break; }
} catch (e) {}
}
}
if (!resData) return { status: false };
const items = resData.data.filter((i: any) => i.aweme_info).map((i: any) => i.aweme_info);
if (!items.length) return { status: false };
items.sort(() => Math.random() - 0.5);
const info = items[0];
let imageUrls = [];
let isPhotoSlide = false;
if (info.image_post_info?.images) {
isPhotoSlide = true;
imageUrls = info.image_post_info.images.map((i: any) => i.display_image?.url_list?.[0]).filter(Boolean);
}
return {
status: true,
data: {
id: info.aweme_id,
desc: info.desc,
create_time: info.create_time,
region: info.region || "Unknown",
is_ads: info.is_ads || false,
share_url: info.share_info?.share_url || null,
is_photo_slide: isPhotoSlide,
media: {
images: imageUrls,
playUrl: info.video?.play_addr?.url_list?.[0] || null,
downloadUrl: info.video?.download_addr?.url_list?.[0] || null,
coverUrl: info.video?.cover?.url_list?.[0] || null,
duration_seconds: info.video?.duration || 0
},
author: {
uid: info.author?.uid,
username: info.author?.unique_id,
nickname: info.author?.nickname,
avatar: info.author?.avatar_larger?.url_list?.[0] || info.author?.avatar_thumb?.url_list?.[0] || null
},
music: {
id: info.music?.id_str,
title: info.music?.title,
author: info.music?.author,
playUrl: info.music?.play_url?.url_list?.[0] || null
},
stats: {
playCount: info.statistics?.play_count || 0,
diggCount: info.statistics?.digg_count || 0,
commentCount: info.statistics?.comment_count || 0,
shareCount: info.statistics?.share_count || 0,
collectCount: info.statistics?.collect_count || 0
}
}
};
} catch (e) {
return { status: false };
}
}
//==================
export async function GET(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
try {
const { searchParams } = new URL(req.url);
const keyword = searchParams.get("keyword");
if (!keyword) {
addFail();
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}
const result = await ttsearchM(keyword);
if (!result || !result.status || !result.data) {
addFail();
return NextResponse.json({ status: false, message: message.scrape.noResult }, { status: 404 });
}
addSuccess();
return NextResponse.json({
status: true,
message: message.status.success,
creator: "@Zqwis-Apis",
limit_left: auth.user?.role === "user" ? auth.user.limit : 999999,
data: result.data
}, { status: 200 });
} catch (err) {
addFail();
return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
}
}