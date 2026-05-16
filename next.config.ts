import { NextConfig } from 'next';

const nextConfig: NextConfig = {
devIndicators: {
appIsrStatus: false,
},
allowedDevOrigins: [''],
env: {
//===============
NEXTAUTH_SECRET: "Kagenonchalant-Zqwis-Apis", //session encryption
RATE_MAX_REQUESTS: "100,10000", // Global: 80 req per 10s
API_MAX_REQUESTS: "40,10000", // API: 40 req per 10s
//===============
OWNER_USER: "kage", //own username
OWNER_PASS: "123", //own password
OWNER_APIKEY: "Kagenonchalant", // own apikey
//===============
GLOBAL_APIKEY: "Zqwis_", //apikey prefix
LIMIT_USER: "10", //Default limit Users
LIMIT_ADMIN: "1000", //Default limit Admins
LIMIT_RESET_TIME: "3600000", //Reset interval (1 hour)
AUTO_RESET_LIMIT: "true", //auto-reset
LIMIT_IP_USER: "3", //Max whitelisted IPs for Users
LIMIT_IP_ADMIN: "10" //Max whitelisted IPs for Admins
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
