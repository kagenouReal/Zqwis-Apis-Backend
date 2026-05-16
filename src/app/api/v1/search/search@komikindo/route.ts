import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { addSuccess, addFail } from "@/system/lib/store";
import { checkApikey } from "@/system/lib/apiguard";
import { message } from "@/system/lib/message";

export const dynamic = 'force-dynamic';

async function komikindo(title: string) {
try {
const { data: html } = await axios.get(
`https://komikindo.ch/daftar-manga/?title=${encodeURIComponent(title)}`,
{ headers: { "User-Agent": "Mozilla/5.0" } },
);
const $ = cheerio.load(html);
const all = $(".animepost").toArray();
if (!all.length) return { status: false };
const el = all[Math.floor(Math.random() * all.length)];
const link = $(el).find("h3 a").attr("href");
if (!link) return { status: false };

const { data: html2 } = await axios.get(link, {
headers: { "User-Agent": "Mozilla/5.0" },
});
const $$ = cheerio.load(html2);
const raw = $$(".infox h1").first().text() || $$(".entry-title").text() || $(el).find("h3 a").text();
const titleFix = raw.replace(/\s+/g, " ").replace(/^Komik\s*/i, "").trim();

const meta = {
title: titleFix,
thumb: $$(".thumb img").attr("src") || $(el).find("img").attr("src"),
rating: ($$('i[itemprop="ratingValue"]').text() || $$(".rtg i").text()).replace(/\s+/g, " ").trim(),
status: $$('.spe span:contains("Status")').text().replace(/Status:/i, "").replace(/\s+/g, " ").trim(),
type: $$('.spe span:contains("Jenis")').text().replace(/Jenis Komik:/i, "").replace(/\s+/g, " ").trim(),
author: $$('.spe span:contains("Pengarang")').text().replace(/Pengarang:/i, "").replace(/\s+/g, " ").trim(),
genre: $$(".genre-info a").map((_i, e) => $$(e).text().replace(/\s+/g, " ").trim()).get(),
sinopsis: ($$(".desc").text() || $$("#sinopsis").text()).replace(/\s+/g, " ").trim(),
};

const ch = [];
const list = $$("#chapter_list ul li").toArray();

// 🔥 BATASIN LOOP: Ambil list semua chapter, tapi cuma ambil gambar buat 5 chapter teratas biar server gak timeout!
for (let i = 0; i < list.length; i++) {
const e = list[i];
const chLink = $$(e).find(".lchx a").attr("href");
let imgs: string[] = [];

// Cuma fetch isi gambar buat 5 chapter terbaru
if (chLink && i < 5) {
try {
const { data: html3 } = await axios.get(chLink, { headers: { "User-Agent": "Mozilla/5.0" } });
const $$$ = cheerio.load(html3);
imgs = $$$("#chimg-auh img").map((_i, img) => $$$(img).attr("src")).get();
imgs = [...new Set(imgs)];
} catch {}
}

ch.push({
title: $$(e).find(".lchx a").text().replace(/\s+/g, " ").trim(),
link: chLink,
date: $$(e).find(".dt").text().replace(/\s+/g, " ").trim(),
images: imgs,
});
}

return {
status: true,
data: {
...meta,
link,
total_chapter: list.length,
chapters: ch,
}
};
} catch (e) {
return { status: false };
}
}

export async function GET(req: Request) {
const auth = await checkApikey(req);
if (!auth.status) return auth.response;
try {
const { searchParams } = new URL(req.url);
const title = searchParams.get("title");

if (!title) {
addFail();
return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
}

const result = await komikindo(title);
if (!result || !result.status || !result.data) {
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
