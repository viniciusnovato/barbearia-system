import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { ProductForm } from "../_components/ProductForm";
import { updateProductAction } from "../actions";
import { DeleteProductButton } from "../_components/DeleteProductButton";

interface PageProps { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: product } = await supabase
    .from("barber_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!product) notFound();
  const photoUrl = await getSignedUrl("barber-assets", product.photo_path, 3600);

  return (
    <main className="max-w-2xl mx-auto px-6 lg:px-10 py-10">
      <Link href="/produtos" className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← Catálogo
      </Link>
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
        Editar produto
      </p>
      <h1 className="font-display text-h1 mt-2 mb-8">{product.name}</h1>
      <ProductForm
        action={updateProductAction}
        submitLabel="Salvar alterações"
        initial={{
          id: product.id,
          name: product.name,
          description: product.description,
          how_to_use: product.how_to_use,
          why_use: product.why_use,
          category: product.category,
          price_brl: product.price_brl,
          photoUrl: photoUrl ?? null,
        }}
      />

      <hr className="my-10 border-border-subtle" />
      <DeleteProductButton id={id} name={product.name} />
    </main>
  );
}
