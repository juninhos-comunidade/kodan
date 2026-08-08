import { createPrismaClient } from "@kodan/db";
import { env } from "@kodan/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { openAPI } from "better-auth/plugins";
import { Resend } from "resend";

import {
  buildAuthEmailOptions,
  createAuthEmailSender,
} from "./email";
import { buildSocialProviders } from "./social-providers";

export const authEmailDeliveryConfigured = Boolean(
  env.RESEND_API_KEY && env.AUTH_EMAIL_FROM,
);

function createConfiguredAuthEmailSender() {
  if (!env.RESEND_API_KEY || !env.AUTH_EMAIL_FROM) return null;
  const resend = new Resend(env.RESEND_API_KEY);
  return createAuthEmailSender({
    from: env.AUTH_EMAIL_FROM,
    send: (message) => resend.emails.send(message),
  });
}

export function createAuth() {
  const prisma = createPrismaClient();
  const emailOptions = buildAuthEmailOptions(
    createConfiguredAuthEmailSender(),
  );

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    trustedOrigins: [env.CORS_ORIGIN],
    ...emailOptions,
    session: {
      expiresIn: 60 * 60 * 24, // 1 dia (em segundos)
    },
    socialProviders: buildSocialProviders({
      githubClientId: process.env.GITHUB_CLIENT_ID,
      githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [nextCookies(), openAPI()],
  });
}

export const auth = createAuth();
