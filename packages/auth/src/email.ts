export type AuthEmailMessage = {
  to: string;
  subject: string;
  text: string;
};

type AuthEmailDelivery = AuthEmailMessage & { from: string };

export function createAuthEmailSender({
  from,
  send,
}: {
  from?: string;
  send?: (message: AuthEmailDelivery) => Promise<{
    error?: { message?: string } | null;
  }>;
}) {
  return async (message: AuthEmailMessage) => {
    if (!from || !send) {
      throw new Error("Entrega de e-mail não configurada");
    }
    const result = await send({ from, ...message });
    if (result.error) {
      throw new Error(result.error.message || "Falha ao entregar e-mail");
    }
  };
}

type AuthFlowUser = { email: string; name: string };
type AuthFlowEmailData = { user: AuthFlowUser; url: string };

export function buildAuthEmailOptions(
  sendAuthEmail: ((message: AuthEmailMessage) => Promise<void>) | null,
) {
  const baseEmailAndPassword = {
    enabled: true as const,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
  };
  if (!sendAuthEmail) {
    return {
      emailAndPassword: {
        ...baseEmailAndPassword,
        requireEmailVerification: false,
      },
    };
  }

  const dispatchEmail = (message: AuthEmailMessage) => {
    void sendAuthEmail(message).catch((error: unknown) => {
      console.error("[auth-email] delivery failed", error);
    });
  };
  return {
    emailAndPassword: {
      ...baseEmailAndPassword,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }: AuthFlowEmailData) => {
        dispatchEmail({
          to: user.email,
          subject: "Redefina sua senha no Kodan",
          text: `Olá, ${user.name}. Use este link seguro para redefinir sua senha: ${url}`,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }: AuthFlowEmailData) => {
        dispatchEmail({
          to: user.email,
          subject: "Confirme seu e-mail no Kodan",
          text: `Olá, ${user.name}. Confirme seu e-mail usando este link seguro: ${url}`,
        });
      },
    },
  };
}
