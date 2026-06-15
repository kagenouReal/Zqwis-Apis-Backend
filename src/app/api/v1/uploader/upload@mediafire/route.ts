import { NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import crypto from "crypto";
import { addSuccess, addFail } from "@/system/lib/request-stats";
import { checkApikey } from "@/system/lib/api-guard";
import { message } from "@/system/lib/responses";
//==================
class MediaFireUpload {
email: string;
password: string;
base: string;
headers: {
"User-Agent": string;
};
cookie: string;
session: string;
token: string;
constructor(
email: string,
password: string
) {
this.email = email;
this.password = password;
this.base = "https://www.mediafire.com";
this.headers = {
"User-Agent": "okhttp/4.12.0"
};
this.cookie = "";
this.session = "";
this.token = "";
}
async upload(
buffer: Buffer,
name = `${Date.now()}`
) {
const req = async (
url: string,
data: any,
headers = {}
) =>
axios.post(url, data, {
maxBodyLength: Infinity,
maxContentLength: Infinity,
headers: {
...(data?.getHeaders?.() || {}),
...headers,
...this.headers
}
});
if (!Buffer.isBuffer(buffer))
throw Error("buff.");
if (!this.session || !this.token) {
let form = new FormData();
form.append("email", this.email);
form.append("password", this.password);
form.append("return_user_cookie", "true");
form.append("remember", "true");
const login = await req(
`${this.base}/application/login.php`,
form
);
this.session =
login.data?.response?.session_token;
if (!this.session)
throw Error(
login.data?.response?.message ||
message.auth.loginRequired
);
this.cookie =
login.headers["set-cookie"]
?.map((v: string) =>
v.split(";")[0]
)
.join("; ") || "";
form = new FormData();
form.append("type", "upload");
form.append("lifespan", "1440");
form.append("response_format", "json");
form.append("session_token", this.session);
const token = await req(
`${this.base}/api/1.5/user/get_action_token.php`,
form,
{
Cookie: this.cookie
}
);
this.token =
token.data?.response?.action_token;
if (!this.token)
throw Error(
token.data?.response?.message ||
message.auth.invalidToken
);
}
const size = buffer.length;
const hash = crypto
.createHash("sha256")
.update(buffer)
.digest("hex");
let form = new FormData();
form.append(
"uploads",
JSON.stringify([
{
filename: name,
folder_key: "myfiles",
size,
hash,
resumable: "yes",
preemptive: "yes"
}
])
);
form.append("response_format", "json");
form.append("session_token", this.token);
const check = await req(
`${this.base}/api/1.5/upload/check.php`,
form,
{
Cookie: this.cookie
}
);
const uploadUrl =
check.data?.response?.upload_url?.simple;
if (!uploadUrl)
throw Error(
check.data?.response?.message ||
message.scrape.fetchFailed
);
const upload = await req(
`${uploadUrl}?folder_key=myfiles&response_format=json&session_token=${this.token}`,
buffer,
{
Cookie: this.cookie,
"x-filesize": size,
"x-filehash": hash,
"x-filename": encodeURIComponent(name),
"Content-Type":
"application/octet-stream"
}
);
const key =
upload.data?.response?.doupload?.key;
if (!key)
throw Error(
upload.data?.response?.message ||
message.file.invalid
);
form = new FormData();
form.append("key", key);
form.append("response_format", "json");
form.append("session_token", this.token);
const poll = await req(
`${this.base}/api/1.5/upload/poll_upload.php`,
form,
{
Cookie: this.cookie
}
);
const d =
poll.data?.response?.doupload;
if (!d)
throw Error(
poll.data?.response?.message ||
message.api.invalidResponse
);
const links = await req(
`${this.base}/api/1.5/file/get_links.php`,
new URLSearchParams({
session_token: this.session,
quick_key: d.quickkey,
link_type: "direct_download",
response_format: "json"
}),
{
Cookie: this.cookie,
"Content-Type":
"application/x-www-form-urlencoded"
}
);
return {
quickkey: d.quickkey,
filename: d.filename,
size: +d.size,
hash: d.hash,
created: d.created,
created_utc: d.created_utc,
revision: +d.revision,
description: d.description,
resumable_upload: d.resumable_upload,
link:
`${this.base}/file/${d.quickkey}`,
direct:
links.data?.response?.links?.[0]
?.direct_download || null
};
}
}
//==================
const clients = [{email: "zqwis1@kage.my",password: "zqwis1"},{email: "zqwis2@kage.my",password: "zqwis2"},{email: "zqwis3@kage.my",password: "zqwis3"},{email: "zqwis4@kage.my",password: "zqwis4"},{email: "zqwis5@kage.my",password: "zqwis5"}].map(acc =>new MediaFireUpload(acc.email,acc.password));
//==================
export async function POST(
req: Request
) {
const auth =
await checkApikey(req);
if (!auth.status)
return auth.response;
try {
const type =
req.headers.get("content-type") || "";
let buffer: Buffer | null = null;
let filename =
`${Date.now()}`;
if (
type.includes("multipart/form-data")
) {
const form =
await req.formData();
const file =
form.get("file") as File;
if (!file) {
addFail(auth.user.username);
return NextResponse.json(
{
status: false,
message:
message.file.missing
},
{
status: 400
}
);
}
filename = file.name;
buffer = Buffer.from(
await file.arrayBuffer()
);
}
else if (
type.includes("application/json")
) {
const body =
await req
.json()
.catch(() => ({}));
if (body.url) {
const fetchFile =
await fetch(body.url);
if (!fetchFile.ok) {
addFail(auth.user.username);
return NextResponse.json(
{
status: false,
message:
message.api.fetchFailed
},
{
status: 400
}
);
}
buffer = Buffer.from(
await fetchFile.arrayBuffer()
);
filename =
body.filename || filename;
}
else if (body.base64) {
buffer = Buffer.from(
body.base64,
"base64"
);
filename =
body.filename || filename;
}
else {
addFail(auth.user.username);
return NextResponse.json(
{
status: false,
message:
message.input.missing
},
{
status: 400
}
);
}
}
else {
addFail(auth.user.username);
return NextResponse.json(
{
status: false,
message:
message.input.invalidFormat
},
{
status: 400
}
);
}
if (!buffer) {
addFail(auth.user.username);
return NextResponse.json(
{
status: false,
message:
message.file.invalid
},
{
status: 400
}
);
}
const mf =
clients[
Math.floor(
Math.random() *
clients.length
)
];
const result =
await mf.upload(
buffer,
filename
);
addSuccess(auth.user.username);
return NextResponse.json(
{
status: true,
message:
message.status.success,
creator: "@Zqwis-Apis",
limit_left:
auth.user?.role === "user"
? auth.user.limit
: 999999,
data: result
},
{
status: 200
}
);
} catch (err: any) {
addFail(auth.user.username);
return NextResponse.json(
{
status: false,
message:
message.api.serverError,
error: err?.message
},
{
status: 500
}
);
}
}