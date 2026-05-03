import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { createDossierAction } from "../../dossie/actions";

interface PageProps { params: Promise<{ id: string }> }

export default async function ClientProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (!client) notFound();

  const photoUrl = await getSignedUrl("client-photos", client.photo_url, 3600);

  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("id, title, scheduled_date, status, finalized_at")
    .eq("client_id", id)
    .order("scheduled_date", { ascending: false });

  const initials = client.full_name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <main className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
      <Link href="/clientes" className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← Clientes
      </Link>

      {/* Header do cliente */}
      <header className="flex flex-col sm:flex-row gap-6 sm:items-end justify-between mb-10 pb-8 border-b border-border-subtle">
        <div className="flex items-center gap-5">
          {photoUrl ? (
            <Image src={photoUrl} alt="" width={96} height={96} unoptimized className="size-24 rounded-full object-cover bg-neutral-200" />
          ) : (
            <span className="size-24 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 text-neutral-50 flex items-center justify-center font-display text-h2">
              {initials}
            </span>
          )}
          <div>
            <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
              Cliente
            </p>
            <h1 className="font-display text-h1 mt-1">{client.full_name}</h1>
            <p className="text-body-sm text-text-muted mt-1">
              {[client.phone, client.instagram].filter(Boolean).join(" · ") || "Sem contatos cadastrados"}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href={`/clientes/${id}/editar`} className="h-touch px-4 inline-flex items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors">
            Editar
          </Link>
          <form action={createDossierAction}>
            <input type="hidden" name="client_id" value={id} />
            <button type="submit" className="h-touch px-5 inline-flex items-center gap-2 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 transition-all">
              + Novo dossiê
            </button>
          </form>
        </div>
      </header>

      {/* Notas */}
      {client.notes && (
        <section className="mb-10 rounded-lg bg-surface-sunken p-5">
          <p className="font-mono text-mono uppercase text-text-muted mb-2" style={{ letterSpacing: "0.08em" }}>
            Observações internas
          </p>
          <p className="text-body whitespace-pre-wrap">{client.notes}</p>
        </section>
      )}

      {/* Histórico */}
      <section>
        <header className="flex items-end justify-between mb-4">
          <div>
            <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>Histórico</p>
            <h2 className="font-display text-h2 mt-1">Dossiês ({dossiers?.length ?? 0})</h2>
          </div>
        </header>

        {!dossiers || dossiers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong p-10 text-center">
            <p className="font-display text-h4 text-text-muted">Nenhum dossiê ainda</p>
            <p className="text-body-sm text-text-secondary mt-2">Clique em "Novo dossiê" pra começar o primeiro atendimento.</p>
          </div>
        ) : (
          <ol className="relative ml-4 border-l border-border-subtle">
            {dossiers.map((d) => {
              const status = d.status as "rascunho" | "em_revisao" | "finalizado";
              return (
                <li key={d.id} className="ml-6 mb-4 relative">
                  <span className="absolute -left-[31px] top-3 size-3 rounded-full bg-surface-card border-2 border-primary-500" />
                  <Link href={`/dossie/${d.id}`} className="block p-4 rounded-lg bg-surface-card border border-border-subtle hover:border-primary-300 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-h4">{d.title}</p>
                      <StatusBadge status={status} />
                    </div>
                    <p className="text-caption text-text-muted mt-1 font-mono uppercase" style={{ letterSpacing: "0.06em" }}>
                      {new Date(d.scheduled_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: "rascunho" | "em_revisao" | "finalizado" }) {
  const styles = {
    rascunho: "bg-status-empty-bg text-status-empty-fg ring-status-empty-ring",
    em_revisao: "bg-status-suggested-bg text-status-suggested-fg ring-status-suggested-ring",
    finalizado: "bg-status-approved-bg text-status-approved-fg ring-status-approved-ring",
  } as const;
  const labels = { rascunho: "Rascunho", em_revisao: "Em revisão", finalizado: "Finalizado" };
  return (
    <span className={`text-caption uppercase font-medium px-2.5 h-6 inline-flex items-center rounded-full ring-1 ring-inset ${styles[status]}`} style={{ letterSpacing: "0.06em" }}>
      {labels[status]}
    </span>
  );
}
