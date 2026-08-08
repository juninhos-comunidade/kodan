import Link from "next/link";
import { MailWarning } from "lucide-react";

import { Button } from "@/components/button";

export default function RecuperarSenhaPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-amber-100">
          <MailWarning className="size-8 text-amber-700" aria-hidden="true" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Recuperação por e-mail indisponível
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          O Kodan ainda não envia links de recuperação. Esta tela não confirmará
          uma operação que não aconteceu.
        </p>
      </div>
      <Link href="/login">
        <Button variant="outline" className="w-full text-black/80">
          Voltar ao login
        </Button>
      </Link>
    </div>
  );
}
