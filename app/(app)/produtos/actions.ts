"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

function emptyToNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

async function uploadProductPhoto(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string,
  productId: string,
  file: File,
): Promise<string | null> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${userId}/produtos/${productId}.${ext}`;
  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("barber-assets")
    .upload(path, buffer, { upsert: true, contentType: file.type });
  return error ? null : path;
}

export async function createProductAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const description = emptyToNull(formData.get("description"));
  const how_to_use = emptyToNull(formData.get("how_to_use"));
  const why_use = emptyToNull(formData.get("why_use"));
  const priceStr = String(formData.get("price_brl") ?? "").trim();
  const price_brl = priceStr ? Number(priceStr.replace(",", ".")) : null;

  const { data: product, error } = await supabase
    .from("barber_products")
    .insert({ barber_id: user.id, name, description, how_to_use, why_use, price_brl })
    .select("id")
    .single();
  if (error || !product) return;

  const photoFile = formData.get("photo") as File | null;
  if (photoFile && photoFile.size > 0) {
    const path = await uploadProductPhoto(supabase, user.id, product.id, photoFile);
    if (path) {
      await supabase.from("barber_products").update({ photo_path: path }).eq("id", product.id);
    }
  }

  revalidatePath("/produtos");
  redirect(`/produtos`);
}

export async function updateProductAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  const priceStr = String(formData.get("price_brl") ?? "").trim();
  const updates: Record<string, unknown> = {
    name,
    description: emptyToNull(formData.get("description")),
    how_to_use: emptyToNull(formData.get("how_to_use")),
    why_use: emptyToNull(formData.get("why_use")),
    price_brl: priceStr ? Number(priceStr.replace(",", ".")) : null,
  };

  const photoFile = formData.get("photo") as File | null;
  if (photoFile && photoFile.size > 0) {
    const path = await uploadProductPhoto(supabase, user.id, id, photoFile);
    if (path) updates.photo_path = path;
  }

  await supabase.from("barber_products").update(updates).eq("id", id);
  revalidatePath("/produtos");
  redirect(`/produtos`);
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("barber_products").delete().eq("id", id);
  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function addProductToDossierAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const product_id = String(formData.get("product_id") ?? "");
  if (!dossier_id || !product_id) return;

  // Lê nome do produto pra preencher 'name' (legacy não-nulo)
  const { data: bp } = await supabase
    .from("barber_products")
    .select("name")
    .eq("id", product_id)
    .maybeSingle();

  await supabase.from("products").insert({
    dossier_id,
    product_id,
    name: bp?.name ?? "",
    purchased: false,
  });
  revalidatePath(`/dossie/${dossier_id}`);
}

export async function togglePurchasedAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const purchased = String(formData.get("purchased") ?? "") === "true";
  if (!id || !dossier_id) return;
  await supabase.from("products").update({ purchased }).eq("id", id);
  revalidatePath(`/dossie/${dossier_id}`);
}

export async function removeProductFromDossierAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  const dossier_id = String(formData.get("dossier_id") ?? "");
  if (!id || !dossier_id) return;
  await supabase.from("products").delete().eq("id", id);
  revalidatePath(`/dossie/${dossier_id}`);
}
