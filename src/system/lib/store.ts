let stats: { total: number; success: number; failed: number; lastCrash: string | null } = {
total: 0,
success: 0,
failed: 0,
lastCrash: null
};
export function getStats() {
return stats;
}
export function addSuccess() {
stats.total++;
stats.success++;
}
export function addFail() {
stats.total++;
stats.failed++;
stats.lastCrash = new Date().toISOString();
}
