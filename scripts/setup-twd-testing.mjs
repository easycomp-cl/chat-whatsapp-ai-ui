/**
 * Prepara el entorno local para probar The Wood Club (TWD) con WhatsApp real.
 *
 * Uso:
 *   node scripts/setup-twd-testing.mjs
 *
 * Requiere: Supabase local, Docker (postgres), chat-whatsapp-ai con dependencias.
 */
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BOT_ROOT = join(ROOT, "..", "chat-whatsapp-ai");

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54331";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const TWD_TENANT_ID = "tenant-twd";
const PANADERIA_TENANT_ID = "tenant-panaderia-sol";
const DOCKER_DB = "supabase_db_chat-whatsapp-ai-ui";

const MIGRATE_SQL = `
BEGIN;

UPDATE public."Customer"
SET "tenantId" = '${TWD_TENANT_ID}', "updatedAt" = now()
WHERE "tenantId" = '${PANADERIA_TENANT_ID}';

UPDATE public."Conversation"
SET "tenantId" = '${TWD_TENANT_ID}', "updatedAt" = now()
WHERE "tenantId" = '${PANADERIA_TENANT_ID}';

UPDATE public."Message"
SET "tenantId" = '${TWD_TENANT_ID}'
WHERE "tenantId" = '${PANADERIA_TENANT_ID}';

UPDATE public."MessageReaction"
SET "tenantId" = '${TWD_TENANT_ID}'
WHERE "tenantId" = '${PANADERIA_TENANT_ID}';

UPDATE public."UsageEvent"
SET "tenantId" = '${TWD_TENANT_ID}'
WHERE "tenantId" = '${PANADERIA_TENANT_ID}';

UPDATE public.conversation_notes
SET business_id = '${TWD_TENANT_ID}'
WHERE business_id = '${PANADERIA_TENANT_ID}';

UPDATE public."Tenant"
SET status = 'ACTIVE', "botGlobalEnabled" = true, "updatedAt" = now()
WHERE id = '${TWD_TENANT_ID}';

COMMIT;
`;

function runActivateTwdScript() {
  console.log("\n→ Activando canal WhatsApp real en TWD...");
  const result = spawnSync("npm", ["run", "activate:twd"], {
    cwd: BOT_ROOT,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error("activate:twd falló. ¿chat-whatsapp-ai está instalado?");
  }
}

function runSqlMigration() {
  console.log("\n→ Moviendo conversaciones y mensajes reales a TWD...");
  const result = spawnSync(
    "docker",
    ["exec", "-i", DOCKER_DB, "psql", "-U", "postgres", "-d", "postgres"],
    { input: MIGRATE_SQL, encoding: "utf8" }
  );
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    throw new Error("Migración SQL falló");
  }
  console.log(result.stdout?.trim() || "OK");
}

async function ensureTwdAdminUser() {
  console.log("\n→ Configurando usuario admin de TWD...");
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const user = {
    email: "twd@easycomp.test",
    password: "EasyComp2026!",
    full_name: "Felipe Muñoz",
    role: "BUSINESS_ADMIN",
    business_id: TWD_TENANT_ID,
  };

  const { data: created, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: user.full_name },
  });

  let userId = created?.user?.id;
  if (error && !error.message.includes("already been registered")) {
    throw new Error(`No se pudo crear ${user.email}: ${error.message}`);
  }

  if (!userId) {
    const { data: list } = await supabase.auth.admin.listUsers();
    userId = list.users.find((u) => u.email === user.email)?.id;
  }
  if (!userId) throw new Error(`No se encontró user_id para ${user.email}`);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role: user.role,
      business_id: user.business_id,
      full_name: user.full_name,
      active: true,
    })
    .eq("user_id", userId);

  if (profileError) throw new Error(profileError.message);
  console.log(`   Usuario listo: ${user.email}`);
}

function printSummary() {
  const sql = readFileSync(join(__dirname, "setup-twd-verify.sql"), "utf8");
  const result = spawnSync(
    "docker",
    ["exec", "-i", DOCKER_DB, "psql", "-U", "postgres", "-d", "postgres", "-t", "-A"],
    { input: sql, encoding: "utf8" }
  );
  console.log("\n=== Estado TWD ===");
  console.log(result.stdout?.trim() || "(sin datos)");

  console.log(`
=== Cómo probar ===

1. Backend bot (puerto 3000):
   cd ../chat-whatsapp-ai && npm run dev

2. Dashboard UI (puerto 3001):
   npm run dev

3. Login TWD:
   Email:    twd@easycomp.test
   Password: EasyComp2026!

4. WhatsApp → envía un mensaje al número de TWD (+56940414977).
   Debe aparecer en /app/conversations

5. En el chat, activa "Modo humano" y responde desde el dashboard.
   El mensaje sale por WhatsApp real vía Meta.

6. Bot automático: en /app/settings verifica "Bot global activo".
   Pregunta por tablas de madera, precios o despacho para probar FAQs/KB.

7. Webhook Meta (mensajes entrantes en local):
   - ngrok http 3000
   - Callback URL: https://<tu-ngrok>/webhooks/whatsapp
   - Verify token: easycomp123 (ver .env del bot)

Super admin (opcional): admin@easycomp.test / EasyComp2026!
`);
}

async function main() {
  runActivateTwdScript();
  runSqlMigration();
  await ensureTwdAdminUser();
  printSummary();
}

main().catch((error) => {
  console.error("\nError:", error.message);
  process.exit(1);
});
