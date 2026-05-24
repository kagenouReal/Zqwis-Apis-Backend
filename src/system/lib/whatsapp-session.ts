import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs-extra";

const SESSIONS_DIR = path.join(process.cwd(), "baileys_sessions");
const SESSIONS_DB = path.join(process.cwd(), "src/system/database/wa-sessions.json");

if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
if (!fs.existsSync(SESSIONS_DB)) fs.writeFileSync(SESSIONS_DB, JSON.stringify([], null, 2));

interface SessionData {
  username: string;
  phoneNumber: string;
  connected: boolean;
  pairingCode?: string;
  connectedAt?: number;
}

// Map untuk menampung banyak bot yang sedang aktif secara bersamaan
const activeSockets = new Map<string, any>();

function loadSessions(): SessionData[] {
  try {
    return JSON.parse(fs.readFileSync(SESSIONS_DB, "utf8"));
  } catch {
    return [];
  }
}

function saveSessions(sessions: SessionData[]) {
  fs.writeFileSync(SESSIONS_DB, JSON.stringify(sessions, null, 2));
}

export async function createSession(username: string, phoneNumber: string) {
  const sessionId = `session_${username}`;
  // Setiap user punya folder session sendiri, tidak bercampur!
  const sessionPath = path.join(SESSIONS_DIR, sessionId);

  if (activeSockets.has(sessionId)) {
    return { status: false, error: "Session bot ini sudah berjalan" };
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  // Bersihkan format nomor HP (hanya angka)
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  const socket = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"], // Mengikuti standard bot kamu
  });

  activeSockets.set(sessionId, socket);

  let pairingCode: string | undefined = undefined;

  // JIKA BELUM REGISTERED, MINTA PAIRING CODE DARI SERVER WHATSAPP
  if (!socket.authState.creds.registered) {
    try {
      // Delay sedikit agar socket benar-benar siap
      await new Promise((resolve) => setTimeout(resolve, 3000));
      pairingCode = await socket.requestPairingCode(cleanPhone);
      console.log(`[WA] Pairing Code untuk ${username} (${cleanPhone}): ${pairingCode}`);
    } catch (err) {
      console.error(`[WA] Gagal generate pairing code untuk ${username}:`, err);
      activeSockets.delete(sessionId);
      return { status: false, error: "Gagal meminta pairing code dari WhatsApp" };
    }
  }

  // Handle Event Koneksi & Reconnect Otomatis per Bot
  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      console.log(`[WA] Sesi ${username} terputus. Alasan: ${reason}`);

      if (reason === DisconnectReason.loggedOut) {
        deleteSession(username);
      } else {
        // Auto-reconnect khusus untuk bot user ini saja setelah 5 detik
        setTimeout(() => {
          activeSockets.delete(sessionId);
          createSession(username, phoneNumber);
        }, 5000);
      }
    } else if (connection === "open") {
      console.log(`[WA] Bot WhatsApp Sukses Terhubung: ${username}`);

      const sessions = loadSessions();
      const idx = sessions.findIndex((s) => s.username === username);

      if (idx !== -1) {
        sessions[idx].connected = true;
        sessions[idx].connectedAt = Date.now();
        delete sessions[idx].pairingCode;
        saveSessions(sessions);
      }
      
      // Di sini kamu bisa panggil handler pesan (command handler) milik bot kamu
      // Contoh: require('./path/to/whatsapp')(socket, ...);
    }
  });

  socket.ev.on("creds.update", saveCreds);

  // Simpan status sesi ke database JSON lokal
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.username === username);
  const sessionPayload: SessionData = {
    username,
    phoneNumber: cleanPhone,
    connected: false,
    pairingCode,
  };

  if (idx === -1) {
    sessions.push(sessionPayload);
  } else {
    sessions[idx] = { ...sessions[idx], ...sessionPayload };
  }
  saveSessions(sessions);

  return { status: true, sessionId, pairingCode };
}

export function getSession(username: string) {
  const sessions = loadSessions();
  return sessions.find((s) => s.username === username) || null;
}

export function deleteSession(username: string) {
  const sessionId = `session_${username}`;
  const socket = activeSockets.get(sessionId);

  if (socket) {
    try { socket.end(); } catch {}
    activeSockets.delete(sessionId);
  }

  const sessionPath = path.join(SESSIONS_DIR, sessionId);
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  }

  const sessions = loadSessions();
  const filtered = sessions.filter((s) => s.username !== username);
  saveSessions(filtered);

  return true;
}

export function getAllSessions() {
  return loadSessions();
}

export function getMaxSessions(role: string): number {
  if (role === "owner") return 999;
  if (role === "admin") return 5;
  if (role === "premium") return 3; // Tambah tier premium biar sinkron sama fitur premium mu
  return 1;
}
