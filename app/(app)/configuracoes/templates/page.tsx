import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { TemplateCreator } from "./_components/TemplateCreator";
import { TemplateList } from "./_components/TemplateList";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: templates } = await supabase
    .from("drawing_templates")
    .select("id, name, vector_data, is_default, barber_id, created_at")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  const mine = (templates ?? []).filter((t) => t.barber_id === user?.id);
  const defaults = (templates ?? []).filter((t) => t.barber_id === null);

  return (
    <main className="max-w-3xl mx-auto px-6 lg:px-10 py-10">
      <Link href="/configuracoes" className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← Configurações
      </Link>
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
        Templates de desenho
      </p>
      <h1 className="font-display text-h1 mt-2 mb-2">Seus overlays anatômicos</h1>
      <p className="text-body-lg text-text-secondary mb-8">
        Crie linhas guia que aparecem com 1 clique no anotador. Cada template usa coordenadas
        normalizadas (0..1), então funciona em qualquer foto.
      </p>

      <section className="mb-10">
        <h2 className="font-display text-h3 mb-4">Padrões do sistema</h2>
        <TemplateList templates={defaults} editable={false} />
      </section>

      <section className="mb-10">
        <header className="flex items-end justify-between mb-4">
          <h2 className="font-display text-h3">Seus templates</h2>
          <span className="font-mono text-mono uppercase text-text-muted">{mine.length}</span>
        </header>
        {mine.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong p-6 text-center">
            <p className="text-body-sm text-text-muted">Você ainda não criou nenhum template.</p>
          </div>
        ) : (
          <TemplateList templates={mine} editable />
        )}
      </section>

      <section>
        <h2 className="font-display text-h3 mb-2">Criar novo</h2>
        <p className="text-body-sm text-text-secondary mb-4">
          Desenhe na área abaixo. As linhas serão salvas em proporção (0..1) e aparecerão escaladas no anotador.
        </p>
        <TemplateCreator />
      </section>
    </main>
  );
}
