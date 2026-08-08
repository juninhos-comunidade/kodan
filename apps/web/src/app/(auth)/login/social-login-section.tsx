import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button } from "@/components/button";

export function SocialLoginSection({
  githubEnabled,
  onSignIn,
}: {
  githubEnabled: boolean;
  onSignIn: () => void;
}) {
  if (!githubEnabled) return null;

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-400">ou continue com</span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onSignIn}
      >
        <FontAwesomeIcon
          icon={faGithub}
          className="mr-2 size-4 text-zinc-500"
        />
        <span className="text-black/60">Entrar com GitHub</span>
      </Button>
    </>
  );
}
