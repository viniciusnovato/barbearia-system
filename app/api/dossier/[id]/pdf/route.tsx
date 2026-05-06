import { NextResponse } from "next/server";
import { Document, Page, View, Text, StyleSheet, Image, Font, pdf } from "@react-pdf/renderer";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { DOSSIER_SECTIONS, REQUIRED_FIELDS, isFieldReady } from "@/lib/dossier/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const isPreview = url.searchParams.get("preview") === "1";
  const supabase = await createServerSupabase();

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("id, title, scheduled_date, status, clients!inner(id, full_name, instagram, photo_url)")
    .eq("id", id)
    .maybeSingle();
  if (!dossier) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Defesa em profundidade: PDF oficial só sai quando finalizado.
  // Modo preview (?preview=1) gera sem salvar e sem atualizar o dossiê.
  if (!isPreview && dossier.status !== "finalizado") {
    // Re-checa obrigatórios para mensagem detalhada
    const { data: fieldsCheck } = await supabase
      .from("dossier_fields")
      .select("field_key, status, value")
      .eq("dossier_id", id);
    const missing = REQUIRED_FIELDS.filter((k) => !isFieldReady(fieldsCheck?.find((x) => x.field_key === k)));
    return NextResponse.json(
      {
        error: "Dossiê ainda não foi finalizado",
        status: dossier.status,
        missing_required: missing,
        hint: "Aprove os campos obrigatórios e clique em Finalizar dossiê. Use ?preview=1 para um PDF de rascunho.",
      },
      { status: 409 },
    );
  }

  const client = Array.isArray(dossier.clients) ? dossier.clients[0] : dossier.clients;

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: fields }, { data: assets }, { data: barberRow }] = await Promise.all([
    supabase.from("dossier_fields").select("section, field_key, value, status").eq("dossier_id", id),
    supabase.from("media_assets").select("id, kind, storage_path, bucket, caption").eq("dossier_id", id).eq("included_in_pdf", true).order("created_at"),
    supabase.from("barbers").select("full_name, instagram, logo_path").eq("id", user?.id ?? "").maybeSingle(),
  ]);

  // Use admin para baixar mídia (PDF roda server-side, evitar problema com signed URLs)
  const admin = createAdminSupabase();
  async function fetchImage(bucket: string, path: string): Promise<string | null> {
    try {
      const { data, error } = await admin.storage.from(bucket).download(path);
      if (error || !data) return null;
      const buf = Buffer.from(await data.arrayBuffer());
      const mime = data.type || (path.endsWith(".png") ? "image/png" : "image/jpeg");
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch { return null; }
  }

  const clientPhotoData = client?.photo_url ? await fetchImage("client-photos", client.photo_url) : null;
  const logoData = barberRow?.logo_path ? await fetchImage("barber-assets", barberRow.logo_path) : null;
  const assetData = await Promise.all(
    (assets ?? []).map(async (a) => ({
      ...a,
      dataUrl: await fetchImage(a.bucket, a.storage_path),
    })),
  );

  const fieldByKey = new Map((fields ?? []).map((f) => [f.field_key, f]));

  const stream = await pdf(
    <DossierDoc
      title={dossier.title}
      scheduled={dossier.scheduled_date}
      clientName={client?.full_name ?? ""}
      clientInstagram={client?.instagram ?? null}
      clientPhotoData={clientPhotoData}
      barberName={barberRow?.full_name ?? user?.email ?? ""}
      barberInstagram={barberRow?.instagram ?? null}
      sections={DOSSIER_SECTIONS}
      fieldByKey={fieldByKey}
      assets={assetData}
      isPreview={isPreview}
      logoData={logoData}
    />,
  ).toBlob();

  const arrayBuffer = await stream.arrayBuffer();

  // Salva no bucket pdfs apenas para PDFs definitivos (não-preview)
  if (user && !isPreview) {
    const path = `${user.id}/${id}/dossie-${Date.now()}.pdf`;
    await admin.storage.from("pdfs").upload(path, arrayBuffer, { upsert: false, contentType: "application/pdf" });
    await supabase.from("dossiers").update({ pdf_url: path }).eq("id", id);
    // Histórico
    await supabase.from("pdf_versions").insert({
      dossier_id: id,
      storage_path: path,
      generated_by: user.id,
    });
  }

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="dossie-${id}.pdf"`,
    },
  });
}

// ============================================================
// Document component
// ============================================================
const styles = StyleSheet.create({
  cover: { flex: 1, padding: 56, backgroundColor: "#17150F", color: "#FAFAF7", justifyContent: "space-between" },
  coverEyebrow: { fontFamily: "Helvetica", fontSize: 10, letterSpacing: 4, color: "#A8A193", textTransform: "uppercase" },
  coverTitle: { fontFamily: "Times-Roman", fontSize: 48, lineHeight: 1.1, marginTop: 24 },
  coverSub: { fontFamily: "Helvetica", fontSize: 12, color: "#D4CEC0", marginTop: 16 },
  coverFoot: { borderTop: "1pt solid #565145", paddingTop: 18 },
  coverMeta: { flexDirection: "row", justifyContent: "space-between", color: "#A8A193", fontSize: 9, fontFamily: "Helvetica", textTransform: "uppercase", letterSpacing: 2 },

  page: { padding: 56, backgroundColor: "#FAFAF7", fontFamily: "Helvetica", fontSize: 10, color: "#17150F" },
  sectionEyebrow: { fontSize: 9, letterSpacing: 3, color: "#7A7466", textTransform: "uppercase" },
  sectionTitle: { fontFamily: "Times-Roman", fontSize: 26, marginTop: 6, marginBottom: 4 },
  sectionSub: { fontSize: 10, color: "#565145", marginBottom: 22 },

  field: { marginBottom: 18 },
  fieldLabel: { fontSize: 8, letterSpacing: 2, color: "#7A7466", textTransform: "uppercase", marginBottom: 4 },
  fieldValue: { fontFamily: "Times-Roman", fontSize: 13, lineHeight: 1.5, color: "#17150F" },
  fieldEmpty: { fontFamily: "Times-Roman", fontSize: 11, fontStyle: "italic", color: "#A8A193" },

  pageHead: { flexDirection: "row", justifyContent: "space-between", borderBottom: "0.5pt solid #D4CEC0", paddingBottom: 10, marginBottom: 18 },
  pageHeadL: { fontSize: 9, letterSpacing: 2, color: "#565145", textTransform: "uppercase" },
  pageHeadR: { fontSize: 9, color: "#7A7466", fontFamily: "Helvetica" },

  imgRow: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  imgItem: { width: 220, marginRight: 10, marginBottom: 12 },
  imgCaption: { fontSize: 8, letterSpacing: 1.5, color: "#7A7466", textTransform: "uppercase", marginTop: 4 },
});

interface DossierDocProps {
  title: string;
  scheduled: string;
  clientName: string;
  clientInstagram: string | null;
  clientPhotoData: string | null;
  barberName: string;
  barberInstagram: string | null;
  sections: typeof DOSSIER_SECTIONS;
  fieldByKey: Map<string, { value: string | null; status: string }>;
  assets: { kind: string; dataUrl: string | null; caption: string | null }[];
  isPreview: boolean;
  logoData: string | null;
}

function DossierDoc({ title, scheduled, clientName, clientInstagram, clientPhotoData, barberName, barberInstagram, sections, fieldByKey, assets, isPreview, logoData }: DossierDocProps) {
  const date = new Date(scheduled).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const photos = assets.filter((a) => a.kind === "foto_cliente" && a.dataUrl);
  const annotations = assets.filter((a) => a.kind === "marcacao_ipad" && a.dataUrl);
  const refsCorte = assets.filter((a) => a.kind === "referencia_corte" && a.dataUrl);
  const refsBarba = assets.filter((a) => a.kind === "referencia_barba" && a.dataUrl);

  return (
    <Document title={title} author={barberName}>
      {/* Cover */}
      <Page size="A4" style={styles.cover}>
        <View>
          {logoData && (
            <View style={{ marginBottom: 32, width: 120, height: 60 }}>
              <Image src={logoData} style={{ maxWidth: "100%", maxHeight: "100%" }} />
            </View>
          )}
          <Text style={styles.coverEyebrow}>Visagismo · Dossiê{isPreview ? " · Rascunho" : ""}</Text>
          <Text style={styles.coverTitle}>{title}</Text>
          <Text style={styles.coverSub}>Cliente · {clientName}</Text>
          {isPreview && <Text style={[styles.coverSub, { marginTop: 6, color: "#E5BF6E" }]}>Pré-visualização — não distribuir</Text>}
        </View>
        <View style={styles.coverFoot}>
          <View style={styles.coverMeta}>
            <Text>{date}</Text>
            <Text>{barberName}{barberInstagram ? ` · ${barberInstagram}` : ""}</Text>
          </View>
        </View>
      </Page>

      {/* Sections */}
      {sections.map((s) => {
        const visibleFields = s.fields.filter((f) => {
          const r = fieldByKey.get(f.key);
          return r && r.value && r.status !== "vazio";
        });
        if (visibleFields.length === 0 && s.id !== "analise_visagista") return null;

        return (
          <Page key={s.id} size="A4" style={styles.page}>
            <View style={styles.pageHead}>
              <Text style={styles.pageHeadL}>{s.title}</Text>
              <Text style={styles.pageHeadR}>{clientName} · {date}</Text>
            </View>
            <Text style={styles.sectionEyebrow}>Seção</Text>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionSub}>{s.subtitle}</Text>

            {visibleFields.map((f) => {
              const r = fieldByKey.get(f.key);
              return (
                <View key={f.key} style={styles.field} wrap={false}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  {r?.value ? <Text style={styles.fieldValue}>{r.value}</Text> : <Text style={styles.fieldEmpty}>—</Text>}
                </View>
              );
            })}

            {/* Referências de corte na seção corte */}
            {s.id === "corte" && refsCorte.length > 0 && (
              <View style={styles.imgRow}>
                {refsCorte.slice(0, 3).map((a, i) => a.dataUrl && (
                  <View key={`refc-${i}`} style={styles.imgItem} wrap={false}>
                    <Image src={a.dataUrl} />
                    <Text style={styles.imgCaption}>{a.caption ?? `Referência ${i + 1}`}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Referências de barba na seção barba */}
            {s.id === "barba" && refsBarba.length > 0 && (
              <View style={styles.imgRow}>
                {refsBarba.slice(0, 2).map((a, i) => a.dataUrl && (
                  <View key={`refb-${i}`} style={styles.imgItem} wrap={false}>
                    <Image src={a.dataUrl} />
                    <Text style={styles.imgCaption}>{a.caption ?? `Referência ${i + 1}`}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Insere foto na seção análise visagista */}
            {s.id === "analise_visagista" && (photos.length > 0 || clientPhotoData) && (
              <View style={styles.imgRow}>
                {clientPhotoData && (
                  <View style={styles.imgItem} wrap={false}>
                    <Image src={clientPhotoData} />
                    <Text style={styles.imgCaption}>Foto · referência principal</Text>
                  </View>
                )}
                {photos.slice(0, 4).map((a, i) => a.dataUrl && (
                  <View key={i} style={styles.imgItem} wrap={false}>
                    <Image src={a.dataUrl} />
                    <Text style={styles.imgCaption}>{a.caption ?? "Foto do cliente"}</Text>
                  </View>
                ))}
                {annotations.slice(0, 4).map((a, i) => a.dataUrl && (
                  <View key={`ann-${i}`} style={styles.imgItem} wrap={false}>
                    <Image src={a.dataUrl} />
                    <Text style={styles.imgCaption}>Anotação · {a.caption ?? "iPad"}</Text>
                  </View>
                ))}
              </View>
            )}
          </Page>
        );
      })}
    </Document>
  );
}
