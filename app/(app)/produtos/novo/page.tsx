import Link from "next/link";
import { ProductForm } from "../_components/ProductForm";
import { createProductAction } from "../actions";

export default function NewProductPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 lg:px-10 py-10">
      <Link href="/produtos" className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← Catálogo
      </Link>
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
        Novo produto
      </p>
      <h1 className="font-display text-h1 mt-2 mb-8">Cadastrar produto</h1>
      <ProductForm action={createProductAction} submitLabel="Cadastrar" />
    </main>
  );
}
