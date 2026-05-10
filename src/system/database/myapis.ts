export const apiRegistry = [
{
name: "Text2Img (Freegen)",
category: "Ai",
method: "GET",
path: "/api/v1/ai/text2img@freegen",
desc: "Generate Image via Freegen WebSocket Engine",
query: ["prompt"],
example: "/api/v1/ai/text2img@freegen?prompt=anime+girl+in+beach",
curl: `curl -X GET "<DOMAIN>/api/v1/ai/text2img@freegen?prompt=anime+girl+in+beach&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Text2Img (MagicStudio)",
category: "Ai",
method: "GET",
path: "/api/v1/ai/text2img@magicstudio",
desc: "Generate Image via MagicStudio Engine",
query: ["prompt"],
example: "/api/v1/ai/text2img@magicstudio?prompt=anime+girl+in+city",
curl: `curl -X GET "<DOMAIN>/api/v1/ai/text2img@magicstudio?prompt=anime+girl+in+city&apikey=<apikey>" -H "Accept: application/json"`
},
{
name: "Remove BG (MagicStudio)",
category: "tools",
method: "POST", 
path: "/api/v1/tools/removebg",
desc: "Remove background from Image (URL or Upload File)",
body: ["url"],
example: "/api/v1/tools/removebg",
curl: `curl -X POST "<DOMAIN>/api/tools/ai/removebg?apikey=<apikey>" -F "image=@/path/to/your/image.jpg"`
}
];
