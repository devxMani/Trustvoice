// lib/auth.ts — NextAuth v5 configuration
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import ResendProvider from "next-auth/providers/resend";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // Magic link via Resend (or Nodemailer)
    ResendProvider({
      from: process.env.EMAIL_FROM ?? "noreply@trustvoice.app",
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-request",
  },
  events: {
    async createUser({ user }) {
      // Auto-create profile on first sign-in
      if (user.id) {
        await prisma.profile.create({
          data: { userId: user.id },
        });
      }
    },
  },
});

// Extend the Session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
