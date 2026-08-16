import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { KodanLogo } from "@/components/kodan-logo";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Saiba quais dados o Kodan trata, por que eles são usados e como exercer seus direitos.",
  alternates: { canonical: "/privacidade" },
};

const sections = [
  {
    title: "Quais dados tratamos",
    content: (
      <>
        <p>Conforme a funcionalidade utilizada, o Kodan pode tratar:</p>
        <ul>
          <li><strong>dados de conta:</strong> nome, e-mail, imagem de perfil, estado de verificação e credenciais protegidas;</li>
          <li><strong>dados de autenticação:</strong> sessões, provedor conectado e informações técnicas de segurança, como endereço IP e agente do navegador;</li>
          <li><strong>dados de treino:</strong> respostas, tentativas, feedback, pontuação, variação de ELO e datas da atividade;</li>
          <li><strong>preferências locais:</strong> tema, rascunhos e marcadores necessários para evitar eventos repetidos;</li>
          <li><strong>métricas agregadas:</strong> contagens de etapas do funil, faixas de tempo e saúde da avaliação. Esses agregados não armazenam e-mail, identificador de usuário ou conteúdo das respostas.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Por que usamos esses dados",
    content: (
      <>
        <p>Os dados são tratados para criar e proteger a conta, manter a sessão, salvar o progresso, avaliar diagnósticos, calcular o ELO, enviar mensagens operacionais e entender se a jornada do produto funciona.</p>
        <p>As bases aplicáveis podem incluir a execução do serviço solicitado, o legítimo interesse em segurança e melhoria do produto, o cumprimento de obrigações legais e o consentimento quando ele for exigido.</p>
      </>
    ),
  },
  {
    title: "GitHub e Google, além de outros operadores",
    content: (
      <>
        <p>Ao escolher GitHub ou Google, o provedor conduz a autenticação e compartilha com o Kodan os dados de perfil autorizados no fluxo. O uso desses serviços também está sujeito às políticas do próprio provedor.</p>
        <p>Para entregar o produto, podemos usar fornecedores de banco de dados e infraestrutura. Quando a avaliação automática está disponível, a resposta e o contexto técnico do desafio podem ser enviados ao provedor de modelos, sem incluir deliberadamente e-mail ou identificador da conta. Serviços de e-mail recebem o endereço e o conteúdo estritamente necessários para mensagens de conta.</p>
        <p>Alguns fornecedores podem processar dados fora do Brasil. Nesses casos, buscamos limitar o envio ao necessário para a finalidade informada e utilizar fornecedores com compromissos de proteção de dados.</p>
      </>
    ),
  },
  {
    title: "Cookies e armazenamento no navegador",
    content: (
      <p>Usamos cookies essenciais para autenticação e segurança. O armazenamento local ou de sessão pode guardar tema, rascunho do diagnóstico, data da primeira ativação e marcadores de deduplicação de métricas. Não usamos esses mecanismos para vender perfis de publicidade.</p>
    ),
  },
  {
    title: "Retenção e segurança",
    content: (
      <>
        <p>Dados de conta e treino permanecem enquanto forem necessários para manter o histórico do Praticante e prestar o serviço. Uma solicitação de exclusão será atendida quando aplicável, ressalvadas hipóteses legais de conservação, prevenção a fraude, exercício de direitos e proteção do histórico técnico.</p>
        <p>Aplicamos controles de acesso, conexão protegida, credenciais mantidas fora do código e redução das informações enviadas à telemetria. Nenhum sistema é completamente imune a incidentes; se um evento relevante ocorrer, adotaremos as medidas de contenção e comunicação aplicáveis.</p>
      </>
    ),
  },
  {
    title: "Seus direitos",
    content: (
      <>
        <p>Nos termos da LGPD, você pode solicitar confirmação do tratamento, acesso, correção, informações sobre compartilhamento, portabilidade quando regulamentada, oposição, revogação de consentimento e exclusão nos casos aplicáveis.</p>
        <p>Para proteger a conta, poderemos pedir informações suficientes para confirmar a identidade antes de atender uma solicitação. Não publique dados pessoais em issues ou fóruns públicos. Durante o piloto, use o canal privado informado pela equipe que concedeu seu acesso ao Kodan.</p>
        <p>
          Consulte também a página oficial da{" "}
          <a href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares" target="_blank" rel="noreferrer">
            ANPD sobre direitos dos titulares <ExternalLink className="inline size-3.5" aria-hidden="true" />
          </a>.
        </p>
      </>
    ),
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="min-h-svh bg-[oklch(96.5%_0.018_85)] text-[oklch(24%_0.018_70)] dark:bg-[oklch(17%_0.012_75)] dark:text-[oklch(92%_0.016_85)]">
      <header className="border-b border-[oklch(79%_0.025_80)] dark:border-[oklch(31%_0.014_75)]">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Kodan, página inicial"><KodanLogo wordmarkClassName="text-current" /></Link>
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs hover:underline hover:underline-offset-4">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>
      </header>

      <article className="mx-auto grid max-w-6xl border-x border-[oklch(79%_0.025_80)] dark:border-[oklch(31%_0.014_75)] lg:grid-cols-[minmax(15rem,0.55fr)_minmax(0,1.45fr)]">
        <div className="border-b border-[oklch(79%_0.025_80)] px-5 py-12 sm:px-8 lg:border-b-0 lg:border-r lg:py-16 dark:border-[oklch(31%_0.014_75)]">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[oklch(40%_0.08_155)] dark:text-[oklch(72%_0.08_150)]">Documento público</p>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">Política de Privacidade</h1>
          <p className="mt-6 font-mono text-xs leading-5 text-[oklch(44%_0.018_70)] dark:text-[oklch(68%_0.014_80)]">Versão de 16 de agosto de 2026</p>
        </div>

        <div className="px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="max-w-[72ch]">
            <p className="font-serif text-2xl font-bold leading-9">Esta política explica de forma objetiva como o Kodan trata dados pessoais durante o uso do site, da conta e das experiências de treino.</p>
            <p className="mt-5 leading-7 text-[oklch(40%_0.018_70)] dark:text-[oklch(74%_0.014_80)]">O Kodan não vende dados pessoais. Coletamos apenas o necessário para operar a experiência, proteger contas e avaliar se a jornada está funcionando.</p>
          </div>

          <div className="mt-12 divide-y divide-[oklch(79%_0.025_80)] border-y border-[oklch(79%_0.025_80)] dark:divide-[oklch(31%_0.014_75)] dark:border-[oklch(31%_0.014_75)]">
            {sections.map((section, index) => (
              <section key={section.title} className="grid gap-5 py-9 lg:grid-cols-[3rem_1fr]">
                <span className="font-mono text-xs text-[oklch(40%_0.08_155)] dark:text-[oklch(72%_0.08_150)]">{String(index + 1).padStart(2, "0")}</span>
                <div className="max-w-[72ch] [&_a]:font-semibold [&_a]:text-[oklch(37%_0.09_155)] [&_a]:underline [&_a]:underline-offset-4 dark:[&_a]:text-[oklch(75%_0.09_150)] [&_li]:leading-7 [&_p+p]:mt-4 [&_p]:leading-7 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                  <h2 className="mb-4 font-serif text-2xl font-bold">{section.title}</h2>
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-10 max-w-[72ch] border border-[oklch(70%_0.035_80)] p-5 dark:border-[oklch(38%_0.02_75)]">
            <h2 className="font-serif text-xl font-bold">Atualizações desta política</h2>
            <p className="mt-3 leading-7">O texto poderá mudar para acompanhar novas funcionalidades, fornecedores ou exigências legais. A data da versão será atualizada nesta página.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
