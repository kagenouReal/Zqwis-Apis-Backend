import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";
import { readDB, comparePassword, getUserByUsername, updateUserActivity, updateSessionToken } from "@/system/lib/account-db";
import { NextRequest, NextResponse } from "next/server";
import { verifyLoginHash } from "@/system/lib/security";

export const authOptions: NextAuthOptions = {
providers: [
CredentialsProvider({
name: "Credentials",
credentials: {
username: { label: "Username", type: "text" },
password: { label: "Password", type: "password" }
},
async authorize(credentials) {
if (!credentials?.username || !credentials?.password) return null;
if (
credentials.username === process.env.OWNER_USER &&
credentials.password === process.env.OWNER_PASS
) {
return {
id: "owner",
name: credentials.username,
role: "owner",
apikey: process.env.OWNER_APIKEY || "undefined"
};
}
const user = getUserByUsername(credentials.username);
if (user) {
    const isPasswordCorrect = await comparePassword(credentials.password, user.password);
    if (!isPasswordCorrect) return null;

    const activity = user.activity || { lastLogin: null, loginStreak: 0, totalLogins: 0, apiCalls: 0 };
    const now = Date.now();
    const today = new Date().toDateString();
    const lastLoginDate = activity.lastLogin ? new Date(activity.lastLogin).toDateString() : null;

    if (lastLoginDate !== today) {
        if (activity.lastLogin) {
            const yesterday = new Date(now - 86400000).toDateString();
            if (lastLoginDate === yesterday) {
                activity.loginStreak += 1;
            } else {
                activity.loginStreak = 1;
            }
        } else {
            activity.loginStreak = 1;
        }
        activity.lastLogin = now;
        activity.totalLogins += 1;
        updateUserActivity(user.username, activity);
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");
    updateSessionToken(user.username, sessionToken);

    return {
    id: user.username,
    name: user.username,
    role: user.role || "user",
    apikey: user.apikey,
    sessionToken: sessionToken
    };
}
return null;
}
})
],
callbacks: {
async jwt({ token, user }) {
if (user) {
token.role = (user as any).role;
token.name = user.name;
token.apikey = (user as any).apikey;
token.sessionToken = (user as any).sessionToken;
}
if (token.name && token.name !== process.env.OWNER_USER) {
const dbUser = getUserByUsername(token.name as string);
if (!dbUser || dbUser.sessionToken !== token.sessionToken) {
token.isDead = true;
} else {
token.apikey = dbUser.apikey;
}
}
return token;
},
async session({ session, token }) {
if (session.user) {
(session.user as any).role = token.role;
(session.user as any).isDead = token.isDead;
(session.user as any).apikey = token.apikey;
}
return session;
}
},
pages: {
signIn: "/",
},
session: {
strategy: "jwt",
},
secret: process.env.NEXTAUTH_SECRET,
};

const authHandler = NextAuth(authOptions);

const handler = async (req: NextRequest, ctx: any) => {
if (req.method === "POST" && req.nextUrl.pathname.includes("/callback/credentials")) {
    const ts = req.headers.get("x-zqwis-ts");
    const auth = req.headers.get("x-zqwis-auth");
    if (!verifyLoginHash(ts, auth)) {
        return NextResponse.json({ status: false, message: "Unauthorized UI detected." }, { status: 403 });
    }
}
const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
const protocol = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") || host?.includes("0.0.0.0") ? "http" : "https");
if (host) {
process.env.NEXTAUTH_URL = `${protocol}://${host}`;
}
return authHandler(req, ctx);
};
export { handler as GET, handler as POST };