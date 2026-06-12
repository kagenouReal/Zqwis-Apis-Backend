import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { message } from "@/system/lib/responses";
import { getSystemInfo, getSettings, updateSetting } from "@/system/lib/owner";
import db from "@/system/lib/db";
import fs from "fs-extra";
import path from "path";

//==================
export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "owner") {
        return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
    }

    try {
        const type = req.nextUrl.searchParams.get("type");

        if (type === "system") {
            return NextResponse.json({ status: true, data: getSystemInfo() });
        }

        if (type === "settings") {
            return NextResponse.json({ status: true, data: getSettings() });
        }

        if (type === "db_export") {
            const dbPath = path.join(process.cwd(), "src/system/database/database.db");
            if (!fs.existsSync(dbPath)) return NextResponse.json({ status: false, message: message.db.readFail }, { status: 404 });
            const buffer = await fs.readFile(dbPath);
            return new NextResponse(buffer, {
                headers: {
                    "Content-Type": "application/x-sqlite3",
                    "Content-Disposition": `attachment; filename="database_${Date.now()}.db"`,
                }
            });
        }

        return NextResponse.json({ 
            status: true, 
            data: {
                system: getSystemInfo(),
                settings: getSettings()
            }
        });
    } catch {
        return NextResponse.json({ status: false, message: message.api.serverError }, { status: 500 });
    }
}

//==================
export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "owner") {
        return NextResponse.json({ status: false, message: message.auth.denied }, { status: 403 });
    }

    try {
        const contentType = req.headers.get("content-type");
        
        // Handle file upload for db_import
        if (contentType?.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get("file") as File;
            if (!file) return NextResponse.json({ status: false, message: message.file.missing }, { status: 400 });

            const tempPath = path.join(process.cwd(), `src/system/database/import_temp_${Date.now()}.db`);
            const buffer = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(tempPath, buffer);

            try {
                const importDb = new (await import("better-sqlite3")).default(tempPath);
                
                // Merge logic: Import users that don't exist
                const users = importDb.prepare("SELECT * FROM users").all();
                let imported = 0;
                let skipped = 0;

                const insertUser = db.prepare(`
                    INSERT INTO users (username, password, role, apikey, lastReset, \`limit\`, whitelistIp, isRoot, createdAt, premiumStatus, coins, coinHistory, missions, activity)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                for (const user of users as any[]) {
                    const exists = db.prepare("SELECT username FROM users WHERE username = ?").get(user.username);
                    if (!exists) {
                        insertUser.run(
                            user.username, user.password, user.role, user.apikey, user.lastReset, 
                            user.limit, user.whitelistIp, user.isRoot, user.createdAt, 
                            user.premiumStatus, user.coins, user.coinHistory, user.missions, user.activity
                        );
                        imported++;
                    } else {
                        skipped++;
                    }
                }

                importDb.close();
                await fs.remove(tempPath);

                return NextResponse.json({ 
                    status: true, 
                    message: message.db.importSuccess,
                    data: { imported, skipped }
                });
            } catch (e: any) {
                if (fs.existsSync(tempPath)) await fs.remove(tempPath);
                return NextResponse.json({ status: false, message: message.db.importFail, error: e.message }, { status: 500 });
            }
        }

        const body = await req.json();
        const { action, key, value } = body;

        if (action === "update_setting") {
            if (!key) return NextResponse.json({ status: false, message: message.input.missing }, { status: 400 });
            updateSetting(key, value);
            return NextResponse.json({ status: true, message: message.status.updated });
        }

        if (action === "db_backup") {
            const dbPath = path.join(process.cwd(), "src/system/database/database.db");
            const backupPath = path.join(process.cwd(), `src/system/database/backup_${Date.now()}.db`);
            await fs.copy(dbPath, backupPath);
            return NextResponse.json({ status: true, message: message.system.backupCreated });
        }

        return NextResponse.json({ status: false, message: message.input.invalid }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ status: false, message: e.message || message.api.serverError }, { status: 500 });
    }
}
