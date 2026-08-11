import { redirect } from "next/navigation";

export default async function LegacyResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/redefinir-senha?token=${encodeURIComponent(token)}`);
}
