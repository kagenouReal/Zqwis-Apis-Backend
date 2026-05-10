import axios from "axios";
import WebSocket from "ws";
import {addSuccess,addFail} from "@/system/lib/store";
import {checkApikey} from "@/system/lib/apiguard";
async function freegen(prompt:string){
try{
const{ts,sig}=(await axios.post("https://prompt-signer.freegen.app",{prompt})).data;
const{job_id}=(await axios.post("https://image-generator.freegen.app",{prompt,ts,sig,selected_style:""})).data;
return await new Promise((resolve,reject)=>{
const ws=new WebSocket("wss://websocket-bridge.freegen.app/ws");
const timer=setTimeout(()=>{
ws.close();
reject(new Error("Timeout"));
},60000);
ws.on("open",()=>ws.send(JSON.stringify({type:"subscribe",job_id,auth:job_id})));
ws.on("message",async(data:any)=>{
const msg=JSON.parse(data);
if(msg.type==="result"){
clearTimeout(timer);
ws.close();
resolve({status:true,buffer:msg.image_data.replace(/^data:image\/\w+;base64,/,"")});
}else if(msg.type==="error"){
clearTimeout(timer);
ws.close();
reject(new Error(msg.message));
}
});
ws.on("error",(err)=>{
clearTimeout(timer);
reject(err);
});
});
}catch(e){
return{status:false};
}
}
export async function GET(req:Request){
const auth=await checkApikey(req);
if(!auth.status)return auth.response;
try{
const{searchParams}=new URL(req.url);
const prompt=searchParams.get("prompt");
if(!prompt){
addFail();
return Response.json({status:false},{status:400});
}
const result:any=await freegen(prompt);
if(!result||!result.status){
addFail();
return Response.json({status:false},{status:500});
}
addSuccess();
return Response.json({
status:true,
creator:"@Zqwis-Apis",
limit_left:auth.user?.role==="user"?auth.user.limit:"UNLIMITED",
data:{mimetype:"image/png",buffer:result.buffer}
},{status:200});
}catch(err){
addFail();
return Response.json({status:false},{status:500});
}
}
