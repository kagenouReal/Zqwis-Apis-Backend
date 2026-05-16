export const apiRegistry = [
{
name: "Text2Img (Freegen)",
category: "Ai",
method: "GET",
path: "/api/v1/ai/text2img@freegen",
desc: "Generate Image via Freegen WebSocket Engine",
query: ["prompt"],
example:
"/api/v1/ai/text2img@freegen?prompt=anime+girl+in+beach",
curl: `curl -X GET "<DOMAIN>/api/v1/ai/text2img@freegen?prompt=anime+girl+in+beach&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Text2Img (MagicStudio)",
category: "Ai",
method: "GET",
path: "/api/v1/ai/text2img@magicstudio",
desc: "Generate Image via MagicStudio Engine",
query: ["prompt"],
example:
"/api/v1/ai/text2img@magicstudio?prompt=anime+girl+in+city",
curl: `curl -X GET "<DOMAIN>/api/v1/ai/text2img@magicstudio?prompt=anime+girl+in+city&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Remove BG (MagicStudio)",
category: "Tools",
method: "POST",
path: "/api/v1/tools/removebg@magicstudio",
desc: "Remove background from Image (URL or Upload File)",
body: ["url"],
example: "/api/v1/tools/removebg@magicstudio",
curl: `curl -X POST "<DOMAIN>/api/v1/tools/removebg?apikey=<apikey>" -F "image=@/path/to/your/image.jpg"`
},
{
name: "Search Character (HiWaifu)",
category: "Ai",
method: "GET",
path: "/api/v1/ai/search@HiWaifu",
desc: "Search HiWaifu characters by keyword",
query: ["keyword"],
example: "/api/v1/ai/search@HiWaifu?keyword=elaina",
curl: `curl -X GET "<DOMAIN>/api/v1/ai/search@HiWaifu?keyword=elaina&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Chat Character (HiWaifu)",
category: "Ai",
method: "POST",
path: "/api/v1/ai/chat@HiWaifu",
desc: "Chat with HiWaifu character using automated WebSocket integration",
body: ["robotId", "prompt"],
example: "/api/v1/ai/chat@HiWaifu",
curl: `curl -X POST "<DOMAIN>/api/v1/ai/chat@HiWaifu?apikey=<apikey>" -H "Content-Type: application/json" -d '{"robotId": "18029866", "prompt": "Halo"}'`
}
];
