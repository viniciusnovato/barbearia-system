# Plano de Ação — Sistema de Visagismo

## Contexto

O projeto atual contém apenas a especificação de regras de negócio em [PROJETO-RESUMO.MD](PROJETO-RESUMO.MD). Não existe código. O objetivo deste plano é definir, em fases executáveis, como construir o sistema usando **Supabase** (banco, auth, storage, edge functions), **Vercel** (deploy do front e API) e **Gemini** (transcrição + análise semântica), entregando o fluxo descrito: áudio → transcrição → blocos → classificação por campo → dossiê revisável → PDF.

A entrega final é um app web responsivo (otimizado para iPad — desenho sobre foto) onde o barbeiro grava/importa áudio, revisa campos sugeridos pela IA e gera um dossiê PDF premium por atendimento.

---

## Stack recomendada

- **Frontend**: Next.js 15 (App Router) + React + TypeScript + Tailwind + shadcn/ui — deploy na Vercel.
- **Backend/DB**: Supabase (Postgres + RLS + Auth + Storage + Edge Functions em Deno).
- **IA**: Google Gemini (`gemini-2.5-pro` para transcrição multimodal de áudio + análise; `gemini-2.5-flash` para tarefas leves/baratas).
- **Áudio**: `MediaRecorder` API (gravação ao vivo) + upload para Supabase Storage.
- **PDF**: `@react-pdf/renderer` (gerado server-side em route handler na Vercel).
- **Desenho no iPad**: `react-konva` ou `perfect-freehand` sobre `<canvas>` com Pointer Events (suporte a Apple Pencil).

---

## Arquitetura em alto nível

```
[iPad/Browser] ── grava áudio ──▶ [Next.js / Vercel] ──▶ [Supabase Storage]
                                          │
                                          ├─▶ [Edge Function: transcribe]  ─▶ Gemini (áudio→transcrição+blocos)
                                          ├─▶ [Edge Function: classify]    ─▶ Gemini (blocos→campos do dossiê)
                                          └─▶ [Postgres: dossiers, fields, blocks, media]

[Barbeiro revisa/edita] ──▶ [Aprovar] ──▶ [Route Handler: /api/pdf] ──▶ PDF gerado e salvo no Storage
```

Toda chamada Gemini fica em **Supabase Edge Functions** (não no front) para proteger a API key e centralizar prompts.

---

## Modelo de dados (Supabase / Postgres)

Tabelas principais (com RLS por `barber_id = auth.uid()`):

- `barbers` — perfil do profissional (id, nome, instagram, foto).
- `clients` — id, barber_id, nome, telefone, instagram, foto_principal_url, observações.
- `dossiers` — id, client_id, título, data, status (`rascunho`|`em_revisao`|`finalizado`), pdf_url.
- `audio_recordings` — id, dossier_id, tipo (`live`|`upload`), storage_path, duração, transcrição_completa.
- `transcript_blocks` — id, audio_id, ordem, falante (`barbeiro`|`cliente`|`indef`), texto, intenção_detectada, campo_alvo (FK lógica para `dossier_fields.key`).
- `dossier_fields` — id, dossier_id, secao (`diagnostico`|`analise_visagista`|`corte`|`barba`|`produtos`|`projeto_final`|`finalizacao`), key, valor, status (`vazio`|`sugerido`|`editado`|`aprovado`), origem_block_ids[].
- `media_assets` — id, dossier_id, tipo (`foto_cliente`|`referencia_corte`|`referencia_barba`|`produto`|`marcacao_ipad`), storage_path, ordem, aprovado_pdf (bool), parent_asset_id (para versões marcadas).
- `ipad_annotations` — id, asset_id (parent), nome_versao, vector_data (jsonb com strokes), preview_url.
- `products` — id, dossier_id, nome, descrição, foto_url.

Buckets de Storage: `audio/`, `client-photos/`, `references/`, `annotations/`, `pdfs/` — todos privados, acesso via signed URLs.

---

## Fases de implementação

### Fase 0 — Setup (1 dia)
1. `npx create-next-app@latest` com TypeScript + Tailwind + App Router.
2. Criar projeto Supabase, configurar Auth (email/senha + magic link).
3. Conectar repo à Vercel; configurar env vars (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`).
4. Instalar `@supabase/ssr`, `@supabase/supabase-js`, `@google/generative-ai`, `shadcn/ui`.
5. Migrations iniciais via Supabase CLI (`supabase/migrations/`).

### Fase 1 — Auth + CRUD de clientes (2 dias)
- Login do barbeiro.
- Lista de clientes com busca (nome/telefone/instagram).
- Criar/editar cliente, upload de foto principal.
- Página de perfil do cliente com histórico de dossiês.

### Fase 2 — Dossiê: estrutura e edição manual (2 dias)
- Criar dossiê vinculado ao cliente.
- Renderizar todas as seções (7.1 a 7.7 do spec) com campos editáveis.
- Status por campo (`vazio`/`sugerido`/`editado`/`aprovado`).
- Validação de campos obrigatórios (seção 12 do spec) antes de finalizar.

### Fase 3 — Captura de áudio (2 dias)
- Botão "Gravar conversa" usando `MediaRecorder` (formato `audio/webm` ou `audio/mp4`).
- Upload de áudio externo (WhatsApp/celular): drag-drop + input file.
- Upload chunked direto para Supabase Storage com signed upload URL.
- Tela de progresso e player para revisar áudio antes de processar.

### Fase 4 — Transcrição + classificação por IA (3-4 dias)
- **Edge Function `transcribe-audio`**: recebe `audio_id`, baixa do Storage, envia para Gemini com prompt pedindo:
  - transcrição completa
  - separação por falante
  - quebra em blocos de sentido
  - intenção provável de cada bloco (catálogo da seção 14.1)
- Persistir em `transcript_blocks`.
- **Edge Function `classify-fields`**: para cada bloco, mapear ao campo correto do dossiê via prompt estruturado com schema JSON dos campos. Usar function calling / response schema do Gemini para garantir saída válida.
- Aplicar regras de ouro: ignorar ruído (14.2), consolidar repetições (14.3), sinalizar contradições (14.4).
- Marcar campos preenchidos como `status='sugerido'` com `origem_block_ids` para rastreabilidade.

### Fase 5 — Revisão humana (2 dias)
- UI lado a lado: campo + blocos de origem (clicável para ver trecho da transcrição).
- Ações: editar, apagar sugestão, reatribuir bloco para outro campo, aprovar individual, aprovar tudo.
- Indicador visual de status por campo (cores).

### Fase 6 — Anotação visual no iPad (3 dias)
- Componente `<PhotoAnnotator>` baseado em `react-konva` ou canvas puro.
- Ferramentas: caneta livre, borracha, seta, círculo, linha, texto, marcador, undo/redo.
- Suporte a Apple Pencil via Pointer Events (`pointerType === 'pen'`, pressão).
- Foto original imutável; cada salvamento cria registro em `ipad_annotations` + flatten PNG salvo como `media_asset` filho.
- Galeria de versões com renomear/excluir/comparar.

### Fase 7 — Geração de PDF (2 dias)
- Route handler `app/api/dossier/[id]/pdf/route.ts` usa `@react-pdf/renderer`.
- Template premium com capa, seções, fotos aprovadas, marcações selecionadas (seção 16 do spec).
- Excluir: transcrição bruta, campos vazios, marcações não aprovadas.
- Salvar PDF em `pdfs/` bucket; expor signed URL no dossiê.

### Fase 8 — Polimento (1-2 dias)
- Layout responsivo iPad-first.
- Estados de erro/loading.
- Logs de erro Gemini com retry.
- Testes manuais do fluxo completo (gravar → revisar → PDF).

**Estimativa total**: ~18-20 dias de dev focado.

---

## Arquivos críticos a criar (estrutura inicial)

```
visagismo-app/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── clientes/page.tsx                  # lista + busca
│   ├── clientes/[id]/page.tsx             # perfil + histórico
│   ├── dossie/[id]/page.tsx               # editor do dossiê
│   ├── dossie/[id]/gravar/page.tsx        # captura de áudio
│   ├── dossie/[id]/anotar/[assetId]/page.tsx  # iPad annotator
│   └── api/dossier/[id]/pdf/route.ts      # geração de PDF
├── components/
│   ├── DossierSection.tsx
│   ├── FieldCard.tsx                      # campo + status + origem
│   ├── AudioRecorder.tsx
│   ├── PhotoAnnotator.tsx
│   └── TranscriptViewer.tsx
├── lib/
│   ├── supabase/{client,server,admin}.ts
│   ├── gemini/{transcribe,classify,prompts}.ts
│   └── pdf/DossierPdf.tsx
├── supabase/
│   ├── migrations/0001_init.sql
│   └── functions/
│       ├── transcribe-audio/index.ts
│       └── classify-fields/index.ts
└── PLANO-DE-ACAO.md
```

---

## Prompts Gemini (esqueleto)

**Transcrição** (`gemini-2.5-pro`, input áudio):
- "Transcreva o áudio. Identifique falantes (barbeiro/cliente). Quebre em blocos curtos de sentido. Para cada bloco, classifique a intenção entre: [lista da seção 14.1]. Retorne JSON conforme schema."

**Classificação por campo** (`gemini-2.5-flash`, batch de blocos):
- Schema JSON com todas as `keys` de campos.
- Instrução: "Resuma o(s) bloco(s) em linguagem profissional para o campo X seguindo as regras da seção 8.X. Não copie a fala literal. Se nada se aplica, retorne null."

---

## Verificação end-to-end

1. **Setup**: `pnpm dev` roda local, `vercel deploy` publica preview.
2. **Auth**: criar barbeiro, login funciona.
3. **Cliente**: criar Lucas Silva, anexar foto.
4. **Áudio ao vivo**: gravar 2 min de conversa simulada, salvar.
5. **Transcrição**: Edge Function processa, blocos aparecem no banco.
6. **Classificação**: campos do dossiê aparecem com `status='sugerido'`.
7. **Revisão**: editar campo, reatribuir bloco, aprovar.
8. **iPad**: abrir foto, desenhar com Pencil, salvar versão, marcar para PDF.
9. **PDF**: clicar "Gerar Dossiê PDF", baixar, validar capa + seções + sem transcrição bruta.
10. **Histórico**: voltar ao perfil do cliente, dossiê listado e reabrível.

---

## Riscos e decisões a confirmar

- **Custo Gemini**: áudios longos podem ser caros — considerar limite de duração ou chunking.
- **Latência**: transcrição de áudio de 30 min pode levar minutos; UI precisa de estado assíncrono (jobs em fila ou polling).
- **iPad/Apple Pencil**: validar Pointer Events em Safari iOS — fallback para touch se necessário.
- **PDF server-side**: `@react-pdf/renderer` na Vercel funciona, mas se precisar de fontes custom/imagens grandes, avaliar runtime Node em vez de Edge.
