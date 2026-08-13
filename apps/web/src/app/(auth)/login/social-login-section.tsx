import { faGithub, faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
            <FontAwesomeIcon icon={faGithub} className="size-4" />
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
            <FontAwesomeIcon icon={faGoogle} className="size-4" />
            Continuar com Google
          </span>
        </ZenButton>
      ) : null}
    </div>
  );
}
