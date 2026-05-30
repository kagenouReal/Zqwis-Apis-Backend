import { CronJob } from "cron";
import { readDB, writeDB } from "./db";
let started = false;
async function resetMissions() {
  try {
    const users = await readDB();
    const updated = users.map((u: any) => ({
      ...u,
      missions: { ...u.missions, inProgress: u.missions?.inProgress?.filter((m: any) => m.type !== "daily") || [] }
    }));
    await writeDB(updated);
  } catch {}
}
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
async function weeklyBonus() {
  try {
    const users = await readDB();
    let change = false;
    for (const u of users) {
      if (u.activity?.totalLogins > 0) {
        u.coins = { total: (u.coins?.total || 0) + 100, earned: (u.coins?.earned || 0) + 100, spent: u.coins?.spent || 0, lastUpdated: Date.now() };
        if (!u.coinHistory) u.coinHistory = [];
        u.coinHistory.push({ type: "earn", amount: 100, reason: "Weekly bonus", timestamp: Date.now() });
        change = true;
      }
    }
    if (change) await writeDB(users);
  } catch {}
}
export async function startCron() {
  if (started || process.env.ENABLE_CRON !== "true") return;
  await checkPremium();
  new CronJob("0 0 * * *", resetMissions).start();
  new CronJob("0 */1 * * *", checkPremium).start();
  new CronJob("0 0 * * 0", weeklyBonus).start();
  started = true;
}
