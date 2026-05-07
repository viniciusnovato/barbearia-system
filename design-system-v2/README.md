# Visagismo · Design System v2

Repensado do zero. **Não está aplicado no app** — só nesta pasta. Aprove e a gente migra.

## Como ver agora

```bash
open "design-system-v2/preview.html"
```

Abre no navegador, mostra paleta, tipografia, botões, cards, status, gravador de áudio e — o ponto principal — todos os estados de **loading e processamento**. Tem um botão "Alternar tema" no canto pra trocar entre dark e light.

## Filosofia

A v1 era **editorial/luxo**: serif Fraunces, bronze, off-white quente, sombras suaves. Premiava sensação de "isto é uma entrega cara". Bom pra capa de PDF, custoso pra UI de trabalho.

A v2 é **ferramenta**, não vitrine. Referências: Linear, Notion, Vercel, Cron, n8n.

| Decisão                  | v1 (Visagismo)          | v2 (atual)                                    |
| ------------------------ | ----------------------- | --------------------------------------------- |
| **Paleta**               | bronze + off-white      | navy escuro + branco + cyan elétrico (acento) |
| **Tipografia display**   | Fraunces (serif)        | Inter (sans, peso 600)                        |
| **Tipografia UI**        | Inter                   | Inter (mesma — single family)                 |
| **Tipografia mono**      | JetBrains Mono          | JetBrains Mono (mantida — combina)            |
| **Tema padrão**          | claro                   | **escuro** (dark first)                       |
| **Sombras**              | grandes e quentes       | discretas e frias (1-3px blur)                |
| **Raio**                 | 14-28px                 | 4-12px (mais reto, mais técnico)              |
| **Densidade**            | aberta, editorial       | densa, tabular                                |
| **Status do dossiê**     | bordas coloridas        | mantém — agora com pílulas + ponto colorido   |
| **Gradientes neon**      | proibido                | proibido                                      |
| **Glassmorphism**        | proibido                | proibido                                      |
| **Loading explícito**    | toasts + skeletons      | **+ ProgressBar com etapas, AudioRecorder com fases visíveis, spinner em todo botão assíncrono** |

## Estrutura

```
design-system-v2/
├── tokens.css                    # CSS variables — paleta, tipografia, animações
├── tailwind.config.ts            # config Tailwind
├── preview.html                  # preview standalone (não precisa rodar nada)
├── lib/
│   └── cn.ts
└── components/
    ├── Button.tsx                # primary · secondary · ghost · destructive · accent + loading
    ├── ProgressBar.tsx           # determinada (com %) e indeterminada
    ├── Spinner.tsx               # 4 tamanhos, com ou sem label
    ├── Skeleton.tsx              # + FieldCardSkeleton + ClientRowSkeleton prontos
    ├── StatusPill.tsx            # vazio · sugerido · editado · aprovado · conflito
    ├── FieldCard.tsx             # card de campo do dossiê com ring por status
    ├── AudioRecorder.tsx         # gravador com 6 fases (idle → recording → uploading → transcribing → classifying → done/error)
    └── index.ts
```

## Tokens-chave

### Cores

| Token                      | Uso                                                              |
| -------------------------- | ---------------------------------------------------------------- |
| `primary-700` (#1E2A66)    | **Navy escuro.** Botões primários, foco, links importantes       |
| `primary-500` (#3949AB)    | Hover, estados ativos secundários                                |
| `accent-500` (#06B6D4)     | **Cyan elétrico.** Tudo IA, "processando", "ao vivo"             |
| `neutral-50→950` (slate)   | Cinzas frios — texto, bordas, fundos                             |
| `status-{empty,suggested,edited,approved,conflict}` | Estados do campo (mantidos com paleta nova) |

### Tipografia

| Família             | Uso                                          |
| ------------------- | -------------------------------------------- |
| **Inter**           | Tudo (UI + display). Pesos 400/500/600/700.  |
| **JetBrains Mono**  | Timestamps, IDs, métricas, barras de progresso, labels CAPS |

Sem serifa. Sensação tech, não editorial.

### Loading & feedback (a parte que motivou a v2)

A regra: **toda ação assíncrona mostra estado**. Sem isso o app parece travado.

- **`<ProgressBar value={62} label="Transcrevendo áudio" hint="62%" />`** — barra determinada com porcentagem.
- **`<ProgressBar />`** sem `value` — barra indeterminada (ex: enquanto não dá pra estimar).
- **`<Spinner label="Salvando" />`** — inline, herda cor.
- **`<Button loading>Salvar</Button>`** — botão troca pra spinner + "Processando…" automaticamente.
- **`<Skeleton />`** — placeholder com shimmer.
- **`<AudioRecorder phase="transcribing" progress={47} />`** — encapsula todo o pipeline de gravação numa peça só.

### Status do campo

Mantemos os 5 estados (`vazio · sugerido · editado · aprovado · conflito`). O que mudou:

- A cor de `sugerido` agora é **cyan** (era índigo) — alinha com o acento "IA / processando".
- A pílula ganhou um **ponto colorido** à esquerda. Mais legível em telas pequenas.
- O ring no card de campo virou `ring-1` em vez de `border` cheia — densidade maior.

## Princípios de interação (v2)

1. **Nunca silêncio**: toda ação > 200ms mostra spinner ou progress.
2. **Pipelines visíveis**: gravar áudio é 5 etapas — o usuário vê todas, não só "carregando".
3. **Densidade > respiro**: o app é uma ferramenta, não uma revista. Listas tabulares, espaçamento de 12-16px, não 32px.
4. **Mono pra dado**: timestamps, percentuais, IDs, labels CAPS — sempre em JetBrains Mono.
5. **Acento usado com parcimônia**: cyan só pra IA / "ativo" / "processando". Se aparecer demais, perde força.
6. **Dark first**: tema escuro é o default. Light mode existe mas é secundário.
7. **iPad-first segue**: 44pt mínimo, Pointer Events, palm rejection — herdado da v1.

## Não fazer (continua valendo)

- Sem ícones de tesoura/navalha/pente.
- Sem gradientes neon.
- Sem glassmorphism.
- Sem mais de uma cor de acento (cyan só).
- Sem texto corrido nos campos do dossiê.

## Como aplicar (quando você aprovar)

Resumão. Não execute agora — só pra você ver o tamanho do esforço.

1. **Substituir** `app/globals.css`: trocar `@import "../design-system/tokens.css"` por `../design-system-v2/tokens.css`.
2. **Substituir** `tailwind.config.ts`: copiar o de v2 pra raiz.
3. **Trocar fontes** em `app/layout.tsx`: remover `Fraunces`, manter só `Inter` e `JetBrains_Mono`.
4. **Remover** `font-display` (Fraunces) das classes que ainda usam — pesquisar `font-display` no app e trocar por nada (cai no Inter).
5. **Aplicar `data-theme="dark"`** como default no `<html>`.
6. **Rodar `pnpm build`** — Tailwind regenera as classes. Nada quebra porque os nomes de tokens são iguais (`primary-500`, `surface-card`, etc).
7. **Onde tem `<Toaster />` ou ações assíncronas sem feedback** — substituir por `<Button loading>` ou agregar `<ProgressBar>`.
8. **Ações específicas a integrar**:
   - **`/dossie/[id]/gravar`**: substituir `AudioCapture` por `<AudioRecorder>` (já tem suporte a `phase`/`progress`).
   - **Edge Function `transcribe-audio`**: já está atualizando `processing_progress` — só consumir esse valor no client e jogar no `<ProgressBar>`.
   - **Form actions com `useTransition`**: passar `pending` como `loading` nos botões.

Estimativa: ~2 horas de migração se não tiver surpresa. Maior risco é classes hardcoded de bronze (`text-primary-700` aplicado como cor textual em vez de fundo de botão) — vão ficar navy automaticamente, o que pode parecer estranho num primeiro look.

## Próximos componentes (depois da migração)

- `Tabs` — segmented control no estilo Linear.
- `Combobox` / `CommandMenu` — substitui o atual cmdk com a paleta nova.
- `Sheet` — drawer lateral pra mobile/iPad portrait.
- `Toast` — versão própria, hoje usa sonner.
- `EmptyState` — padronizar o "sem dados ainda" em todas as listas.
