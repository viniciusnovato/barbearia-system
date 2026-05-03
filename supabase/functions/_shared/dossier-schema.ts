// Espelho do lib/dossier/schema.ts para uso dentro das Edge Functions (Deno).
// Mantém o catálogo de campos sincronizado entre Next e Edge.

export const FIELD_KEYS = [
  // Diagnóstico
  { key: "momento_vida", label: "Momento de vida atual" },
  { key: "objetivo_imagem", label: "Objetivo de imagem" },
  { key: "profissao_contexto", label: "Profissão / contexto profissional" },
  { key: "imagem_comunica", label: "Como a imagem atual comunica" },
  { key: "pontos_fortes", label: "Pontos fortes da imagem atual" },
  { key: "pontos_fracos", label: "Pontos que enfraquecem a presença" },
  // Análise visagista
  { key: "formato_rosto", label: "Formato do rosto" },
  { key: "estrutura_facial", label: "Estrutura facial" },
  { key: "proporcoes_visuais", label: "Proporções visuais" },
  { key: "harmonia_estetica", label: "Harmonia estética" },
  { key: "caracteristicas_dominantes", label: "Características dominantes" },
  { key: "estilos_que_favorecem", label: "Estilos que favorecem" },
  // Corte
  { key: "corte_estilo_ideal", label: "Estilo de corte ideal" },
  { key: "corte_estrutura", label: "Estrutura do corte" },
  // Barba
  { key: "barba_estilo_ideal", label: "Estilo de barba ideal" },
  { key: "barba_linha_contorno", label: "Linha de contorno" },
  // Projeto final
  { key: "direcao_visual", label: "Direção visual recomendada" },
  { key: "comunicacao_nova_imagem", label: "Comunicação da nova imagem" },
  { key: "estilo_visual_estrategico", label: "Estilo visual estratégico" },
  { key: "resultado_esperado", label: "Resultado esperado" },
  // Finalização
  { key: "direcionamento_tecnico", label: "Direcionamento técnico" },
  { key: "ajustes_personalizados", label: "Ajustes personalizados" },
] as const;

export const INTENTS = [
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

export const FIELD_LABEL_BY_KEY = Object.fromEntries(FIELD_KEYS.map((f) => [f.key, f.label]));
