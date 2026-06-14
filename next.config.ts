import { NextConfig } from 'next';

const nextConfig: NextConfig = {
devIndicators: {
appIsrStatus: false,
},
allowedDevOrigins: [''],
env: {
NEXTAUTH_SECRET: "Kagenonchalant-Zqwis-Apis",
LOGIN_SECRET: "Zqwis_Login_Kagenonchalant",
OWNER_USER: "kage",
OWNER_PASS: "123",
OWNER_APIKEY: "Kagenonchalant",
GLOBAL_APIKEY: "Zqwis_",

RATE_MAX_REQUESTS: "100,10000",
API_MAX_REQUESTS: "40,10000",
LIMIT_USER: "10",
LIMIT_PREMIUM: "100",
LIMIT_ADMIN: "1000",
LIMIT_IP_USER: "3",
LIMIT_IP_PREMIUM: "8",
LIMIT_IP_ADMIN: "10",

WA_GLOBAL_OWNER: "601112260297",
WA_PREFIX: ".🩲🗿/",
WA_PAIRINGCODE: "ZQWISBOT",
WA_MAXPAIRBOT_OWNER: "999",
WA_MAXPAIRBOT_ADMIN: "10",
WA_MAXPAIRBOT_PREMIUM: "3",
WA_MAXPAIRBOT_USER: "1",
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
