const fallbackUrl = "http://localhost:3001";

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_URL ||
    process.env.BETTER_AUTH_URL ||
    fallbackUrl,
);
