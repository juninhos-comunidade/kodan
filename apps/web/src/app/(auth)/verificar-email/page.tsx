import Link from "next/link";
import { MailQuestion } from "lucide-react";

import { Button } from "@/components/button";

export default function VerificarEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-amber-100">
          <MailQuestion className="size-8 text-amber-700" aria-hidden="true" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Verificação por e-mail indisponível
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          O Kodan não envia mensagens de verificação nesta configuração. Se
          você já possui uma conta, tente entrar por um fluxo disponível.
        </p>
      </div>
      <Link href="/login">
        <Button className="w-full">Entrar no Kodan</Button>
      </Link>
    </div>
  );
}
