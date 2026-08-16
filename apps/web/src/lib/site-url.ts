const fallbackUrl = "http://localhost:3001";
const configuredUrl =
  process.env.NEXT_PUBLIC_URL || process.env.BETTER_AUTH_URL || fallbackUrl;

export const siteUrl = resolveSiteUrl(configuredUrl);

function resolveSiteUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return new URL(fallbackUrl);
  }
}
