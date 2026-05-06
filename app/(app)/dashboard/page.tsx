import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getDashboardStats, getReengagementList, getAnniversaryList, getUpcomingReturns } from "@/lib/dashboard/queries";
import { StatsRow } from "./_components/StatsRow";
import { ReengagementList } from "./_components/ReengagementList";
import { AnniversaryList } from "./_components/AnniversaryList";
import { UpcomingReturns } from "./_components/UpcomingReturns";
import { PeriodPicker } from "./_components/PeriodPicker";
import { getPeriodRange } from "./_components/period";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { period = "this_month" } = await searchParams;
  const range = getPeriodRange(period);
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const meta = (user?.user_metadata ?? {}) as { full_name?: string };
  const displayName = meta.full_name ?? user?.email?.split("@")[0] ?? "Barbeiro";

  const [stats, reengagement, anniversaries, returns, latest] = await Promise.all([
    getDashboardStats(range.start, range.end),
    getReengagementList(30),
    getAnniversaryList(),
    getUpcomingReturns(),
    supabase
      .from("dossiers")
      .select("id, title, scheduled_date, status, clients!inner(id, full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
      <header className="mb-8">
        <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
          Painel · {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
        </p>
        <h1 className="font-display text-h1 mt-2">Bom dia, {displayName.split(" ")[0]}.</h1>
        <p className="text-body-secondary mt-2 text-text-secondary">
          {reengagement.length > 0
            ? `${reengagement.length} cliente(s) precisam de contato — comece o dia chamando eles.`
            : "Tudo em dia. Bora atender."}
        </p>
      </header>

      <section className="mb-10">
        <header className="flex items-end justify-between mb-3 flex-wrap gap-3">
          <div>
            <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
              Métricas · {range.label.toLowerCase()}
            </p>
          </div>
          <PeriodPicker current={period} />
        </header>
        <StatsRow {...stats} />
      </section>

      {/* CTAs principais */}
      <div className="grid md:grid-cols-2 gap-3 mb-10">
        <Link href="/clientes" className="group rounded-lg bg-surface-card border border-border-subtle p-5 hover:shadow-2 hover:border-primary-300 transition-all">
          <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>Clientes</p>
          <h3 className="font-display text-h4 mt-2 group-hover:text-primary-600 transition-colors">Ver lista completa →</h3>
        </Link>
        <Link href="/clientes/novo" className="group rounded-lg bg-primary-500 text-neutral-50 p-5 hover:bg-primary-600 transition-colors">
          <p className="font-mono text-mono uppercase opacity-70" style={{ letterSpacing: "0.1em" }}>Novo cliente</p>
          <h3 className="font-display text-h4 mt-2">Cadastrar agora →</h3>
        </Link>
      </div>

      {/* Próximos retornos */}
      {returns.length > 0 && (
        <section className="mb-10">
          <header className="flex items-end justify-between mb-4">
            <div>
              <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
                Agenda · próximos 14 dias
              </p>
              <h2 className="font-display text-h2 mt-1">Retornos agendados</h2>
            </div>
            <span className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.08em" }}>
              {returns.length} cliente(s)
            </span>
          </header>
          <UpcomingReturns clients={returns} />
        </section>
      )}

      {/* Re-engajamento */}
      <section className="mb-10">
        <header className="flex items-end justify-between mb-4">
          <div>
            <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
              Reengajamento
            </p>
            <h2 className="font-display text-h2 mt-1">Quem precisa de contato</h2>
          </div>
          <span className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.08em" }}>
            {reengagement.length} cliente(s)
          </span>
        </header>
        <ReengagementList clients={reengagement} />
      </section>

      {/* Aniversariantes */}
      {anniversaries.length > 0 && (
        <section className="mb-10">
          <header className="mb-4">
            <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
              Hora do retorno
            </p>
            <h2 className="font-display text-h2 mt-1">Última visita há ~30 dias</h2>
            <p className="text-body-sm text-text-secondary mt-1">
              Janela ideal pra oferecer manutenção do corte.
            </p>
          </header>
          <AnniversaryList clients={anniversaries} />
        </section>
      )}

      {/* Últimos dossiês */}
      <section>
        <header className="mb-4">
          <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
            Atividade recente
          </p>
          <h2 className="font-display text-h2 mt-1">Últimos dossiês</h2>
        </header>
        {latest.data && latest.data.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {latest.data.map((d) => {
              const c = Array.isArray(d.clients) ? d.clients[0] : d.clients;
              return (
                <li key={d.id}>
                  <Link href={`/dossie/${d.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-surface-card border border-border-subtle hover:border-border-strong transition-colors">
                    <span className="size-9 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 text-neutral-50 flex items-center justify-center font-display text-body-sm">
                      {(c?.full_name ?? "?").split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-h4 truncate">{d.title}</p>
                      <p className="text-body-sm text-text-muted truncate">{c?.full_name}</p>
                    </div>
                    <StatusBadge status={d.status} />
                    <span className="font-mono text-caption text-text-muted">
                      {new Date(d.scheduled_date).toLocaleDateString("pt-BR")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-border-strong p-8 text-center">
            <p className="font-display text-h4 text-text-muted">Nenhum dossiê ainda</p>
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    rascunho: "bg-status-empty-bg text-status-empty-fg ring-status-empty-ring",
    em_revisao: "bg-status-suggested-bg text-status-suggested-fg ring-status-suggested-ring",
    finalizado: "bg-status-approved-bg text-status-approved-fg ring-status-approved-ring",
  };
  const labels: Record<string, string> = { rascunho: "Rascunho", em_revisao: "Em revisão", finalizado: "Finalizado" };
  return (
    <span className={`text-caption uppercase font-medium px-2.5 h-6 inline-flex items-center rounded-full ring-1 ring-inset ${styles[status] ?? styles.rascunho}`} style={{ letterSpacing: "0.06em" }}>
      {labels[status] ?? status}
    </span>
  );
}
