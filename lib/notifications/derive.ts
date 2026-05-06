import { createServerSupabase } from "@/lib/supabase/server";

export interface DerivedNotification {
  key: string;
  type: "return_today" | "return_tomorrow" | "return_overdue" | "inactive" | "product_reposicao";
  title: string;
  body: string;
  link: string;
}

/** Gera notificações derivadas a partir do estado atual do banco. */
export async function getDerivedNotifications(): Promise<DerivedNotification[]> {
  const supabase = await createServerSupabase();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString();

  const [{ data: returns }, { data: dismissals }] = await Promise.all([
    supabase
      .from("clients_with_status")
      .select("id, full_name, next_return_at, days_to_return, days_since_visit, client_status")
      .or(`next_return_at.lte.${tomorrowEnd},client_status.eq.frio,client_status.eq.perdido`)
      .limit(50),
    supabase.from("notification_dismissals").select("notification_key"),
  ]);

  const dismissed = new Set((dismissals ?? []).map((d) => d.notification_key));
  const out: DerivedNotification[] = [];

  for (const c of (returns ?? [])) {
    // Retornos de hoje/amanhã/atrasado
    if (c.next_return_at) {
      const dtr = c.days_to_return ?? 0;
      const key = `return:${c.id}:${c.next_return_at.slice(0, 10)}`;
      if (!dismissed.has(key)) {
        if (dtr < 0) {
          out.push({
            key,
            type: "return_overdue",
            title: `${c.full_name} — retorno atrasado`,
            body: `${Math.abs(dtr)} dia(s) atrás`,
            link: `/clientes/${c.id}`,
          });
        } else if (dtr === 0) {
          out.push({
            key,
            type: "return_today",
            title: `${c.full_name} — retorno HOJE`,
            body: "Confirme presença",
            link: `/clientes/${c.id}`,
          });
        } else if (dtr === 1) {
          out.push({
            key,
            type: "return_tomorrow",
            title: `${c.full_name} — retorno amanhã`,
            body: "Lembrete pra ele",
            link: `/clientes/${c.id}`,
          });
        }
      }
    }

    // Inativos críticos
    if (c.client_status === "perdido") {
      const key = `inactive:${c.id}`;
      if (!dismissed.has(key)) {
        out.push({
          key,
          type: "inactive",
          title: `${c.full_name} — perdido`,
          body: `${c.days_since_visit} dias sem vir`,
          link: `/clientes/${c.id}`,
        });
      }
    }
  }

  // Ordem: retornos hoje/atrasado/amanhã primeiro, inativos depois
  const order = ["return_overdue", "return_today", "return_tomorrow", "product_reposicao", "inactive"];
  out.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));

  return out.slice(0, 30);
}

export async function dismissNotification(key: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notification_dismissals").upsert({ barber_id: user.id, notification_key: key });
}
