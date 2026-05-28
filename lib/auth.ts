import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { loggerFor } from "@/lib/log";
import { authConfig } from "@/lib/auth.config";
import type { Role } from "@prisma/client";

const log = loggerFor("auth");

// ---------------------------------------------------------------------------
// Session augmentation — adds role + team + id to session.user
// ---------------------------------------------------------------------------

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      team: string | null;
    } & DefaultSession["user"];
  }
}

// ---------------------------------------------------------------------------
// Full auth setup — Credentials provider + bcrypt + Prisma lookup
// ---------------------------------------------------------------------------

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(raw);

        if (!parsed.success) {
          log.warn({ reason: "schema" }, "credentials.authorize.fail");
          return null;
        }
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            team: true,
            passwordHash: true,
            active: true,
          },
        });

        if (!user || !user.active || !user.passwordHash) {
          log.warn({ email, reason: "no_user_or_no_password" }, "credentials.authorize.fail");
          return null;
        }

        const ok = await compare(password, user.passwordHash);
        if (!ok) {
          log.warn({ email, reason: "bad_password" }, "credentials.authorize.fail");
          return null;
        }

        // Fire-and-forget lastLoginAt update
        prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch((err) => log.error({ err, userId: user.id }, "lastLoginAt.update.fail"));

        log.info({ userId: user.id, role: user.role }, "credentials.authorize.ok");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          team: user.team,
        };
      },
    }),
  ],
  logger: {
    error(error) {
      log.error({ err: error }, "next-auth.error");
    },
    warn(code) {
      log.warn({ code }, "next-auth.warn");
    },
    debug() {
      /* silent */
    },
  },
});
