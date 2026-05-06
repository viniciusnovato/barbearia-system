"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const instagram = String(formData.get("instagram") ?? "").trim() || undefined;

  if (!email || !password || !full_name) return { error: "Preencha todos os campos obrigatórios" };
  if (password.length < 6) return { error: "Senha precisa de no mínimo 6 caracteres" };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, instagram },
    },
  });

  if (error) return { error: error.message };

  // Tenta logar imediatamente (caso confirmação de email esteja desabilitada)
  const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
  if (loginErr) {
    // Cadastro feito mas precisa confirmar e-mail
    return { ok: true, needsConfirm: true };
  }

  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo || "/dashboard");
}

export async function signOutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
