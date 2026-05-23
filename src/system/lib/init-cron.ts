// src/system/lib/init-cron.ts
import { initializeAllCronJobs } from "./cron-jobs";

let cronJobsStarted = false;

export function startCronJobs() {
  if (!cronJobsStarted && process.env.ENABLE_CRON === "true") {
    initializeAllCronJobs();
    cronJobsStarted = true;
  }
}