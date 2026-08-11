import { Suspense } from "react";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  const githubEnabled = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );

  return (
    <Suspense fallback={<div className="min-h-72" aria-label="Carregando login" />}>
      <LoginForm githubEnabled={githubEnabled} />
    </Suspense>
  );
}
