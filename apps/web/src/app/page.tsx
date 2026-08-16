import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Kodan | Dojo de diagnóstico de código",
  description: "Pratique leitura, diagnóstico e explicação de código.",
};

export default function HomePage(): never {
  redirect("/inicio");
}
