import { NextConfig } from 'next';

const nextConfig: NextConfig = {
devIndicators: {
appIsrStatus: false,
},
allowedDevOrigins: ['10.119.131.76'],
env: {
// Auth Settings
NEXTAUTH_URL: "http://0.0.0.0:8080", // Site base URL
NEXTAUTH_SECRET: "Kagenonchalant-Zqwis-Apis", // Secret for session encryption
OWNER_USER: "kage", // Master username
OWNER_PASS: "123", // Master password
OWNER_APIKEY: "Kagenonchalant", // Master key (Unlimited access)

// Protection Rates [MaxRequests, WindowMs]
RATE_MAX_REQUESTS: "100,10000", // Global: 80 req per 10s
API_MAX_REQUESTS: "40,10000", // API: 40 req per 10s

// User Limits & DB
GLOBAL_APIKEY: "Zqwis_", // Generated key prefix
LIMIT_USER: "10", // Default limit for Users
LIMIT_ADMIN: "1000", // Default limit for Admins
LIMIT_RESET_TIME: "3600000", // Reset interval (1 hour)
AUTO_RESET_LIMIT: "true", // Enable auto-reset
LIMIT_IP_USER: "3", // Max whitelisted IPs for Users
LIMIT_IP_ADMIN: "10" // Max whitelisted IPs for Admins
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
