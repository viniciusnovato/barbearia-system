"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  addProductToDossierAction,
  togglePurchasedAction,
  removeProductFromDossierAction,
} from "@/app/(app)/produtos/actions";

interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  price_brl: number | null;
}

interface DossierProduct {
  id: string;
  product_id: string | null;
  purchased: boolean;
  catalog: CatalogProduct | null;
}

interface Props {
  dossierId: string;
  catalog: CatalogProduct[];
  dossierProducts: DossierProduct[];
  isFinalized: boolean;
}

export function ProductsSection({ dossierId, catalog, dossierProducts, isFinalized }: Props) {
  const [picking, setPicking] = useState(false);
  const [pending, startTransition] = useTransition();

  const usedIds = new Set(dossierProducts.map((p) => p.product_id).filter(Boolean));
  const available = catalog.filter((c) => !usedIds.has(c.id));

  function add(productId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("dossier_id", dossierId);
      fd.set("product_id", productId);
      await addProductToDossierAction(fd);
      toast.success("Produto adicionado ao dossiê");
      setPicking(false);
    });
  }

  function toggle(rowId: string, current: boolean) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", rowId);
      fd.set("dossier_id", dossierId);
      fd.set("purchased", String(!current));
      await togglePurchasedAction(fd);
      toast.success(current ? "Marcado como não-comprado" : "Marcado como comprado");
    });
  }

  function remove(rowId: string) {
    if (!confirm("Remover este produto do dossiê?")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", rowId);
      fd.set("dossier_id", dossierId);
      await removeProductFromDossierAction(fd);
      toast.success("Produto removido");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {dossierProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong p-8 text-center">
          <p className="font-display text-h4 text-text-muted">Nenhum produto adicionado</p>
          <p className="text-body-sm text-text-secondary mt-2">
            Escolha do seu catálogo {catalog.length > 0 ? `(${catalog.length} disponíveis)` : ""}.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {dossierProducts.map((p) => (
            <li
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-lg bg-surface-card border ${
                p.purchased ? "border-status-approved-ring" : "border-border-subtle"
              }`}
            >
              {p.catalog?.photoUrl ? (
                <Image src={p.catalog.photoUrl} alt="" width={48} height={48} unoptimized className="size-12 rounded-md object-cover" />
              ) : (
                <div className="size-12 rounded-md bg-surface-sunken" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-display text-h4 truncate">{p.catalog?.name ?? "Produto"}</p>
                {p.catalog?.description && (
                  <p className="text-body-sm text-text-muted truncate">{p.catalog.description}</p>
                )}
                {p.catalog?.price_brl && (
                  <p className="font-mono text-caption text-primary-700 mt-0.5" style={{ letterSpacing: "0.04em" }}>
                    R$ {Number(p.catalog.price_brl).toFixed(2).replace(".", ",")}
                  </p>
                )}
              </div>

              {!isFinalized && (
                <>
                  <button
                    type="button"
                    onClick={() => toggle(p.id, p.purchased)}
                    disabled={pending}
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-body-sm font-medium ring-1 ring-inset transition-all ${
                      p.purchased
                        ? "bg-status-approved-bg text-status-approved-fg ring-status-approved-ring"
                        : "bg-surface-sunken text-text-secondary ring-border-subtle hover:bg-status-approved-bg hover:text-status-approved-fg"
                    }`}
                  >
                    {p.purchased ? "✓ Comprou" : "Indicado"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    disabled={pending}
                    title="Remover"
                    className="size-9 rounded-md inline-flex items-center justify-center text-text-muted hover:bg-surface-sunken hover:text-danger transition-colors"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
                  </button>
                </>
              )}
              {isFinalized && p.purchased && (
                <span className="text-caption uppercase font-medium px-2.5 h-6 inline-flex items-center rounded-full bg-status-approved-bg text-status-approved-fg ring-1 ring-inset ring-status-approved-ring" style={{ letterSpacing: "0.06em" }}>
                  Comprou
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isFinalized && (
        <>
          {!picking ? (
            <button
              type="button"
              onClick={() => setPicking(true)}
              disabled={catalog.length === 0}
              className="self-start h-10 px-4 rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors disabled:opacity-50"
            >
              {catalog.length === 0 ? "Catálogo vazio" : "+ Adicionar do catálogo"}
            </button>
          ) : (
            <div className="rounded-lg bg-surface-card border border-border-subtle p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.08em" }}>
                  Escolha do catálogo
                </p>
                <button onClick={() => setPicking(false)} className="text-body-sm text-text-muted hover:text-text-primary">Fechar</button>
              </div>
              {available.length === 0 ? (
                <p className="text-body-sm text-text-muted py-4 text-center">
                  Todos os produtos do catálogo já foram adicionados.{" "}
                  <Link href="/produtos/novo" className="text-primary-600 hover:underline">Cadastrar novo</Link>
                </p>
              ) : (
                <ul className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                  {available.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => add(c.id)}
                        disabled={pending}
                        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-surface-sunken transition-colors text-left"
                      >
                        {c.photoUrl ? (
                          <Image src={c.photoUrl} alt="" width={40} height={40} unoptimized className="size-10 rounded-md object-cover" />
                        ) : (
                          <div className="size-10 rounded-md bg-surface-sunken" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-medium truncate">{c.name}</p>
                          {c.description && (
                            <p className="text-caption text-text-muted truncate">{c.description}</p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
