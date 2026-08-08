import { authEmailDeliveryConfigured } from "@kodan/auth";

import { VerificationEmailForm } from "./verification-email-form";

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error = null } = await searchParams;
  return (
    <VerificationEmailForm
      enabled={authEmailDeliveryConfigured}
      initialError={error}
    />
  );
}
