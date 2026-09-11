import { createClient } from "@supabase/supabase-js";

const BASE = process.env.PROD_URL ?? "https://chat-whatsapp-ai-ui-gwzr.vercel.app";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pcbwycrgbuioumsopqbe.supabase.co";
const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYnd5Y3JnYnVpb3Vtc29wcWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MDY4NTQsImV4cCI6MjA5OTM4Mjg1NH0.7kO80pTgv9GLdxBo4L6hTHKYy0KTB2gp-HKk-pbRei8";

const routes = [
  "/app/dashboard",
  "/app/conversations",
  "/app/faqs",
  "/app/knowledge",
  "/app/despachos",
];

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function buildAuthCookie() {
  const email = process.env.BENCH_EMAIL;
  const password = process.env.BENCH_PASSWORD;
  if (!email || !password) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login failed: ${error.message}`);

  const session = data.session;
  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = encodeURIComponent(
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: session.user,
    })
  );
  return `${cookieName}=${cookieValue}`;
}

async function measure(path, cookie, runs = 5) {
  const timings = [];
  let region = null;
  let cache = null;
  let status = null;

  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        cookie,
        "cache-control": "no-cache",
        pragma: "no-cache",
      },
      redirect: "manual",
    });
    timings.push(performance.now() - start);
    region = res.headers.get("x-vercel-id")?.split("::")[0] ?? region;
    cache = res.headers.get("x-vercel-cache") ?? cache;
    status = res.status;
    await res.text();
  }

  return {
    path,
    status,
    region,
    cache,
    minMs: Math.round(Math.min(...timings)),
    p50Ms: Math.round(percentile(timings, 50)),
    p95Ms: Math.round(percentile(timings, 95)),
    maxMs: Math.round(Math.max(...timings)),
  };
}

const cookie = await buildAuthCookie();
if (!cookie) {
  console.error("Set BENCH_EMAIL and BENCH_PASSWORD");
  process.exit(1);
}

const results = [];
for (const path of routes) {
  results.push(await measure(path, cookie));
}
const faqsCached = await measure("/app/faqs", cookie);
faqsCached.path = "/app/faqs (2da carga, cache 60s)";
results.push(faqsCached);

console.log(
  JSON.stringify(
    {
      base: BASE,
      testedAt: new Date().toISOString(),
      region: results[0]?.region ?? null,
      baselineFromDocsJul11: {
        dashboardTotalMs: "2600-3000",
        faqsTotalMs: "1300-2400",
        conversationsTotalMs: "~1100",
        knowledgeTotalMs: "1400-1600",
        despachosTotalMs: "~2100",
      },
      authenticatedSsr: results,
    },
    null,
    2
  )
);
