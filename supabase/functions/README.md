# Supabase Edge Functions — Visagismo

Funções serverless em Deno que rodam dentro da infra do Supabase. Usadas para:
- Proteger a `GEMINI_API_KEY` (nunca expor no front)
- Centralizar prompts e regras de IA
- Rodar perto do banco/Storage

## Estado atual

| Função | Estado | Quando entra |
|---|---|---|
| `health` | Stub funcional | Agora — só pra validar deploy |
| `transcribe-audio` | Esqueleto | **Fase 4** — transcrição + blocos via Gemini |
| `classify-fields` | Não criada ainda | **Fase 4** — mapear blocos → campos do dossiê |

## Setup local (uma vez)

```bash
# Instalar CLI
brew install supabase/tap/supabase

# Login (abre o browser)
supabase login

# Linkar o projeto
cd "/path/para/VISAGISMO APP"
supabase link --project-ref sruzplzwsntinpkoljpa

# Configurar secrets que as functions precisam
supabase secrets set GEMINI_API_KEY=<sua-chave-gemini>
supabase secrets list
```

## Deploy

```bash
# Deploy de uma função específica
supabase functions deploy health
supabase functions deploy transcribe-audio

# Deploy de todas
supabase functions deploy
```

## Teste

```bash
# Pegar a anon key do .env.local e o ref do projeto
ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d= -f2)

# Health check (não precisa de user)
curl -i -X POST \
  -H "Authorization: Bearer $ANON_KEY" \
  https://sruzplzwsntinpkoljpa.functions.supabase.co/health
```

Resposta esperada:
```json
{ "ok": true, "service": "visagismo", "gemini_configured": true, ... }
```

## Desenvolvimento local

```bash
# Roda todas as functions em localhost:54321
supabase functions serve --env-file .env.local
```

## Estrutura

```
supabase/functions/
├── _shared/
│   ├── cors.ts              # headers CORS + preflight
│   └── auth.ts              # requireUser() valida JWT do barbeiro
├── health/
│   └── index.ts             # ping + verifica configs
├── transcribe-audio/
│   └── index.ts             # stub (Fase 4)
└── README.md                # este arquivo
```
