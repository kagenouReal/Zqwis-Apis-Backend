import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const MIME_TYPES: Record<string, string> = {
".png": "image/png",
".jpg": "image/jpeg",
".jpeg": "image/jpeg",
".gif": "image/gif",
".webp": "image/webp",
".svg": "image/svg+xml",
".ico": "image/x-icon",
".mp4": "video/mp4",
".webm": "video/webm",
".mp3": "audio/mpeg",
".wav": "audio/wav",
".ogg": "audio/ogg",
".json": "application/json",
".txt": "text/plain",
".html": "text/html",
".css": "text/css",
".js": "text/javascript",
};

export async function GET(
req: NextRequest,
context: { params: Promise<{ path: string[] }> }
) {
try {
const { path: paths } = await context.params;
const safePath = path
.normalize(paths.join("/"))
.replace(/^(\.\.(\/|\\|$))+/, "");
const filePath = path.join(
process.cwd(),
"src/system/public",
safePath
);
try {
await fs.stat(filePath);
} catch (e) {
return new Response("", { status: 404 });
}
const file = await fs.readFile(filePath);
const ext = path.extname(filePath).toLowerCase();
const contentType = MIME_TYPES[ext] || "application/octet-stream";
return new Response(file, {
headers: {
"Content-Type": contentType,
"Cache-Control": "public, max-age=31536000, immutable",
},
});
} catch (err) {
console.error("ASSET ERROR:", err);
return new Response("Internal Server Error", { status: 500 });
}
}
