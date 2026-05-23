/**
 * Cron Jobs untuk Premium & Coin System
 * File: src/system/lib/cron-jobs.ts
 */

import { CronJob } from "cron";
import { readDB, writeDB } from "./db";
import { addCoins } from "./premium-coins";

/**
 * Reset daily missions setiap hari pada jam 00:00
 */
export function cronResetDailyMissions() {
  const job = new CronJob("0 0 * * *", async () => {
    try {
      console.log("[CRON] Resetting daily missions...");

      let users = await readDB();

      users = users.map((user: any) => {
        return {
          ...user,
          missions: {
            ...user.missions,
            inProgress: user.missions?.inProgress?.filter(
              (m: any) => m.type !== "daily"
            ) || [],
          },
        };
      });

      await writeDB(users);
      console.log("[CRON] Daily missions reset completed");
    } catch (error) {
      console.error("[CRON] Error resetting daily missions:", error);
    }
  });

  job.start();
  console.log("✓ Cron: Daily missions reset - Active");
  return job;
}

/**
 * Check expired premium dan update status
 */
export function cronCheckExpiredPremium() {
  const job = new CronJob("0 */1 * * *", async () => {
    try {
      console.log("[CRON] Checking expired premium...");

      let users = await readDB();
      let updated = 0;

      users = users.map((user: any) => {
        if (
          user.premiumStatus?.isPremium &&
          user.premiumStatus?.premiumExpiry &&
          Date.now() > user.premiumStatus.premiumExpiry
        ) {
          updated++;
          console.log(
            `[CRON] Premium expired for user: ${user.username}`
          );

          return {
            ...user,
            premiumStatus: {
              isPremium: false,
              premiumType: null,
              premiumExpiry: null,
              startDate: user.premiumStatus.startDate,
            },
          };
        }

        return user;
      });

      if (updated > 0) {
        await writeDB(users);
      }

      console.log(`[CRON] Premium check completed - ${updated} users updated`);
    } catch (error) {
      console.error("[CRON] Error checking expired premium:", error);
    }
  });

  job.start();
  console.log("✓ Cron: Premium expiry check - Active (every 1 hour)");
  return job;
}

/**
 * Weekly bonus untuk active users
 */
export function cronWeeklyBonus() {
  const job = new CronJob("0 0 * * 0", async () => {
    try {
      console.log("[CRON] Processing weekly bonuses...");

      let users = await readDB();
      let processed = 0;

      for (const user of users) {
        // Check if user was active this week
        if (user.activity?.totalLogins > 0) {
          const result = await addCoins(
            user.username,
            100,
            "Weekly active bonus"
          );

          if (result.status) {
            processed++;
          }
        }
      }

      console.log(`[CRON] Weekly bonus processed - ${processed} users`);
    } catch (error) {
      console.error("[CRON] Error processing weekly bonus:", error);
    }
  });

  job.start();
  console.log("✓ Cron: Weekly bonus - Active (every Sunday)");
  return job;
}

/**
 * Cleanup old coin history (older than 90 days)
 */
export function cronCleanupOldHistory() {
  const job = new CronJob("0 2 * * *", async () => {
    try {
      console.log("[CRON] Cleaning up old coin history...");

      let users = await readDB();
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      let cleaned = 0;

      users = users.map((user: any) => {
        if (user.coinHistory && Array.isArray(user.coinHistory)) {
          const originalLength = user.coinHistory.length;
          user.coinHistory = user.coinHistory.filter(
            (entry: any) => entry.timestamp > ninetyDaysAgo
          );

          if (originalLength !== user.coinHistory.length) {
            cleaned++;
          }
        }

        return user;
      });

      if (cleaned > 0) {
        await writeDB(users);
      }

      console.log(`[CRON] History cleanup completed - ${cleaned} users`);
    } catch (error) {
      console.error("[CRON] Error cleaning up history:", error);
    }
  });

  job.start();
  console.log("✓ Cron: History cleanup - Active (daily at 2 AM)");
  return job;
}

/**
 * Initialize all cron jobs
 */
export function initializeAllCronJobs() {
  console.log("\n🕐 Initializing Cron Jobs...");

  const jobs = [
    cronResetDailyMissions(),
    cronCheckExpiredPremium(),
    cronWeeklyBonus(),
    cronCleanupOldHistory(),
  ];

  console.log(`✅ ${jobs.length} cron jobs initialized\n`);

  return jobs;
}

/**
 * Stop all cron jobs
 */
export function stopAllCronJobs(jobs: CronJob[]) {
  jobs.forEach((job, index) => {
    job.stop();
    console.log(`✓ Cron job ${index + 1} stopped`);
  });
}
