import { ResetPasswordForm } from "./reset-password-form";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token = null, error = null } = await searchParams;
  return <ResetPasswordForm token={token} error={error} />;
}
