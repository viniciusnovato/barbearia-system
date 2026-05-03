/**
 * Definição estática das seções e campos do dossiê de visagismo.
 * Reflete as regras 7.x e 8.x do PROJETO-RESUMO.MD.
 *
 * Cada `key` é o identificador único usado em `dossier_fields.field_key`
 * e também o que a IA retorna ao classificar blocos.
 */

export type SectionId =
  | "diagnostico"
  | "analise_visagista"
  | "corte"
  | "barba"
  | "produtos"
  | "projeto_final"
  | "finalizacao";

export interface FieldDef {
  key: string;
  label: string;
  helper?: string;
  required?: boolean;
  /** Triggers de fala que a IA usa pra ancorar este campo. */
  triggers?: string[];
}

export interface SectionDef {
  id: SectionId;
  title: string;
  subtitle: string;
  fields: FieldDef[];
}

export const DOSSIER_SECTIONS: SectionDef[] = [
  {
    id: "diagnostico",
    title: "Diagnóstico",
    subtitle: "Contexto, objetivos e percepção atual da imagem.",
    fields: [
      { key: "momento_vida", label: "Momento de vida atual", helper: "Resuma o contexto atual do cliente em 1-2 frases.", triggers: ["estou numa fase", "agora eu", "recentemente", "mudei de", "transição"] },
      { key: "objetivo_imagem", label: "Objetivo de imagem", helper: "Intenção principal que o cliente quer transmitir.", required: true, triggers: ["quero parecer", "quero transmitir", "preciso passar", "quero ser visto como"] },
      { key: "profissao_contexto", label: "Profissão / contexto profissional", helper: "Trabalho, rotina, público e ambiente social.", required: true, triggers: ["eu trabalho com", "meus clientes são", "tenho reuniões", "sou advogado", "sou empresário"] },
      { key: "imagem_comunica", label: "Como a imagem atual comunica", helper: "Percepção atual — como ele se vê, como acha que o veem.", required: true, triggers: ["hoje eu acho que pareço", "as pessoas acham que eu", "minha imagem passa"] },
      { key: "pontos_fortes", label: "Pontos fortes da imagem atual", helper: "Elementos positivos já presentes.", triggers: ["gosto do meu", "sempre elogiam meu", "minha barba cresce bem", "meu cabelo tem volume"] },
      { key: "pontos_fracos", label: "Pontos que enfraquecem a presença", helper: "Aspectos que prejudicam a comunicação visual.", triggers: ["não gosto", "me incomoda", "parece desleixado", "minha barba falha"] },
    ],
  },
  {
    id: "analise_visagista",
    title: "Análise Visagista",
    subtitle: "Leitura técnica do rosto e harmonia estética.",
    fields: [
      { key: "formato_rosto", label: "Formato do rosto", helper: "Oval, redondo, quadrado, retangular, triangular, diamante, coração." },
      { key: "estrutura_facial", label: "Estrutura facial", helper: "Mandíbula, testa, maçãs do rosto, queixo, traços." },
      { key: "proporcoes_visuais", label: "Proporções visuais", helper: "Relação entre cabelo, rosto, barba e volume." },
      { key: "harmonia_estetica", label: "Harmonia estética", helper: "Síntese da combinação entre traços, cabelo, barba e objetivo." },
      { key: "caracteristicas_dominantes", label: "Características dominantes", helper: "Até 5 características visuais principais." },
      { key: "estilos_que_favorecem", label: "Estilos que favorecem", helper: "Direções estéticas compatíveis (cruzar com objetivo + rosto + preferências)." },
    ],
  },
  {
    id: "corte",
    title: "Direcionamento de Corte",
    subtitle: "Estilo, estrutura e referências para o corte.",
    fields: [
      { key: "corte_estilo_ideal", label: "Estilo de corte ideal", helper: "Nome e conceito do corte recomendado, com justificativa.", required: true },
      { key: "corte_estrutura", label: "Estrutura do corte", helper: "Laterais, topo, volume, textura, acabamento, manutenção.", required: true },
    ],
  },
  {
    id: "barba",
    title: "Direcionamento de Barba",
    subtitle: "Estilo e linha de contorno da barba.",
    fields: [
      { key: "barba_estilo_ideal", label: "Estilo de barba ideal", helper: "Cruzar preferência do cliente com formato do rosto e objetivo.", required: true, triggers: ["gosto de barba cheia", "minha barba falha", "quero algo mais alinhado"] },
      { key: "barba_linha_contorno", label: "Linha de contorno", helper: "Bochecha, pescoço, contorno lateral, conexão com cabelo, simetria, altura." },
    ],
  },
  {
    id: "produtos",
    title: "Produtos",
    subtitle: "Recomendações para manutenção do visual.",
    fields: [],
  },
  {
    id: "projeto_final",
    title: "Projeto Final",
    subtitle: "Síntese estratégica da nova imagem.",
    fields: [
      { key: "direcao_visual", label: "Direção visual recomendada", helper: "Síntese da direção estética final.", required: true },
      { key: "comunicacao_nova_imagem", label: "Comunicação da nova imagem", helper: "Como o cliente será percebido depois do direcionamento." },
      { key: "estilo_visual_estrategico", label: "Estilo visual estratégico", helper: "Nome ou conceito do posicionamento (ex: Autoridade acessível)." },
      { key: "resultado_esperado", label: "Resultado esperado", helper: "Transformação esperada.", required: true },
    ],
  },
  {
    id: "finalizacao",
    title: "Finalização",
    subtitle: "Instruções técnicas e ajustes pessoais.",
    fields: [
      { key: "direcionamento_tecnico", label: "Direcionamento técnico", helper: "Instrução técnica para execução do corte e barba.", required: true },
      { key: "ajustes_personalizados", label: "Ajustes personalizados", helper: "Observações específicas para esse cliente." },
    ],
  },
];

/** Lista plana de todos os campos para validações e seed. */
export const ALL_FIELDS = DOSSIER_SECTIONS.flatMap((s) =>
  s.fields.map((f) => ({ section: s.id, ...f })),
);

/** Mapa rápido por field_key. */
export const FIELD_BY_KEY = Object.fromEntries(
  ALL_FIELDS.map((f) => [f.key, f]),
);

/** Lista de field_keys obrigatórios (regra 12). */
export const REQUIRED_FIELDS = ALL_FIELDS.filter((f) => f.required).map((f) => f.key);

/**
 * Decide se um campo está "pronto" para finalizar o dossiê.
 *
 * Regra:
 * - `vazio` → não pronto
 * - `sugerido` (IA preencheu) → não pronto (precisa revisão explícita)
 * - `editado` (barbeiro tocou) → PRONTO (já é uma decisão consciente)
 * - `aprovado` → PRONTO
 * - `conflito` → não pronto (IA detectou contradição, precisa resolver)
 */
export function isFieldReady(f: { status?: string | null; value?: string | null } | null | undefined): boolean {
  if (!f || !f.value) return false;
  return f.status === "editado" || f.status === "aprovado";
}

export const INTENT_CATALOG = [
  "contexto_vida",
  "objetivo_imagem",
  "profissao",
  "incomodo_visual",
  "preferencia_estetica",
  "rejeicao_estetica",
  "analise_tecnica",
  "recomendacao_corte",
  "recomendacao_barba",
  "produto",
  "ajuste_personalizado",
  "resultado_desejado",
  "ruido",
] as const;

export type IntentId = (typeof INTENT_CATALOG)[number];
