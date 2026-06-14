import { CronJob } from "cron";
import { readDB, writeDB } from "./account-db";

let started = false;

async function checkPremium() {
    try {
        const users = await readDB();
        let change = false;
        const updated = users.map((u: any) => {
            if (u.premiumStatus?.isPremium && u.premiumStatus?.premiumExpiry && Date.now() > u.premiumStatus.premiumExpiry) {
                change = true;
                return { ...u, premiumStatus: { ...u.premiumStatus, isPremium: false, premiumExpiry: null } };
            }
            return u;
        });
        if (change) await writeDB(updated);
    } catch {}
}

export async function startCron() {
    if (started) return;
    await checkPremium();
    // Run every hour to check for expired premiums
    new CronJob("0 * * * *", checkPremium).start();
    started = true;
}
