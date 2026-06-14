import crypto from "crypto";

const SECRET = process.env.LOGIN_SECRET || "Zqwis_Login_Kagenonchalant";

export function verifyLoginHash(ts: string | null, auth: string | null) {
    if (!ts || !auth) return false;
    const timestamp = parseInt(ts, 10);
    const now = Date.now();
    if (Math.abs(now - timestamp) > 120000) return false;
    const expectedHash = crypto.createHash("sha256").update(`${timestamp}${SECRET}`).digest("hex");
    return auth === expectedHash;
}
