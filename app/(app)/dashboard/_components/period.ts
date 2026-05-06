export function getPeriodRange(period: string): { start: string; end: string; label: string } {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  switch (period) {
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: start.toISOString(), end: end.toISOString(), label: "Mês passado" };
    }
    case "last_30":
      return { start: new Date(Date.now() - 30 * 86400_000).toISOString(), end: now.toISOString(), label: "Últimos 30 dias" };
    case "last_90":
      return { start: new Date(Date.now() - 90 * 86400_000).toISOString(), end: now.toISOString(), label: "Últimos 90 dias" };
    case "this_year":
      return { start: startOfYear.toISOString(), end: now.toISOString(), label: "Este ano" };
    case "this_month":
    default:
      return { start: startOfMonth.toISOString(), end: now.toISOString(), label: "Este mês" };
  }
}
