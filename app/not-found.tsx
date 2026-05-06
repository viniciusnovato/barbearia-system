import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-surface-page">
      <div className="max-w-md w-full text-center">
        <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
          Erro 404
        </p>
        <h1 className="font-display text-display mt-3 mb-4 leading-none">Não encontrado</h1>
        <p className="text-body text-text-secondary mb-8">
          Essa página não existe ou foi removida.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="h-touch px-5 inline-flex items-center rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 transition-colors"
          >
            Voltar ao painel
          </Link>
          <Link
            href="/clientes"
            className="h-touch px-5 inline-flex items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors"
          >
            Ver clientes
          </Link>
        </div>
      </div>
    </main>
  );
}
