import Link from "next/link";
import { ClientForm } from "../_components/ClientForm";
import { createClientAction } from "../actions";

export default function NewClientPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 lg:px-10 py-12">
      <Link href="/clientes" className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← Voltar para clientes
      </Link>
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
        Novo cliente
      </p>
      <h1 className="font-display text-h1 mt-2 mb-8">Cadastrar cliente</h1>

      <ClientForm action={createClientAction} submitLabel="Criar cliente" />
    </main>
  );
}
