import { createServerSupabase } from "@/lib/supabase/server";

/** Dados crus dos cards de stats do dashboard, parametrizados por janela. */
export async function getDashboardStats(periodStart?: string, periodEnd?: string) {
  const supabase = await createServerSupabase();
  const now = new Date();
  const startISO = periodStart ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endISO = periodEnd ?? new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const [
    { count: total },
    { count: novosMes },
    { data: dossiersFinalizadosMes },
    { data: clientesAtivos },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("clients").select("*", { count: "exact", head: true }).gte("created_at", startISO).lt("created_at", endISO),
    supabase.from("dossiers").select("id, finalized_at, products(purchased, barber_products(price_brl))").eq("status", "finalizado").gte("finalized_at", startISO).lt("finalized_at", endISO),
    supabase.from("clients").select("id, created_at, last_visit_at").not("last_visit_at", "is", null).gte("last_visit_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
  ]);

  // Recorrentes = clientes com 2+ dossiês
  const { data: dossiersByClient } = await supabase
    .from("dossiers")
    .select("client_id");
  const dossierCounts = new Map<string, number>();
  (dossiersByClient ?? []).forEach((d) => {
    dossierCounts.set(d.client_id, (dossierCounts.get(d.client_id) ?? 0) + 1);
  });
  const recorrentes = Array.from(dossierCounts.values()).filter((n) => n >= 2).length;

  // Receita estimada do mês: soma de products.purchased=true * price_brl
  let receitaMes = 0;
  (dossiersFinalizadosMes ?? []).forEach((d) => {
    const products = (d as unknown as { products?: { purchased: boolean; barber_products?: { price_brl: number | null } | null }[] }).products ?? [];
    products.forEach((p) => {
      if (p.purchased && p.barber_products?.price_brl) receitaMes += Number(p.barber_products.price_brl);
    });
  });

  return {
    total: total ?? 0,
    novosMes: novosMes ?? 0,
    recorrentes,
    ativos: clientesAtivos?.length ?? 0,
    receitaMes,
  };
}

/** Clientes que precisam de re-engajamento. */
export async function getReengagementList(thresholdDays = 30) {
  const supabase = await createServerSupabase();
  const limitDate = new Date(Date.now() - thresholdDays * 86400_000).toISOString();
  const { data } = await supabase
    .from("clients_with_status")
    .select("id, full_name, phone, instagram, photo_url, last_visit_at, days_since_visit, client_status")
    .in("client_status", ["dormindo", "frio", "perdido"])
    .order("last_visit_at", { ascending: true })
    .limit(20);
  return data ?? [];
}

/** Clientes com retorno agendado nos próximos 14 dias (ou já atrasados). */
export async function getUpcomingReturns() {
  const supabase = await createServerSupabase();
  const horizon = new Date(Date.now() + 14 * 86400_000).toISOString();
  const { data } = await supabase
    .from("clients_with_status")
    .select("id, full_name, phone, next_return_at, next_return_note, days_to_return")
    .not("next_return_at", "is", null)
    .lte("next_return_at", horizon)
    .order("next_return_at", { ascending: true })
    .limit(15);
  return data ?? [];
}

/** Clientes em "aniversário" — última visita há ~30d (ideal pra retorno). */
export async function getAnniversaryList() {
  const supabase = await createServerSupabase();
  const min = new Date(Date.now() - 35 * 86400_000).toISOString();
  const max = new Date(Date.now() - 25 * 86400_000).toISOString();
  const { data } = await supabase
    .from("clients_with_status")
    .select("id, full_name, phone, last_visit_at, days_since_visit")
    .gte("last_visit_at", min)
    .lte("last_visit_at", max)
    .order("last_visit_at", { ascending: true })
    .limit(10);
  return data ?? [];
}
