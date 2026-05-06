import { cookies } from "next/headers";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { THEME_COOKIE, isTheme, type Theme } from "@/lib/theme/cookie";
import {
  uploadLogoAction,
  removeLogoAction,
  updateProfileAction,
  resetTourAction,
} from "./actions";
import { LogoUploader } from "./_components/LogoUploader";
import { ThemeSwitcher } from "../_components/ThemeSwitcher";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: barber } = await supabase.from("barbers").select("*").eq("id", user?.id ?? "").maybeSingle();
  const logoUrl = barber?.logo_path ? await getSignedUrl("barber-assets", barber.logo_path, 3600) : null;
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(THEME_COOKIE)?.value;
  const initialTheme: Theme = isTheme(cookieTheme) ? cookieTheme : (barber?.theme_preference as Theme | undefined) ?? "light";

  return (
    <main className="max-w-3xl mx-auto px-6 lg:px-10 py-10">
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
        Configurações
      </p>
      <h1 className="font-display text-h1 mt-2 mb-8">Sua conta</h1>

      {/* Tema */}
      <section className="mb-10 rounded-2xl bg-surface-card border border-border-subtle p-6">
        <p className="font-mono text-mono uppercase text-text-muted mb-3" style={{ letterSpacing: "0.1em" }}>
          Aparência
        </p>
        <h2 className="font-display text-h3 mb-2">Tema</h2>
        <p className="text-body-sm text-text-secondary mb-5">
          Modo escuro recomendado para uso em iPad durante atendimento noturno. "Automático" segue a preferência do seu sistema.
        </p>
        <ThemeSwitcher initial={initialTheme} />
      </section>

      {/* Logo */}
      <section className="mb-10 rounded-2xl bg-surface-card border border-border-subtle p-6">
        <p className="font-mono text-mono uppercase text-text-muted mb-3" style={{ letterSpacing: "0.1em" }}>
          Logo
        </p>
        <h2 className="font-display text-h3 mb-2">Sua marca no PDF</h2>
        <p className="text-body-sm text-text-secondary mb-5">
          Aparece na capa e nos cabeçalhos das páginas internas. PNG transparente fica melhor.
        </p>
        <LogoUploader currentLogoUrl={logoUrl} action={uploadLogoAction} removeAction={removeLogoAction} />
      </section>

      {/* Perfil */}
      <section className="mb-10 rounded-2xl bg-surface-card border border-border-subtle p-6">
        <p className="font-mono text-mono uppercase text-text-muted mb-3" style={{ letterSpacing: "0.1em" }}>
          Perfil profissional
        </p>
        <h2 className="font-display text-h3 mb-5">Como você assina</h2>
        <form action={updateProfileAction} className="flex flex-col gap-4">
          <Field label="Nome completo">
            <input
              name="full_name"
              defaultValue={barber?.full_name ?? ""}
              required
              className="h-touch px-4 rounded-md bg-surface-card border border-border-strong w-full focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
            />
          </Field>
          <Field label="Instagram">
            <input
              name="instagram"
              defaultValue={barber?.instagram ?? ""}
              placeholder="@suabarbearia"
              className="h-touch px-4 rounded-md bg-surface-card border border-border-strong w-full focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
            />
          </Field>
          <Field label="Considerar inativo após (dias)" hint="Usado pra calcular o status 'dormindo'/'frio'/'perdido'">
            <input
              name="inactivity_threshold_days"
              type="number"
              min={7}
              max={365}
              defaultValue={barber?.inactivity_threshold_days ?? 45}
              className="h-touch px-4 rounded-md bg-surface-card border border-border-strong w-full max-w-[200px] focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
            />
          </Field>
          <button
            type="submit"
            className="self-start h-touch px-6 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 transition-all"
          >
            Salvar perfil
          </button>
        </form>
      </section>

      {/* Templates de desenho */}
      <section className="mb-10 rounded-2xl bg-surface-card border border-border-subtle p-6">
        <p className="font-mono text-mono uppercase text-text-muted mb-3" style={{ letterSpacing: "0.1em" }}>
          Templates de desenho
        </p>
        <h2 className="font-display text-h3 mb-2">Overlays anatômicos</h2>
        <p className="text-body-sm text-text-secondary mb-5">
          Crie linhas guia que aparecem com 1 clique no anotador. 3 templates default já vêm prontos
          (terços faciais, mandíbula, conexão barba-cabelo).
        </p>
        <Link
          href="/configuracoes/templates"
          className="inline-flex h-10 px-4 items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors"
        >
          Gerenciar templates →
        </Link>
      </section>

      {/* Tutorial */}
      <section className="mb-10 rounded-2xl bg-surface-card border border-border-subtle p-6">
        <p className="font-mono text-mono uppercase text-text-muted mb-3" style={{ letterSpacing: "0.1em" }}>
          Tutorial
        </p>
        <h2 className="font-display text-h3 mb-2">Tour interativo</h2>
        <p className="text-body-sm text-text-secondary mb-5">
          {barber?.tour_completed_at
            ? "Tour já completado. Reabra para revisar os passos."
            : "Tour ainda não completado. Vai abrir automaticamente no próximo acesso."}
        </p>
        <form action={resetTourAction}>
          <button
            type="submit"
            className="h-10 px-4 rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors"
          >
            Reabrir tutorial
          </button>
        </form>
      </section>

      <p className="text-caption text-text-muted">
        <Link href="/dashboard" className="hover:text-text-primary">← Voltar ao painel</Link>
      </p>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-mono uppercase text-text-secondary" style={{ letterSpacing: "0.08em" }}>
        {label}
      </span>
      {hint && <span className="text-caption text-text-muted -mt-1">{hint}</span>}
      {children}
    </label>
  );
}
