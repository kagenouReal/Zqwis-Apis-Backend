import { readDB, writeDB } from "@/system/lib/db";

export async function addCoins(username: string, amount: number, reason: string = "Unknown") {
  try {
    const users = await readDB();
    const userIndex = users.findIndex((u: { username: string }) => u.username === username);
    
    if (userIndex === -1) return { status: false, error: "User not found" };
    
    if (!users[userIndex].coins) {
      users[userIndex].coins = { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() };
    }
    
    users[userIndex].coins.total += amount;
    users[userIndex].coins.earned += amount;
    users[userIndex].coins.lastUpdated = Date.now();
    
    if (!users[userIndex].coinHistory) users[userIndex].coinHistory = [];
    users[userIndex].coinHistory.push({
      type: "earn",
      amount,
      reason,
      timestamp: Date.now(),
    });
    
    await writeDB(users);
    return { status: true, coins: users[userIndex].coins };
  } catch (e: unknown) {
    return { status: false, error: (e as Error).message };
  }
}

export async function spendCoins(username: string, amount: number, reason: string = "Unknown") {
  try {
    const users = await readDB();
    const userIndex = users.findIndex((u: { username: string }) => u.username === username);
    
    if (userIndex === -1) return { status: false, error: "User not found" };
    
    if (!users[userIndex].coins) {
      users[userIndex].coins = { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() };
    }
    
    if (users[userIndex].coins.total < amount) {
      return { status: false, error: "Insufficient coins" };
    }
    
    users[userIndex].coins.total -= amount;
    users[userIndex].coins.spent += amount;
    users[userIndex].coins.lastUpdated = Date.now();
    
    if (!users[userIndex].coinHistory) users[userIndex].coinHistory = [];
    users[userIndex].coinHistory.push({
      type: "spend",
      amount,
      reason,
      timestamp: Date.now(),
    });
    
    await writeDB(users);
    return { status: true, coins: users[userIndex].coins };
  } catch (e: unknown) {
    return { status: false, error: (e as Error).message };
  }
}

export async function getCoins(username: string) {
  try {
    const users = await readDB();
    const user = users.find((u: { username: string }) => u.username === username);
    
    if (!user) return { status: false, error: "User not found" };
    
    return {
      status: true,
      coins: user.coins || { total: 0, earned: 0, spent: 0, lastUpdated: Date.now() },
    };
  } catch (e: unknown) {
    return { status: false, error: (e as Error).message };
  }
}

export async function isPremium(username: string) {
  try {
    const users = await readDB();
    const user = users.find((u: { username: string }) => u.username === username);
    
    if (!user) return { status: false };
    
    const premiumStatus = user.premiumStatus || {
      isPremium: false,
      premiumType: null,
      premiumExpiry: null,
      startDate: null,
    };
    
    if (premiumStatus.isPremium && premiumStatus.premiumExpiry) {
      if (Date.now() > premiumStatus.premiumExpiry) {
        return { status: true, isPremium: false, reason: "expired" };
      }
    }
    
    return {
      status: true,
      isPremium: premiumStatus.isPremium,
      type: premiumStatus.premiumType,
      expiry: premiumStatus.premiumExpiry,
    };
  } catch (e: unknown) {
    return { status: false, error: (e as Error).message };
  }
}

export async function buyPremium(username: string, packageType: "7day" | "30day" | "permanent") {
  try {
    const PREMIUM_PACKAGES: Record<string, { duration: number, coinsRequired: number }> = {
      "7day": {
        duration: 7 * 24 * 60 * 60 * 1000,
        coinsRequired: 500,
      },
      "30day": {
        duration: 30 * 24 * 60 * 60 * 1000,
        coinsRequired: 1500,
      },
      permanent: {
        duration: Infinity,
        coinsRequired: 5000,
      },
    };
    
    const pkg = PREMIUM_PACKAGES[packageType];
    if (!pkg) return { status: false, error: "Invalid package type" };
    
    const coinCheck = await getCoins(username);
    if (!coinCheck.status || coinCheck.coins.total < pkg.coinsRequired) {
      return { status: false, error: "Insufficient coins" };
    }
    
    const spendResult = await spendCoins(username, pkg.coinsRequired, `Premium ${packageType}`);
    if (!spendResult.status || !spendResult.coins) return spendResult;
    
    const users = await readDB();
    const userIndex = users.findIndex((u: { username: string }) => u.username === username);
    
    if (!users[userIndex].premiumStatus) {
      users[userIndex].premiumStatus = {};
    }
    
    const now = Date.now();
    users[userIndex].premiumStatus = {
      isPremium: true,
      premiumType: packageType,
      premiumExpiry: pkg.duration === Infinity ? null : now + pkg.duration,
      startDate: now,
    };
    
    if (!users[userIndex].missions) users[userIndex].missions = { completed: [] };
    if (!users[userIndex].missions.completed.includes("first_premium")) {
      users[userIndex].missions.completed.push("first_premium");
      await addCoins(username, 500, "Achievement: First Premium");
    }
    
    await writeDB(users);
    
    return {
      status: true,
      premium: users[userIndex].premiumStatus,
      coinsLeft: spendResult.coins.total,
    };
  } catch (e: unknown) {
    return { status: false, error: (e as Error).message };
  }
}

export async function getPremiumStatus(username: string) {
  try {
    const users = await readDB();
    const user = users.find((u: { username: string }) => u.username === username);
    
    if (!user) return { status: false, error: "User not found" };
    
    const premiumStatus = user.premiumStatus || {
      isPremium: false,
      premiumType: null,
      premiumExpiry: null,
      startDate: null,
    };
    
    let daysLeft = null;
    if (premiumStatus.isPremium && premiumStatus.premiumExpiry) {
      daysLeft = Math.ceil((premiumStatus.premiumExpiry - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysLeft < 0) {
        return { status: true, isPremium: false, reason: "expired" };
      }
    }
    
    return {
      status: true,
      isPremium: premiumStatus.isPremium,
      type: premiumStatus.premiumType,
      daysLeft,
      expiry: premiumStatus.premiumExpiry,
      startDate: premiumStatus.startDate,
    };
  } catch (e: unknown) {
    return { status: false, error: (e as Error).message };
  }
}

export async function checkMission(username: string, missionId: string) {
  try {
    const users = await readDB();
    const userIndex = users.findIndex((u: { username: string }) => u.username === username);
    
    if (userIndex === -1) return { status: false, error: "User not found" };
    
    if (!users[userIndex].missions) {
      users[userIndex].missions = { completed: [] };
    }
    
    return {
      status: true,
      completed: users[userIndex].missions.completed.includes(missionId),
    };
  } catch (e: unknown) {
    return { status: false, error: (e as Error).message };
  }
}

export async function completeMission(username: string, missionId: string, reward: number = 0) {
  try {
    const users = await readDB();
    const userIndex = users.findIndex((u: { username: string }) => u.username === username);
    
    if (userIndex === -1) return { status: false, error: "User not found" };
    
    if (!users[userIndex].missions) {
      users[userIndex].missions = { completed: [] };
    }
    
    if (users[userIndex].missions.completed.includes(missionId)) {
      return { status: false, error: "Mission already completed" };
    }
    
    users[userIndex].missions.completed.push(missionId);
    
    if (reward > 0) {
      await addCoins(username, reward, `Mission: ${missionId}`);
    }
    
    await writeDB(users);
    
    return { status: true, reward };
  } catch (e: unknown) {
    return { status: false, error: (e as Error).message };
  }
}

export async function getMissions(username: string) {
  try {
    const users = await readDB();
    const user = users.find((u: { username: string }) => u.username === username);
    
    if (!user) return { status: false, error: "User not found" };
    
    return {
      status: true,
      missions: user.missions || { completed: [] },
    };
  } catch (e: unknown) {
    return { status: false, error: (e as Error).message };
  }
}
