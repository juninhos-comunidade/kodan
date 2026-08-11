type SocialProviderCredentials = {
  githubClientId?: string;
  githubClientSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
};

export function buildSocialProviders(
  credentials: SocialProviderCredentials,
) {
  return {
    ...(credentials.githubClientId && credentials.githubClientSecret
      ? {
          github: {
            clientId: credentials.githubClientId,
            clientSecret: credentials.githubClientSecret,
          },
        }
      : {}),
    ...(credentials.googleClientId && credentials.googleClientSecret
      ? {
          google: {
            clientId: credentials.googleClientId,
            clientSecret: credentials.googleClientSecret,
          },
        }
      : {}),
  };
}
