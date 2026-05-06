import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: clients } = await supabase
    .from("clients_with_status")
    .select("full_name, phone, instagram, last_visit_at, days_since_visit, client_status, next_return_at, next_return_note, notes, created_at")
    .order("full_name");

  const { data: dossierCounts } = await supabase
    .from("dossiers")
    .select("client_id");
  const counts = new Map<string, number>();
  (dossierCounts ?? []).forEach((d: { client_id: string }) => {
    counts.set(d.client_id, (counts.get(d.client_id) ?? 0) + 1);
  });

  const headers = [
    "Nome",
    "Telefone",
    "Instagram",
    "Status",
    "Última visita",
    "Dias desde visita",
    "Próximo retorno",
    "Observação retorno",
    "Total dossiês",
    "Cadastrado em",
    "Notas",
  ];

  const lines: string[] = [headers.join(",")];

  // Re-fetch com id pra cruzar com counts
  const { data: clientsWithId } = await supabase
    .from("clients_with_status")
    .select("id, full_name, phone, instagram, last_visit_at, days_since_visit, client_status, next_return_at, next_return_note, notes, created_at")
    .order("full_name");

  for (const c of (clientsWithId ?? [])) {
    const row = [
      c.full_name,
      c.phone ?? "",
      c.instagram ?? "",
      c.client_status ?? "",
      c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString("pt-BR") : "",
      c.days_since_visit ?? "",
      c.next_return_at ? new Date(c.next_return_at).toLocaleDateString("pt-BR") : "",
      c.next_return_note ?? "",
      counts.get(c.id) ?? 0,
      new Date(c.created_at).toLocaleDateString("pt-BR"),
      c.notes ?? "",
    ];
    lines.push(row.map(csvEscape).join(","));
  }

  // BOM pra abrir certo no Excel
  const csv = "﻿" + lines.join("\n");
  const filename = `clientes-visagismo-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
