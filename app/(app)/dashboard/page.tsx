import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const meta = (user?.user_metadata ?? {}) as { full_name?: string };
  const displayName = meta.full_name ?? user?.email?.split("@")[0] ?? "Barbeiro";

  // Stats
  const [{ count: clientCount }, { count: dossierCount }, { count: finalizedCount }] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("dossiers").select("*", { count: "exact", head: true }),
    supabase.from("dossiers").select("*", { count: "exact", head: true }).eq("status", "finalizado"),
  ]);

  // Latest dossiers
  const { data: latestDossiers } = await supabase
    .from("dossiers")
    .select("id, title, scheduled_date, status, clients!inner(id, full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
        Painel do barbeiro
      </p>
      <h1 className="font-display text-display mt-3 leading-tight">Olá, {displayName.split(" ")[0]}.</h1>
      <p className="mt-4 text-body-lg text-text-secondary max-w-2xl">
        Pronto pra começar. Acesse seus clientes, abra um dossiê novo ou continue uma revisão.
      </p>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        <Stat label="Clientes" value={clientCount ?? 0} hint="No seu cadastro" />
        <Stat label="Dossiês" value={dossierCount ?? 0} hint="Total criados" />
        <Stat label="Finalizados" value={finalizedCount ?? 0} hint="Com PDF gerado" tone="success" />
      </div>

      {/* CTAs */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Link href="/clientes" className="group rounded-2xl bg-surface-card border border-border-subtle p-6 hover:shadow-2 hover:border-primary-300 transition-all">
          <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>Clientes</p>
          <h3 className="font-display text-h3 mt-2 group-hover:text-primary-600 transition-colors">Ver lista de clientes →</h3>
          <p className="text-body-sm text-text-secondary mt-2">Buscar por nome, telefone ou Instagram. Criar novo cliente.</p>
        </Link>
        <Link href="/clientes/novo" className="group rounded-2xl bg-primary-500 text-neutral-50 p-6 hover:bg-primary-600 transition-colors">
          <p className="font-mono text-mono uppercase opacity-70" style={{ letterSpacing: "0.1em" }}>Novo cliente</p>
          <h3 className="font-display text-h3 mt-2">Cadastrar cliente →</h3>
          <p className="text-body-sm opacity-80 mt-2">Adicione um cliente novo e abra o primeiro dossiê.</p>
        </Link>
      </div>

      {/* Latest dossiers */}
      <section className="mt-12">
        <header className="flex items-end justify-between mb-4">
          <div>
            <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>Atividade recente</p>
            <h2 className="font-display text-h2 mt-1">Últimos dossiês</h2>
          </div>
        </header>

        {latestDossiers && latestDossiers.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {latestDossiers.map((d) => {
              const c = Array.isArray(d.clients) ? d.clients[0] : d.clients;
              return (
                <li key={d.id}>
                  <Link
                    href={`/dossie/${d.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-surface-card border border-border-subtle hover:border-border-strong transition-colors"
                  >
                    <span className="size-10 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 text-neutral-50 flex items-center justify-center font-display text-body-sm">
                      {(c?.full_name ?? "?").split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-h4">{d.title}</p>
                      <p className="text-body-sm text-text-muted">{c?.full_name}</p>
                    </div>
                    <StatusBadge status={d.status} />
                    <span className="font-mono text-caption text-text-muted">{new Date(d.scheduled_date).toLocaleDateString("pt-BR")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-border-strong p-10 text-center">
            <p className="font-display text-h4 text-text-muted">Nenhum dossiê ainda</p>
            <p className="text-body-sm text-text-secondary mt-2">Crie um cliente e abra o primeiro dossiê.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, hint, tone = "default" }: { label: string; value: number; hint: string; tone?: "default" | "success" }) {
  return (
    <div className="rounded-lg bg-surface-card border border-border-subtle p-5 shadow-1">
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.08em" }}>{label}</p>
      <p className={`font-display text-display mt-2 leading-none ${tone === "success" ? "text-success" : ""}`}>{value}</p>
      <p className="text-body-sm text-text-secondary mt-3">{hint}</p>
    </div>
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
