import { Terminal } from "lucide-react";

import { AUTH_PROMISE } from "@/content/public-promises";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Painel esquerdo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-[#2DADB9] via-[#2E6E99] to-[#314083] p-12 text-white">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm">
            <Terminal className="h-6 w-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-wide">
              KODAN
            </h1>

            <p className="text-sm text-cyan-100">
              {AUTH_PROMISE.tagline}
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8">
          <h2 className="max-w-lg text-5xl font-bold leading-tight">
            {AUTH_PROMISE.title}
          </h2>

          <p className="max-w-xl text-lg leading-8 text-cyan-100">
            {AUTH_PROMISE.description}
          </p>

        </div>

        <p className="text-sm text-cyan-100/80">
          © {new Date().getFullYear()} Kodan · {AUTH_PROMISE.footer}
        </p>
      </div>

      {/* Painel direito */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2DADB9] via-[#2E6E99] to-[#314083]">
              <Terminal className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="text-xl font-bold tracking-wide text-[#314083]">
                KODAN
              </p>

              <p className="text-xs text-slate-500">
                {AUTH_PROMISE.tagline}
              </p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
