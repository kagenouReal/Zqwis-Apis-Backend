import { NextConfig } from 'next';

const nextConfig: NextConfig = {
devIndicators: {
appIsrStatus: false,
},
allowedDevOrigins: [''],
env: {
//===============
NEXTAUTH_SECRET: "Kagenonchalant-Zqwis-Apis",
RATE_MAX_REQUESTS: "100,10000",
API_MAX_REQUESTS: "40,10000",
//===============
OWNER_USER: "kage",
OWNER_PASS: "123",
OWNER_APIKEY: "Kagenonchalant",
//===============
GLOBAL_APIKEY: "Zqwis_",
LIMIT_USER: "10",
LIMIT_ADMIN: "1000",
LIMIT_RESET_TIME: "3600000",
AUTO_RESET_LIMIT: "true",
LIMIT_IP_USER: "3",
LIMIT_IP_ADMIN: "10",
//===============
ENABLE_CRON: "true", // ubah jadi "true" kalau mau aktif
// Initial coins untuk user baru
INITIAL_COINS: "50",
// Welcome bonus untuk setiap new registration
WELCOME_BONUS: "50",
// Daily login bonus
DAILY_LOGIN_BONUS: "10",
// API call reward (coins per 10 calls)
API_CALL_REWARD_INTERVAL: "10",
API_CALL_REWARD_AMOUNT: "5",
//===============
// Premium 7 hari
PREMIUM_7DAY_COINS: "500",
PREMIUM_7DAY_LIMIT: "1000",
// Premium 30 hari
PREMIUM_30DAY_COINS: "1500",
PREMIUM_30DAY_LIMIT: "5000",
// Premium Permanen
PREMIUM_PERMANENT_COINS: "5000",
PREMIUM_PERMANENT_LIMIT: "UNLIMITED",
//===============
// Enable/disable mission system
ENABLE_MISSIONS: "true",
// Reset daily missions at (hour, 0-23)
DAILY_MISSIONS_RESET_HOUR: "0",
// Max daily missions claimable per day
MAX_DAILY_MISSIONS: "3",
//===============
// Track user login streaks
ENABLE_ACTIVITY_TRACKING: "true",
// Bonus coins untuk login streak
LOGIN_STREAK_BONUS: "50",
LOGIN_STREAK_TARGET: "7",
//===============
},
reactStrictMode: true,
experimental: {
serverActions: {},
},
images: {
unoptimized: true,
},
};

export default nextConfig;
