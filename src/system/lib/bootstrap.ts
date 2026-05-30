import { WABot } from "./whatsapp-bot";
import { startCron } from "./cron";
let booted = false;
export async function bootstrapSystem() {
  if (booted) return;
  booted = true;
  await WABot.init();
  await startCron();
}
