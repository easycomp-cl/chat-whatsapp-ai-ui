import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envText = readFileSync(resolve(root, ".env.local"), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function rest(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return JSON.parse(text);
}

const statusCounts = await rest(
  "messages?select=whatsapp_delivery_status&direction=eq.OUTBOUND&limit=500"
);
const tally = {};
for (const row of statusCounts) {
  const s = row.whatsapp_delivery_status ?? "null";
  tally[s] = (tally[s] ?? 0) + 1;
}

console.log("Conteo por estado (últimos 500 salientes):");
console.log(JSON.stringify(tally, null, 2));

const hola = await rest(
  "messages?content_text=ilike.hola&direction=eq.OUTBOUND&order=created_at.desc&limit=3&select=id,content_text,whatsapp_delivery_status,external_id,created_at"
);
console.log("\nMensajes 'hola':");
console.log(JSON.stringify(hola, null, 2));
