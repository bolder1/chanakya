import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe minimal NextAuth config. Used by middleware.ts to do
 * route protection at the edge without pulling in bcrypt or Prisma.
 * The full config in lib/auth.ts extends this with the Credentials
 * provider and the runtime user lookup.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours — a workday
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;

      // Public routes — anyone can hit
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico";

      if (isPublic) {
        // If already logged in and visiting /login, bounce to dashboard
        if (isLoggedIn && pathname.startsWith("/login")) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; role: string; team: string | null };
        token.id = u.id;
        token.role = u.role;
        token.team = u.team;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const t = token as { id?: string; role?: string; team?: string | null };
        (session.user as { id: string }).id = t.id ?? "";
        (session.user as { role: string }).role = t.role ?? "LEADERSHIP_RO";
        (session.user as { team: string | null }).team = t.team ?? null;
      }
      return session;
    },
  },
  providers: [], // populated in lib/auth.ts
};
