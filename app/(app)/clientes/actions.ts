"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

function emptyToNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export async function createClientAction(formData: FormData) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) return { error: "Nome é obrigatório" };

  const phone = emptyToNull(formData.get("phone"));
  const instagram = emptyToNull(formData.get("instagram"));
  const notes = emptyToNull(formData.get("notes"));

  const photoFile = formData.get("photo") as File | null;
  let photo_url: string | null = null;

  // Cria cliente primeiro pra ter o id
  const { data: client, error } = await supabase
    .from("clients")
    .insert({ barber_id: user.id, full_name, phone, instagram, notes })
    .select("id")
    .single();
  if (error || !client) return { error: error?.message ?? "Falha ao criar" };

  // Upload de foto (se houver)
  if (photoFile && photoFile.size > 0) {
    const ext = (photoFile.name.split(".").pop() ?? "jpg").toLowerCase();
    const path = `${user.id}/${client.id}/main.${ext}`;
    const arrayBuffer = await photoFile.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from("client-photos")
      .upload(path, arrayBuffer, { upsert: true, contentType: photoFile.type });
    if (!upErr) {
      photo_url = path;
      await supabase.from("clients").update({ photo_url: path }).eq("id", client.id);
    }
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${client.id}`);
}

export async function updateClientAction(formData: FormData) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const id = String(formData.get("id") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!id || !full_name) return { error: "Dados inválidos" };

  const updates: Record<string, string | null> = {
    full_name,
    phone: emptyToNull(formData.get("phone")),
    instagram: emptyToNull(formData.get("instagram")),
    notes: emptyToNull(formData.get("notes")),
  };

  const photoFile = formData.get("photo") as File | null;
  if (photoFile && photoFile.size > 0) {
    const ext = (photoFile.name.split(".").pop() ?? "jpg").toLowerCase();
    const path = `${user.id}/${id}/main.${ext}`;
    const arrayBuffer = await photoFile.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from("client-photos")
      .upload(path, arrayBuffer, { upsert: true, contentType: photoFile.type });
    if (!upErr) updates.photo_url = path;
  }

  const { error } = await supabase.from("clients").update(updates).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function setNextReturnAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const dateRaw = String(formData.get("next_return_at") ?? "").trim();
  const note = (String(formData.get("next_return_note") ?? "").trim()) || null;

  const next_return_at = dateRaw ? new Date(dateRaw + "T12:00:00Z").toISOString() : null;

  await supabase
    .from("clients")
    .update({ next_return_at, next_return_note: note })
    .eq("id", id);

  revalidatePath(`/clientes/${id}`);
  revalidatePath("/dashboard");
}

// Direto em <form action={...}> → Promise<void>
export async function deleteClientAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return;
  revalidatePath("/clientes");
  redirect("/clientes");
}
