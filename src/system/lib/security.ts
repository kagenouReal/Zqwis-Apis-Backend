import crypto from "crypto";

// Gak pake fallback string rahasia lagi, biar ketahuan kalau .env kosong
const SECRET = process.env.LOGIN_SECRET;

// Sistem Dua Ember
let currentBucket = new Set<string>();
let oldBucket = new Set<string>();
let lastRotationTime = Date.now();

export function verifyLoginHash(ts: string | null, auth: string | null) {
    if (!ts || !auth) return false;

    // Warning kalau SECRET belum di-set di .env
    if (!SECRET) {
        console.warn("[SECURITY ERROR] LOGIN_SECRET is undefined! Please check your .env file.");
        return false;
    }

    const now = Date.now();

    // LAZY ROTATION
    if (now - lastRotationTime > 60000) {
        oldBucket = currentBucket;
        currentBucket = new Set<string>();
        lastRotationTime = now;
    }

    if (currentBucket.has(auth) || oldBucket.has(auth)) {
        return false;
    }

    const timestamp = parseInt(ts, 10);

    if (Math.abs(now - timestamp) > 60000) return false;

    const expectedHash = crypto.createHash("sha256").update(`${timestamp}${SECRET}`).digest("hex");
    const isValid = auth === expectedHash;

    if (isValid) {
        currentBucket.add(auth);
    }

    return isValid;
}
