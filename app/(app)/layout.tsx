import { redirect } from "next/navigation";
import Link from "next/link";
import { Toaster } from "sonner";
import { createServerSupabase } from "@/lib/supabase/server";
import { signOutAction } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const meta = (user.user_metadata ?? {}) as { full_name?: string };
  const displayName = meta.full_name ?? user.email?.split("@")[0] ?? "Barbeiro";
  const initials = displayName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-surface-page">
      <header className="flex items-center justify-between px-6 lg:px-10 h-16 bg-surface-card border-b border-border-subtle sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="size-8 rounded-md bg-neutral-900 text-neutral-50 flex items-center justify-center font-display text-body-sm">V</div>
            <span className="font-display text-h4">Visagismo</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard">Painel</NavLink>
            <NavLink href="/clientes">Clientes</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-body-sm font-medium">{displayName}</span>
            <span className="text-caption text-text-muted">{user.email}</span>
          </div>
          <div className="size-9 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 text-neutral-50 flex items-center justify-center font-display text-body-sm">{initials}</div>
          <form action={signOutAction}>
            <button type="submit" className="h-9 px-3 rounded-md text-body-sm text-text-secondary hover:bg-surface-sunken transition-colors">Sair</button>
          </form>
        </div>
      </header>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "!bg-surface-card !text-text-primary !border !border-border-strong !shadow-2",
        }}
      />
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 h-9 rounded-md inline-flex items-center text-body-sm text-text-secondary hover:bg-surface-sunken hover:text-text-primary transition-colors">
      {children}
    </Link>
  );
}
