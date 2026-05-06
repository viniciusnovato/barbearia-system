import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { TagManager } from "./_components/TagManager";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const supabase = await createServerSupabase();
  const { data: tags } = await supabase
    .from("tags")
    .select("id, name, color, created_at")
    .order("name");

  return (
    <main className="max-w-2xl mx-auto px-6 lg:px-10 py-10">
      <Link href="/configuracoes" className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← Configurações
      </Link>
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
        Tags
      </p>
      <h1 className="font-display text-h1 mt-2 mb-2">Categorias de cliente</h1>
      <p className="text-body-lg text-text-secondary mb-8">
        Tags livres pra organizar sua base. Exemplos: VIP, Cabelo difícil, Indicação, Corporativo.
      </p>

      <TagManager
        initialTags={(tags ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color }))}
      />
    </main>
  );
}
