export const apiRegistry = [
{
name: "Text2Img (Freegen)",
category: "Ai",
method: "GET",
path: "/api/v1/ai/text2img@freegen",
desc: "Generate Image via Freegen WebSocket Engine",
query: ["prompt"],
example: "/api/v1/ai/text2img@freegen?prompt=anime+girl&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/ai/text2img@freegen?prompt=anime+girl&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Text2Img (MagicStudio)",
category: "Ai",
method: "GET",
path: "/api/v1/ai/text2img@magicstudio",
desc: "Generate Image via MagicStudio Engine",
query: ["prompt"],
example: "/api/v1/ai/text2img@magicstudio?prompt=anime+girl+in+city&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/ai/text2img@magicstudio?prompt=anime+girl+in+city&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Remove BG (MagicStudio)",
category: "Tools",
method: "POST",
path: "/api/v1/tools/removebg@magicstudio",
desc: "Remove background from Image (URL or Upload File)",
body: ["url"],
example: "/api/v1/tools/removebg@magicstudio?apikey=<apikey>",
curl: `curl -X POST "<DOMAIN>/api/v1/tools/removebg@magicstudio?apikey=<apikey>" -F "image=@/path/to/your/image.jpg"`
},
{
name: "MediaFire Uploader",
category: "uploader",
method: "POST",
path: "/api/v1/uploader/upload@mediafire",
desc: "Upload media/file to MediaFire (URL, buffer)",
body: ["url"],
example: "/api/v1/tools/upload@mediafire?apikey=<apikey>",
curl: `curl -X POST "<DOMAIN>/api/v1/uploader/upload@mediafire?apikey=<apikey>" -F "file=@/path/to/your/image.jpg"`
},
{
name: "Search Character (HiWaifu)",
category: "Search",
method: "GET",
path: "/api/v1/search/search@hiwaifu",
desc: "Search HiWaifu characters by keyword",
query: ["keyword"],
example: "/api/v1/search/search@hiwaifu?keyword=elaina&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/search/search@hiwaifu?keyword=elaina&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Chat Character (HiWaifu)",
category: "Ai",
method: "POST",
path: "/api/v1/ai/chat@hiwaifu",
desc: "Chat with HiWaifu character using automated WebSocket integration",
body: ["robotId", "prompt"],
example: "/api/v1/ai/chat@hiwaifu?apikey=<apikey>",
curl: `curl -X POST "<DOMAIN>/api/v1/ai/chat@hiwaifu?apikey=<apikey>" -H "Content-Type: application/json" -d '{"robotId": "18029866", "prompt": "Halo"}'`
},
{
name: "Search Items (Mudah.my)",
category: "Search",
method: "GET",
path: "/api/v1/search/search@mudah",
desc: "Search items on Mudah.my by keyword",
query: ["query"],
example: "/api/v1/search/search@mudah?query=iphone+13&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/search/search@mudah?query=iphone+13&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Track Package (Tracking.my)",
category: "Tools",
method: "GET",
path: "/api/v1/tools/track@trackingmy",
desc: "Track package status and details using receipt number",
query: ["resi"],
example: "/api/v1/tools/track@trackingmy?resi=JTE123456789&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/tools/track@trackingmy?resi=JTE123456789&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "OTP Spammer (Tracking.my)",
category: "Experimental",
method: "POST",
path: "/api/v1/experimental/otp@trackingmy",
desc: "Send OTP Whatsapp login request to target phone number (3s Cooldown)",
body: ["phone"],
example: "/api/v1/experimental/otp@trackingmy?apikey=<apikey>",
curl: `curl -X POST "<DOMAIN>/api/v1/experimental/otp@trackingmy?apikey=<apikey>" -H "Content-Type: application/json" -d '{"phone": "0123456789"}'`
},
{
name: "Stalk User (Pinterest)",
category: "Tools",
method: "GET",
path: "/api/v1/tools/stalk@pinterest",
desc: "Get Pinterest user profile details and recent pins",
query: ["username"],
example: "/api/v1/tools/stalk@pinterest?username=elaina&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/tools/stalk@pinterest?username=elaina&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Video Downloader (Douyin)",
category: "Downloader",
method: "GET",
path: "/api/v1/downloader/douyin@snapdl",
desc: "Download video from Douyin without watermark",
query: ["url"],
example: "/api/v1/downloader/douyin@snapdl?url=https://v.douyin.com/xxx&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/downloader/douyin@snapdl?url=https://v.douyin.com/xxx&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Search Pinterest (Web Scraper)",
category: "Search",
method: "GET",
path: "/api/v1/search/pinterest@web",
desc: "Search pins on Pinterest using Web Scraper (Randomized)",
query: ["query", "limit"],
example: "/api/v1/search/pinterest@web?query=anime+girl&limit=5&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/search/pinterest@web?query=anime+girl&limit=5&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Search Pinterest (API v3)",
category: "Search",
method: "GET",
path: "/api/v1/search/pinterest@api",
desc: "Search pins on Pinterest using official API v3 (High Quality)",
query: ["query", "limit"],
example: "/api/v1/search/pinterest@api?query=aesthetic+wallpaper&limit=10&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/search/pinterest@api?query=aesthetic+wallpaper&limit=10&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Search Video (TikTok)",
category: "Search",
method: "GET",
path: "/api/v1/search/search@tiktok",
desc: "Search TikTok videos and fetch direct media links (Randomized)",
query: ["keyword"],
example: "/api/v1/search/search@tiktok?keyword=kucing+lucu&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/search/search@tiktok?keyword=kucing+lucu&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Series Graph Maker",
category: "Tools",
method: "GET",
path: "/api/v1/tools/seriesgraph",
desc: "Generate a rating grid chart for TV Series (Source: SeriesGraph)",
query: ["query"],
example: "/api/v1/tools/seriesgraph?query=saekano&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/tools/seriesgraph?query=saekano&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Search Drama (FreeReels)",
category: "Search",
method: "GET",
path: "/api/v1/search/freereels@api",
desc: "Search dramas and fetch episode stream links from FreeReels",
query: ["keyword"],
example: "/api/v1/search/freereels@api?keyword=married&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/search/freereels@api?keyword=married&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Search Manga (Komikindo)",
category: "Search",
method: "GET",
path: "/api/v1/search/search@komikindo",
desc: "Search manga from Komikindo and fetch metadata with recent chapter images",
query: ["title"],
example: "/api/v1/search/search@komikindo?title=one+piece&apikey=<apikey>",
curl: `curl -X GET "<DOMAIN>/api/v1/search/search@komikindo?title=one+piece&apikey=<apikey>" -H "Accept: application/json"`
}
];
