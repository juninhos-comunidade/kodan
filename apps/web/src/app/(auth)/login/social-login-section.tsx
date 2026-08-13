import { Github } from "lucide-react";

import { ZenButton } from "@kodan/ui/components/zen";

export function SocialLoginSection({
  githubEnabled,
  googleEnabled,
  onSignIn,
}: {
  githubEnabled: boolean;
  googleEnabled: boolean;
  onSignIn: (provider: "github" | "google") => void;
}) {
  if (!githubEnabled && !googleEnabled) return null;

  return (
    <div className="space-y-3">
      {githubEnabled ? (
        <ZenButton
          type="button"
          variant="washi"
          className="w-full justify-start py-3"
          onClick={() => onSignIn("github")}
        >
          <span className="inline-flex items-center gap-3">
            <Github className="size-4" />
            Continuar com GitHub
          </span>
        </ZenButton>
      ) : null}
      {googleEnabled ? (
        <ZenButton
          type="button"
          variant="washi"
          aria-label="Continuar com Google"
          className="w-full justify-start py-3"
          onClick={() => onSignIn("google")}
        >
          <span className="inline-flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-4 place-items-center rounded-full border border-current font-mono text-[0.6rem] font-bold"
            >
              G
            </span>
            Continuar com Google
          </span>
        </ZenButton>
      ) : null}
    </div>
  );
}
