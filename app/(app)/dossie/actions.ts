"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ALL_FIELDS, REQUIRED_FIELDS, isFieldReady } from "@/lib/dossier/schema";

export async function createDossierAction(formData: FormData) {
  const supabase = await createServerSupabase();
  const client_id = String(formData.get("client_id") ?? "");
  if (!client_id) return { error: "Cliente inválido" };

  const today = new Date();
  const titleBase = `Atendimento · ${today.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}`;

  const { data: dossier, error } = await supabase
    .from("dossiers")
    .insert({ client_id, title: titleBase, scheduled_date: today.toISOString().slice(0, 10) })
    .select("id")
    .single();
  if (error || !dossier) return { error: error?.message ?? "Falha ao criar dossiê" };

  // Seed dos campos vazios
  const rows = ALL_FIELDS.map((f) => ({
    dossier_id: dossier.id,
    section: f.section,
    field_key: f.key,
    value: null,
    status: "vazio" as const,
    source_block_ids: [],
  }));
  if (rows.length > 0) {
    await supabase.from("dossier_fields").insert(rows);
  }

  revalidatePath(`/clientes/${client_id}`);
  redirect(`/dossie/${dossier.id}`);
}

export async function updateFieldAction(formData: FormData) {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const field_key = String(formData.get("field_key") ?? "");
  const value = String(formData.get("value") ?? "").trim() || null;
  if (!dossier_id || !field_key) return { error: "Dados inválidos" };

  // Se já vier de aprovado, marcar editado; se vazio→editado quando há valor
  const { data: current } = await supabase
    .from("dossier_fields")
    .select("status")
    .eq("dossier_id", dossier_id)
    .eq("field_key", field_key)
    .maybeSingle();

  let nextStatus: string;
  if (!value) nextStatus = "vazio";
  else if (current?.status === "vazio") nextStatus = "editado";
  else if (current?.status === "sugerido") nextStatus = "editado";
  else nextStatus = current?.status ?? "editado";

  await supabase
    .from("dossier_fields")
    .update({ value, status: nextStatus })
    .eq("dossier_id", dossier_id)
    .eq("field_key", field_key);

  revalidatePath(`/dossie/${dossier_id}`);
}

export async function approveFieldAction(formData: FormData) {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const field_key = String(formData.get("field_key") ?? "");
  if (!dossier_id || !field_key) return { error: "Dados inválidos" };

  await supabase
    .from("dossier_fields")
    .update({ status: "aprovado" })
    .eq("dossier_id", dossier_id)
    .eq("field_key", field_key);

  revalidatePath(`/dossie/${dossier_id}`);
}

export async function discardFieldAction(formData: FormData) {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const field_key = String(formData.get("field_key") ?? "");
  if (!dossier_id || !field_key) return { error: "Dados inválidos" };

  await supabase
    .from("dossier_fields")
    .update({ value: null, status: "vazio", source_block_ids: [] })
    .eq("dossier_id", dossier_id)
    .eq("field_key", field_key);

  revalidatePath(`/dossie/${dossier_id}`);
}

export async function updateDossierTitleAction(formData: FormData) {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!dossier_id || !title) return { error: "Título inválido" };

  await supabase.from("dossiers").update({ title }).eq("id", dossier_id);
  revalidatePath(`/dossie/${dossier_id}`);
}

export async function finalizeDossierAction(formData: FormData) {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  if (!dossier_id) return { error: "Id ausente" };

  // Valida obrigatórios
  const { data: fields } = await supabase
    .from("dossier_fields")
    .select("field_key, status, value")
    .eq("dossier_id", dossier_id);

  const missing = REQUIRED_FIELDS.filter((k) => !isFieldReady(fields?.find((x) => x.field_key === k)));

  if (missing.length > 0) {
    return { error: `Faltam ${missing.length} campo(s) obrigatório(s) prontos (editar ou aprovar sugeridos)` };
  }

  await supabase
    .from("dossiers")
    .update({ status: "finalizado", finalized_at: new Date().toISOString() })
    .eq("id", dossier_id);

  revalidatePath(`/dossie/${dossier_id}`);
}
