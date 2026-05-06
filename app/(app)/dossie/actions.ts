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

export async function reassignFieldAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const from_key = String(formData.get("from_key") ?? "");
  const to_key = String(formData.get("to_key") ?? "");
  if (!dossier_id || !from_key || !to_key || from_key === to_key) return;

  // Lê origem
  const { data: source } = await supabase
    .from("dossier_fields")
    .select("value, source_block_ids, status")
    .eq("dossier_id", dossier_id)
    .eq("field_key", from_key)
    .maybeSingle();
  if (!source || !source.value) return;

  // Lê destino
  const { data: dest } = await supabase
    .from("dossier_fields")
    .select("status")
    .eq("dossier_id", dossier_id)
    .eq("field_key", to_key)
    .maybeSingle();
  if (!dest) return;

  // Não sobrescreve campo já aprovado
  if (dest.status === "aprovado") return;

  await supabase
    .from("dossier_fields")
    .update({
      value: source.value,
      status: "editado",
      source_block_ids: source.source_block_ids ?? [],
    })
    .eq("dossier_id", dossier_id)
    .eq("field_key", to_key);

  // Limpa origem
  await supabase
    .from("dossier_fields")
    .update({
      value: null,
      status: "vazio",
      source_block_ids: [],
    })
    .eq("dossier_id", dossier_id)
    .eq("field_key", from_key);

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

export async function saveAsTemplateAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const dossier_id = String(formData.get("dossier_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!dossier_id || !name) return;

  // Captura todos os campos preenchidos (não-vazios)
  const { data: fields } = await supabase
    .from("dossier_fields")
    .select("field_key, value")
    .eq("dossier_id", dossier_id)
    .neq("status", "vazio")
    .not("value", "is", null);

  const fieldsArr = (fields ?? []).map((f) => ({ field_key: f.field_key, value: f.value }));

  await supabase.from("dossier_templates").insert({
    barber_id: user.id,
    name,
    description,
    fields: fieldsArr,
  });

  revalidatePath("/configuracoes/templates-dossie");
}

export async function applyTemplateAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const template_id = String(formData.get("template_id") ?? "");
  if (!dossier_id || !template_id) return;

  const { data: tpl } = await supabase
    .from("dossier_templates")
    .select("fields")
    .eq("id", template_id)
    .maybeSingle();
  if (!tpl) return;

  const items = (tpl.fields as Array<{ field_key: string; value: string }>) ?? [];
  for (const f of items) {
    if (!f.field_key || !f.value) continue;
    // Não sobrescreve campos já aprovados
    const { data: existing } = await supabase
      .from("dossier_fields")
      .select("status")
      .eq("dossier_id", dossier_id)
      .eq("field_key", f.field_key)
      .maybeSingle();
    if (existing?.status === "aprovado") continue;
    await supabase
      .from("dossier_fields")
      .update({ value: f.value, status: "editado" })
      .eq("dossier_id", dossier_id)
      .eq("field_key", f.field_key);
  }

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
