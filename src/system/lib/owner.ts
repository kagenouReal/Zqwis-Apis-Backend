import os from "os";
import db from "./db";
import fs from "fs-extra";
import path from "path";

//==================
export function getSystemInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    return {
        memory: {
            total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + " GB",
            used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + " GB",
            free: (freeMem / 1024 / 1024 / 1024).toFixed(2) + " GB",
            percent: ((usedMem / totalMem) * 100).toFixed(2) + "%"
        },
        uptime: formatUptime(uptime),
        cpu: {
            model: cpus[0].model,
            cores: cpus.length,
            load: loadAvg
        },
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version
    };
}

//==================
function formatUptime(seconds: number) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    
    let res = "";
    if (d > 0) res += `${d}d `;
    if (h > 0) res += `${h}h `;
    if (m > 0) res += `${m}m `;
    res += `${s}s`;
    return res;
}

//==================
export function getSettings() {
    const rows = db.prepare("SELECT * FROM settings").all();
    const settings: Record<string, any> = {
        maintenance: false,
        broadcast: "",
        apiToggles: {}
    };
    rows.forEach((row: any) => {
        try {
            settings[row.key] = JSON.parse(row.value);
        } catch {
            settings[row.key] = row.value;
        }
    });
    return settings;
}

//==================
export function updateSetting(key: string, value: any) {
    const valStr = JSON.stringify(value);
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, valStr);
}

//==================
