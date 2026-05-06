import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { FIELD_BY_KEY } from "@/lib/dossier/schema";
import { DossierTemplateList } from "./_components/DossierTemplateList";

export const dynamic = "force-dynamic";

export default async function DossierTemplatesPage() {
  const supabase = await createServerSupabase();
  const { data: templates } = await supabase
    .from("dossier_templates")
    .select("id, name, description, fields, created_at")
    .order("created_at", { ascending: false });

  const enriched = (templates ?? []).map((t) => {
    const fields = (t.fields as Array<{ field_key: string; value: string }>) ?? [];
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      createdAt: t.created_at,
      fieldCount: fields.length,
      fieldLabels: fields.slice(0, 4).map((f) => FIELD_BY_KEY[f.field_key]?.label ?? f.field_key),
    };
  });

  return (
    <main className="max-w-3xl mx-auto px-6 lg:px-10 py-10">
      <Link href="/configuracoes" className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← Configurações
      </Link>
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
        Templates de dossiê
      </p>
      <h1 className="font-display text-h1 mt-2 mb-2">Modelos pra acelerar atendimento</h1>
      <p className="text-body-lg text-text-secondary mb-8">
        Salve um dossiê preenchido como modelo e aplique em novos atendimentos com 1 clique.
        Útil quando você atende perfis parecidos: "executivo", "criativo", "atleta".
      </p>

      <div className="rounded-2xl bg-surface-card border border-border-subtle p-6">
        {enriched.length === 0 ? (
          <p className="text-body-sm text-text-muted text-center py-6">
            Nenhum template salvo ainda. Em qualquer dossiê, use a opção "Salvar como template" no menu.
          </p>
        ) : (
          <DossierTemplateList templates={enriched} />
        )}
      </div>
    </main>
  );
}
