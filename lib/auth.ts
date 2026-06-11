import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"

import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL,
    }),
  ],
  session: {
    strategy: "database",
  },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login?verify=1",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, role: true },
      })

      return Boolean(existingUser && existingUser.role !== "REVOKED")
    },
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, username: true, avatarUrl: true },
      })

      if (dbUser) {
        session.user.role = dbUser.role
        session.user.username = dbUser.username
        session.user.avatarUrl = dbUser.avatarUrl
      }

      return session
    },
  },
})
