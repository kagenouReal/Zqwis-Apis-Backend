import { WABot } from "./whatsapp";
import { startCron } from "./cron";
//==================
// Use global to handle Next.js HMR/Reloads
if (!(global as any).system_booted) {
    (global as any).system_booted = false;
}
//==================
export async function bootstrapSystem() {
if ((global as any).system_booted) return;
(global as any).system_booted = true;
await WABot.init();
await startCron();
}