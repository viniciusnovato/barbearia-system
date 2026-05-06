"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { createBrowserSupabase } from "@/lib/supabase/client";

interface ClientHit { id: string; full_name: string }

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientHit[]>([]);

  // Atalho ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Busca clientes ao digitar (debounced)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      const supabase = createBrowserSupabase();
      let q = supabase.from("clients").select("id, full_name").order("full_name").limit(8);
      if (search.trim()) q = q.ilike("full_name", `%${search}%`);
      const { data } = await q;
      setClients(data ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [search, open]);

  function go(path: string) {
    setOpen(false);
    setSearch("");
    router.push(path);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Abrir busca rápida (⌘K)"
        className="hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border-subtle text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <span className="text-body-sm">Buscar</span>
        <kbd className="ml-2 font-mono text-caption text-text-muted bg-surface-sunken px-1.5 py-0.5 rounded border border-border-subtle">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-surface-card border border-border-strong shadow-4 overflow-hidden"
      >
        <Command shouldFilter={false} className="flex flex-col">
          <div className="flex items-center gap-3 px-4 border-b border-border-subtle">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} className="text-text-muted"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Busque cliente, navegue, execute…"
              className="flex-1 h-12 bg-transparent text-body focus:outline-none placeholder:text-text-muted"
            />
            <kbd className="font-mono text-caption text-text-muted bg-surface-sunken px-1.5 py-0.5 rounded border border-border-subtle">esc</kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-text-muted text-body-sm">
              Nada encontrado.
            </Command.Empty>

            <Command.Group heading={<GroupTitle>Navegar</GroupTitle>}>
              <Item icon="🏠" label="Painel" onSelect={() => go("/dashboard")} />
              <Item icon="👤" label="Clientes" onSelect={() => go("/clientes")} />
              <Item icon="📦" label="Produtos" onSelect={() => go("/produtos")} />
              <Item icon="⚙️" label="Configurações" onSelect={() => go("/configuracoes")} />
            </Command.Group>

            <Command.Group heading={<GroupTitle>Ações</GroupTitle>}>
              <Item icon="✚" label="Novo cliente" onSelect={() => go("/clientes/novo")} />
              <Item icon="✚" label="Novo produto" onSelect={() => go("/produtos/novo")} />
            </Command.Group>

            {clients.length > 0 && (
              <Command.Group heading={<GroupTitle>Clientes</GroupTitle>}>
                {clients.map((c) => (
                  <Item
                    key={c.id}
                    icon={c.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                    label={c.full_name}
                    onSelect={() => go(`/clientes/${c.id}`)}
                  />
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-mono uppercase text-text-muted px-2 py-1.5 inline-block" style={{ letterSpacing: "0.1em" }}>
      {children}
    </span>
  );
}

function Item({ icon, label, onSelect }: { icon: string; label: string; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-body-sm transition-colors data-[selected=true]:bg-primary-500 data-[selected=true]:text-neutral-50"
    >
      <span className="size-7 rounded-md bg-surface-sunken flex items-center justify-center text-caption font-mono">{icon}</span>
      <span className="flex-1">{label}</span>
    </Command.Item>
  );
}
