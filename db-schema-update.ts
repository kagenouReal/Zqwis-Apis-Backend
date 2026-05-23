// User data structure yang sudah diupdate dengan Premium & Coin System
export interface UserProfile {
  // User Basic
  username: string;
  password: string;
  apikey: string;
  role: "owner" | "admin" | "user";
  createdAt: string;

  // Existing System
  limit: number;
  maxIpQuota: number;
  whitelistIp: string[];
  lastReset: number;

  // ===== NEW: PREMIUM SYSTEM =====
  premiumStatus: {
    isPremium: boolean;
    premiumType: "7day" | "30day" | "permanent" | null;
    premiumExpiry: number | null; // timestamp
    startDate: number; // timestamp
  };

  // ===== NEW: COIN SYSTEM =====
  coins: {
    total: number;
    earned: number;
    spent: number;
    lastUpdated: number;
  };

  // ===== NEW: ACTIVITY TRACKING =====
  activity: {
    lastLogin: number;
    loginStreak: number;
    totalLogins: number;
  };

  // ===== NEW: MISSIONS =====
  missions: {
    completed: string[]; // mission IDs
    inProgress: {
      missionId: string;
      progress: number;
      startedAt: number;
    }[];
    dailyMissions: {
      date: string;
      completed: number;
    }[];
  };
}

// Premium Package Configuration
export const PREMIUM_PACKAGES = {
  "7day": {
    name: "Premium 7 Hari",
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    coinsRequired: 500,
    features: {
      apiLimit: 1000,
      maxBots: 5,
      customTheme: true,
      prioritySupport: false,
    },
  },
  "30day": {
    name: "Premium 30 Hari",
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    coinsRequired: 1500,
    features: {
      apiLimit: 5000,
      maxBots: 20,
      customTheme: true,
      prioritySupport: true,
    },
  },
  permanent: {
    name: "Premium Permanent",
    duration: Infinity,
    coinsRequired: 5000,
    features: {
      apiLimit: "UNLIMITED",
      maxBots: "UNLIMITED",
      customTheme: true,
      prioritySupport: true,
    },
  },
};

// Mission Configuration
export const MISSIONS = {
  daily: [
    {
      id: "daily_login",
      name: "Login Harian",
      description: "Login ke sistem",
      reward: 10,
      type: "auto",
    },
    {
      id: "api_call_10",
      name: "API 10x",
      description: "Gunakan API 10 kali",
      reward: 50,
      type: "tracking",
      target: 10,
    },
    {
      id: "api_call_50",
      name: "API 50x",
      description: "Gunakan API 50 kali",
      reward: 100,
      type: "tracking",
      target: 50,
    },
  ],
  weekly: [
    {
      id: "weekly_login_5",
      name: "Konsisten 5 Hari",
      description: "Login 5 hari berturut-turut",
      reward: 200,
      type: "streak",
      target: 5,
    },
  ],
  permanent: [
    {
      id: "first_premium",
      name: "Premium Pertama",
      description: "Beli premium package pertama",
      reward: 500,
      type: "event",
    },
  ],
};
