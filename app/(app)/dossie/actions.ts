"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ALL_FIELDS, REQUIRED_FIELDS, isFieldReady } from "@/lib/dossier/schema";

// Todas as actions deste arquivo são ligadas DIRETAMENTE a `<form action={...}>`,
// então o tipo de retorno precisa ser `Promise<void>`. Validações que falham
// apenas saem (return) silenciosamente — o estado UI já reflete o problema.

export async function createDossierAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const client_id = String(formData.get("client_id") ?? "");
  if (!client_id) return;

  const today = new Date();
  const titleBase = `Atendimento · ${today.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}`;

  const { data: dossier, error } = await supabase
    .from("dossiers")
    .insert({ client_id, title: titleBase, scheduled_date: today.toISOString().slice(0, 10) })
    .select("id")
    .single();
  if (error || !dossier) return;

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

export async function updateFieldAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const field_key = String(formData.get("field_key") ?? "");
  const value = String(formData.get("value") ?? "").trim() || null;
  if (!dossier_id || !field_key) return;

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

export async function approveFieldAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const field_key = String(formData.get("field_key") ?? "");
  if (!dossier_id || !field_key) return;

  await supabase
    .from("dossier_fields")
    .update({ status: "aprovado" })
    .eq("dossier_id", dossier_id)
    .eq("field_key", field_key);

  revalidatePath(`/dossie/${dossier_id}`);
}

export async function discardFieldAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const field_key = String(formData.get("field_key") ?? "");
  if (!dossier_id || !field_key) return;

  await supabase
    .from("dossier_fields")
    .update({ value: null, status: "vazio", source_block_ids: [] })
    .eq("dossier_id", dossier_id)
    .eq("field_key", field_key);

  revalidatePath(`/dossie/${dossier_id}`);
}

export async function updateDossierTitleAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!dossier_id || !title) return;

  await supabase.from("dossiers").update({ title }).eq("id", dossier_id);
  revalidatePath(`/dossie/${dossier_id}`);
}

export async function finalizeDossierAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  if (!dossier_id) return;

  const { data: fields } = await supabase
    .from("dossier_fields")
    .select("field_key, status, value")
    .eq("dossier_id", dossier_id);

  const missing = REQUIRED_FIELDS.filter((k) => !isFieldReady(fields?.find((x) => x.field_key === k)));

  if (missing.length > 0) {
    // Validação client-side já mostra a contagem; rejeição silenciosa aqui.
    return;
  }

  await supabase
    .from("dossiers")
    .update({ status: "finalizado", finalized_at: new Date().toISOString() })
    .eq("id", dossier_id);

  revalidatePath(`/dossie/${dossier_id}`);
}
