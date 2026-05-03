/**
 * Cria usuário de demonstração no Supabase via Admin API.
 * Uso: pnpm seed
 *
 * Idempotente: se o usuário já existe, atualiza a senha e os metadados.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Carrega .env.local manualmente (sem depender de dotenv)
function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, k, v] = m;
      if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, "");
    }
  } catch {
    // sem .env.local — usa o ambiente
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("✗ Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_USERS = [
  {
    email: "teste@mail.com",
    password: "123456",
    metadata: {
      full_name: "Usuário Teste",
      instagram: "@visagismo",
      role: "barbeiro",
    },
  },
];

// E-mails que devem ser removidos (limpeza de seeds antigos)
const REMOVE_EMAILS = ["drleonardosaraiva@gmail.com"];

async function findUserByEmail(email: string) {
  // Não há filter por email direto — paginar e procurar
  let page = 1;
  // listUsers paginado (default 50)
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 100) return null;
    page += 1;
    if (page > 20) return null; // sanity
  }
}

async function upsertUser(seed: (typeof SEED_USERS)[number]) {
  const existing = await findUserByEmail(seed.email);
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: seed.password,
      email_confirm: true,
      user_metadata: seed.metadata,
    });
    if (error) throw error;
    return { user: data.user, action: "atualizado" as const };
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: seed.email,
    password: seed.password,
    email_confirm: true,
    user_metadata: seed.metadata,
  });
  if (error) throw error;
  return { user: data.user, action: "criado" as const };
}

(async () => {
  console.log("→ Conectando ao Supabase:", url);

  // 1. Remover seeds antigos
  for (const email of REMOVE_EMAILS) {
    try {
      const existing = await findUserByEmail(email);
      if (existing) {
        const { error } = await admin.auth.admin.deleteUser(existing.id);
        if (error) throw error;
        console.log(`✓ Usuário removido: ${email}  (id: ${existing.id.slice(0, 8)}…)`);
      }
    } catch (err) {
      console.error(`✗ Falha ao remover ${email}:`, err instanceof Error ? err.message : err);
    }
  }

  // 2. Criar/atualizar seeds atuais
  for (const seed of SEED_USERS) {
    try {
      const { user, action } = await upsertUser(seed);
      console.log(
        `✓ Usuário ${action}: ${user?.email}  (id: ${user?.id?.slice(0, 8)}…)`,
      );
      console.log(`  Senha: ${seed.password}`);
    } catch (err) {
      console.error(`✗ Falha em ${seed.email}:`, err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  }
})();
