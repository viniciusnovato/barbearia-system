import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { ClientForm } from "../../_components/ClientForm";
import { updateClientAction } from "../../actions";
import { DeleteClientForm } from "./_components/DeleteClientForm";

interface PageProps { params: Promise<{ id: string }> }

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (!client) notFound();
  const photoUrl = await getSignedUrl("client-photos", client.photo_url, 3600);

  return (
    <main className="max-w-2xl mx-auto px-6 lg:px-10 py-12">
      <Link href={`/clientes/${id}`} className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← Voltar para o cliente
      </Link>
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
        Editar cliente
      </p>
      <h1 className="font-display text-h1 mt-2 mb-8">{client.full_name}</h1>

      <ClientForm
        action={updateClientAction}
        submitLabel="Salvar alterações"
        initial={{
          id: client.id,
          full_name: client.full_name,
          phone: client.phone,
          instagram: client.instagram,
          notes: client.notes,
          photoUrl: photoUrl ?? null,
        }}
      />

      <hr className="my-10 border-border-subtle" />

      <DeleteClientForm clientId={id} clientName={client.full_name} />
    </main>
  );
}
