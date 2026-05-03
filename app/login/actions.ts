"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

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
