/* eslint-disable @typescript-eslint/no-explicit-any */
export const config = {
  owner: "601112260297", // Default owner from session folder name
  prefix: [".", "!", "/"],
  pairingcode: "12345678",
  usePairingCode: true,
};

(global as any).owner = config.owner;
(global as any).prefix = config.prefix;
(global as any).pairingcode = config.pairingcode;
(global as any).usePairingCode = config.usePairingCode;
(global as any).mess = {
  owner: "Khusus Owner!",
  wait: "Tunggu sebentar...",
  success: "Berhasil!",
  error: "Terjadi kesalahan!",
  wrong: "Format salah!",
};
