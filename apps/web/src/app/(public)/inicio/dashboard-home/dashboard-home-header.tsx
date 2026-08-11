import Image from "next/image";
import Link from "next/link";

import { useSession } from "@/hooks/use-session";
import { useRouter } from "next/navigation";
import { KodanLogo } from "@/components/kodan-logo";

type DashboardHomeHeaderProps = {
  userName: string;
  userImage: string | null;
};

function getFirstName(userName: string) {
  return userName.trim().split(/\s+/)[0] || "Kodan";
}

function getInitials(userName: string) {
  return userName
    .split(" ")
    .flatMap((part) => (part[0] ? [part[0]] : []))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DashboardHomeHeader({ userName, userImage }: DashboardHomeHeaderProps) {
  const session = useSession();

  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 flex min-h-28 items-center justify-between gap-5 bg-[var(--dojo-page)] px-5 pl-16 sm:px-8 lg:px-12">
      <div className="flex items-center gap-4">
        <div className="hidden sm:block"><KodanLogo markOnly size="lg" /></div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dojo-accent)]">{session ? "Seu dojo" : "Prática aberta"}</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-[var(--dojo-ink)] sm:text-3xl">{session ? `Bem-vindo ao Dojo, ${getFirstName(userName)}!` : "Comece seu primeiro diagnóstico"}</h1>
          <p className="mt-1 hidden text-sm text-[var(--dojo-muted)] sm:block">{session ? "Sua jornada de excelência continua aqui." : "Experimente um desafio antes de criar sua conta."}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-7">
        {session ? (
          <>
            <Link href="/perfil" aria-label="Abrir perfil" className="grid size-11 place-items-center overflow-hidden rounded-full bg-[var(--dojo-avatar)] text-xs font-bold text-[var(--dojo-ink)]">
          {userImage ? <Image src={userImage} alt="" width={44} height={44} unoptimized className="size-full object-cover" /> : getInitials(userName)}
        </Link>
        </>) : 
        (<>
        <div className="flex flex-row gap-3 w-fit">
          <button className="bg-blue-500 rounded w-auto shadow-2xs px-4 py-2 cursor-pointer font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-white hover:text-blue-500 hover:shadow-md" onClick={() => router.push('/cadastro')}>Cadastrar</button>
          <button className="bg-blue-500 rounded w-auto shadow-2xs px-4 py-2 cursor-pointer font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-white hover:text-blue-500 hover:shadow-md" onClick={() => router.push('/login')}>Entrar</button>
        </div>
        </>)}
        
      </div>
    </header>
  );
}
