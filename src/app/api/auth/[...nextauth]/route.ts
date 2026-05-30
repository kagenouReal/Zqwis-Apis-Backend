import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { readDB } from "@/system/lib/db"; 
import { NextRequest } from "next/server";

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
apikey: process.env.OWNER_APIKEY || "MyOwner" 
};
}
const users = await readDB(); 
const user = users.find(
(u: any) => u.username === credentials.username && u.password === credentials.password
);
if (user) {
return { 
id: user.username, 
name: user.username, 
role: user.role || "user",
apikey: user.apikey 
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
}
if (token.name && token.name !== process.env.OWNER_USER) {
const users = await readDB();
const stillAlive = users.find((u: any) => u.username === token.name);
if (!stillAlive) {
token.isDead = true; 
} else {
token.apikey = stillAlive.apikey;
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
const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
const protocol = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") || host?.includes("0.0.0.0") ? "http" : "https");
if (host) {
process.env.NEXTAUTH_URL = `${protocol}://${host}`;
}
return authHandler(req, ctx);
};

export { handler as GET, handler as POST };
