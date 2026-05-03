# Visagismo · Design System

Design system do app de consultoria de imagem masculina para barbeiros.

## Filosofia

Editorial, sóbrio, masculino. Pensado como **ferramenta profissional**, não app de salão. Referências: Linear, Arc, Things 3, editoriais GQ/Esquire, Aesop.

- **Idioma único**: pt-BR.
- **iPad-first**: todos os toques mínimos 44pt; suporte completo a Apple Pencil nas anotações.
- **IA visível mas não dominante**: tudo que vem da IA é sinalizado para o barbeiro revisar conscientemente.

## Estrutura

```
design-system/
├── tokens.css                 # CSS variables (cores, tipo, espaço, sombra, raio, motion)
├── tailwind.config.ts         # config Tailwind consumindo os tokens
├── preview.html               # preview standalone — abra no navegador para ver o sistema vivo
├── lib/
│   └── cn.ts                  # helper para merge de classes
├── components/
│   ├── Button.tsx             # primary, secondary, ghost, destructive, ai (com shimmer)
│   ├── StatusPill.tsx         # vazio · sugerido · editado · aprovado · conflito
│   ├── AIIndicator.tsx        # selo "Sugerido pela IA" com 3 estados
│   ├── FieldCard.tsx          # card de campo do dossiê (coração da UI)
│   ├── AudioRecorder.tsx      # gravador com waveform reativa
│   ├── PhotoAnnotator.tsx     # canvas + Apple Pencil (Pointer Events)
│   └── index.ts
└── README.md
```

## Como ver agora (sem dependências)

```bash
open "design-system/preview.html"
```

Mostra paleta, tipografia, todos os componentes em estados e variantes, tema claro/escuro alternável.

## Como usar no Next.js (Fase 0 do plano)

1. Copie `tokens.css` para `app/globals.css` (ou faça `@import`).
2. Use `tailwind.config.ts` como base do projeto.
3. Importe componentes:

```tsx
import { Button, FieldCard, StatusPill, AudioRecorder } from "@/design-system/components";
```

4. Adicione ao `<html>` do layout para iPad-first:

```tsx
<html lang="pt-BR" data-theme="light">
```

5. Carregue as fontes em `app/layout.tsx`:

```tsx
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
```

## Tokens-chave

### Cores

| Token | Uso |
|---|---|
| `primary-500` (bronze #8E6A30) | Ações principais, foco editorial, gradiente do avatar |
| `ai-500` (índigo #535B89) | Tudo conduzido por IA, distinto da primária |
| `neutral-50→950` | Texto, fundos, bordas — tons quentes (off-white, não branco) |
| `status-{empty,suggested,edited,approved,conflict}` | Sinalização do estado de cada campo do dossiê |

### Tipografia

| Família | Uso |
|---|---|
| **Fraunces** (display serifada) | Títulos, valores dos campos do dossiê, capa do PDF |
| **Inter** (sans) | UI geral |
| **JetBrains Mono** | Timestamps, IDs, metadados, contador do gravador |

### Status do campo (a regra mais importante do produto)

Cada `FieldCard` carrega um de cinco estados:

- `vazio` — neutro cinza, espera preenchimento
- `sugerido` — borda índigo, badge "IA", aguarda revisão
- `editado` — borda âmbar, barbeiro modificou a sugestão
- `aprovado` — borda verde, validado e pronto para PDF
- `conflito` — borda vermelha-terracota, IA detectou contradição na fala (regra 14.4 do spec)

## Princípios de interação

1. **Vazio nunca é vazio**: empty states sempre indicam o próximo passo.
2. **Rastreabilidade**: clicar em "Ver origem" num campo destaca o(s) bloco(s) da transcrição que o geraram.
3. **Aprovar com 1 toque**: revisão deve ser rápida — botão "Aprovar" sempre visível.
4. **IA marcada**: nunca esconda o que veio da IA. O barbeiro sempre sabe.
5. **Tipografia editorial nos valores**: o conteúdo do dossiê é apresentado em Fraunces para reforçar a sensação de "isso é uma entrega premium", não "um formulário".

## Não fazer

- Sem ícones de tesoura/navalha/pente como decoração.
- Sem gradientes neon, sem glassmorphism exagerado.
- Sem cores berrantes (sofisticação > vibração).
- Sem texto corrido nos campos — UI espelha a regra do produto: "campo é resposta organizada, não anotação livre".
- Sem azul corporativo genérico.

## Padrões iPad / Apple Pencil

A UI é **iPad-first**. Decisões implementadas:

- **Pointer Events em tudo**: nunca `mousedown`/`touchstart` separados. Um listener cobre mouse, dedo e Pencil.
- **Pressão dinâmica**: `event.pressure` mapeia para `lineWidth` da caneta. Em mouse usa pressão constante (0.7), em Pencil usa o valor real.
- **Palm rejection**: durante um traço com Pencil, eventos `pointerType === "touch"` concorrentes são ignorados.
- **`touch-action: none`** nos canvases de desenho — evita scroll acidental durante a anotação.
- **Áreas de toque mínimas**: 44pt em toda UI interativa (`spacing.touch`).
- **Modo destro/canhoto**: o `PhotoAnnotator` permite alternar a posição da toolbar (lado dominante da mão). Veja o toggle "Destra/Canhota" no preview.
- **Layout landscape**: editor de dossiê usa grid 240px / 1fr / 320px (nav · campos · transcrição). Em portrait colapsa nav e transcrição em sheets/drawers.
- **Foto original imutável**: o background do canvas é uma camada à parte; cada salvamento gera uma nova versão (PNG flatten + jsonb com strokes).
- **Destaque cruzado**: hover num bloco da transcrição realça o campo de origem, e vice-versa (rastreabilidade IA).

## Próximos componentes (a criar conforme as fases avançam)

- `DossierSection` — wrapper de seção colapsável com progresso
- `TranscriptViewer` — lista de blocos com falante e intenção (versão React do que está no layout iPad do preview)
- `DossierTimeline` — histórico vertical do cliente
- `PDFPreview` — pré-visualização A4 do dossiê final
- Inputs, Select, Combobox, Tabs, Dialog, Sheet, Toast (shadcn/ui customizado para os tokens)
