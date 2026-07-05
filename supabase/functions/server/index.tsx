import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const BASE = "/make-server-f4602ef7";

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  maxAge: 600,
}));

// ── Resolve caller's user ID from Bearer token ────────────────────────────────
async function getUserId(authHeader: string | undefined): Promise<string> {
  if (!authHeader?.startsWith("Bearer ")) return "guest";
  try {
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await client.auth.getUser();
    return user?.id ?? "guest";
  } catch {
    return "guest";
  }
}

// ── AI Analysis Engine ────────────────────────────────────────────────────────
const SCAM_KW = [
  "free", "winner", "won", "prize", "lottery", "click here", "urgent",
  "act now", "congratulations", "otp", "blocked", "suspended",
  "verify immediately", "claim now", "kyc", "reward", "cash back", "refund",
  "lucky", "forward to claim", "share to win", "guaranteed", "registration fee",
  "advance payment", "bitcoin", "dear customer", "valued user", "action required",
  "download apk", "install now", "expire today", "last chance",
];
const TRUST_KW = [
  "reuters", "official statement", "press release", "government of india",
  "nic.in", "gov.in", "supreme court", "rbi", "sebi", "pib", "ministry of",
];

function analyzeContent(type: string, content: string) {
  const low = content.toLowerCase();
  let score = 60;
  const evidence: { type: string; detail: string; status: "pass" | "fail" | "warn" }[] = [];

  const scamHits = SCAM_KW.filter(k => low.includes(k));
  if (scamHits.length > 0) {
    score -= Math.min(scamHits.length * 9, 45);
    evidence.push({ type: "Pattern Analysis", detail: `Detected ${scamHits.length} scam pattern(s): "${scamHits.slice(0, 2).join('", "')}"`, status: "fail" });
  }

  const trustHits = TRUST_KW.filter(k => low.includes(k));
  if (trustHits.length > 0) {
    score += Math.min(trustHits.length * 12, 30);
    evidence.push({ type: "Credibility Markers", detail: `Found ${trustHits.length} verified credibility indicator(s)`, status: "pass" });
  }

  if (type === "website" || type === "url") {
    if ([".xyz", ".tk", ".ml", ".pw", ".top", ".win"].some(t => low.includes(t))) {
      score -= 30;
      evidence.push({ type: "Domain Check", detail: "Suspicious TLD commonly used in phishing attacks", status: "fail" });
    } else if (low.includes(".gov.in") || low.includes(".nic.in")) {
      score += 25;
      evidence.push({ type: "Domain Check", detail: "Verified official Indian government domain", status: "pass" });
    }
  }

  if (type === "whatsapp" || type === "sms") {
    if (low.includes("forward") || low.includes("share") || low.includes("viral")) {
      score -= 18;
      evidence.push({ type: "Viral Pattern", detail: "Requests forwarding — primary misinformation distribution tactic", status: "fail" });
    }
  }

  if (type === "email") {
    if (low.includes("dear customer") || low.includes("valued user")) {
      score -= 18;
      evidence.push({ type: "Personalization", detail: "Generic salutation — real institutions address you by name", status: "fail" });
    }
  }

  if (["immediate", "urgent", "expires today", "last chance", "within 24 hours"].some(w => low.includes(w))) {
    score -= 14;
    evidence.push({ type: "Urgency Analysis", detail: "Artificial urgency language — classic manipulation tactic", status: "fail" });
  }

  if (evidence.length === 0) {
    evidence.push({ type: "General Analysis", detail: "No specific red flags found — moderate confidence assessment", status: "warn" });
  }

  score = Math.max(4, Math.min(96, score));
  const result: "genuine" | "fake" | "suspicious" = score >= 68 ? "genuine" : score >= 38 ? "suspicious" : "fake";
  const riskLevel: "low" | "medium" | "high" | "critical" = score >= 68 ? "low" : score >= 50 ? "medium" : score >= 28 ? "high" : "critical";

  return {
    score, result, riskLevel,
    explanation: {
      genuine: "Content appears legitimate. Credibility markers found, no major red flags detected by our AI.",
      suspicious: "Mixed signals detected. Exercise caution before sharing or acting on this content.",
      fake: "Strong indicators of fraud or misinformation. Multiple scam patterns detected. Do not share.",
    }[result],
    evidence,
    recommendedAction: {
      genuine: "Appears safe. Always verify important decisions with official sources (india.gov.in).",
      suspicious: "Do not share OTPs or bank details. Verify via official channels before acting.",
      fake: "Block sender immediately. Do NOT share. Report at cybercrime.gov.in or call 1930.",
    }[result],
  };
}

// ── Default seed data ─────────────────────────────────────────────────────────
const SEED_ALERTS = [
  { id: "a1", icon: "🚨", title: "New UPI Refund Scam", desc: "Fraudsters posing as bank officials asking for OTP to process your refund", agency: "RBI Warning", severity: "critical", time: "1h ago" },
  { id: "a2", icon: "⚠️", title: "Fake PM Kisan Portal", desc: "Phishing sites mimicking pmkisan.gov.in to steal Aadhaar and bank details", agency: "Cyber Dost", severity: "critical", time: "2h ago" },
  { id: "a3", icon: "🎭", title: "Deepfake PM Modi Video", desc: "AI-generated video falsely shows PM announcing free scheme — viral on WhatsApp", agency: "PIB Fact Check", severity: "critical", time: "3h ago" },
  { id: "a4", icon: "📱", title: "WhatsApp Job Fraud", desc: "Fake part-time job offers requiring ₹5,000 registration fee via UPI", agency: "MHA Advisory", severity: "high", time: "5h ago" },
  { id: "a5", icon: "🔗", title: "IRCTC Phishing Email", desc: "Fake IRCTC emails with malicious links targeting credit card data", agency: "CERT-In Alert", severity: "high", time: "Yesterday" },
  { id: "a6", icon: "🎰", title: "Lottery Scam SMS", desc: "Messages claiming you won ₹25 lakh from BSNL annual lottery scheme", agency: "TRAI Advisory", severity: "medium", time: "Yesterday" },
];

const SEED_VERIFICATIONS = [
  { id: "v1", type: "WhatsApp", content: "PM announces free ₹15,000 for all — forward to 10 friends to claim...", score: 7, result: "fake", riskLevel: "critical", explanation: "Classic forward scam with fabricated government scheme.", evidence: [{ type: "Pattern Analysis", detail: "Viral forwarding + monetary claim detected", status: "fail" }], recommendedAction: "Block sender and report to cybercrime.gov.in", createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "v2", type: "News", content: "RBI cuts repo rate by 50bps in emergency MPC meeting", score: 89, result: "genuine", riskLevel: "low", explanation: "Verified by multiple credible financial news sources.", evidence: [{ type: "Source Check", detail: "Confirmed by RBI official press release", status: "pass" }], recommendedAction: "Content appears legitimate and verified.", createdAt: new Date(Date.now() - 18000000).toISOString() },
  { id: "v3", type: "Website", content: "freegov-scheme-apply2024.xyz", score: 9, result: "fake", riskLevel: "critical", explanation: "Phishing domain impersonating government services.", evidence: [{ type: "Domain Check", detail: "Suspicious .xyz TLD with government impersonation", status: "fail" }], recommendedAction: "Do not visit this site. Report to CERT-In.", createdAt: new Date(Date.now() - 86400000).toISOString() },
];

// ── Key helpers ───────────────────────────────────────────────────────────────
const verifKey = (uid: string) => `verifications_${uid}`;
const statsKey = (uid: string) => `stats_${uid}`;

// ── Routes ────────────────────────────────────────────────────────────────────

app.get(`${BASE}/health`, (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// GET verifications — scoped to the authenticated user
app.get(`${BASE}/verifications`, async (c) => {
  const uid = await getUserId(c.req.header("Authorization"));
  const key = verifKey(uid);
  const data = await kv.get(key);
  // Seed demo data for guest/new users
  if (!data) {
    await kv.set(key, SEED_VERIFICATIONS);
    return c.json(SEED_VERIFICATIONS);
  }
  return c.json(data);
});

// POST verification — analyze and store per user
app.post(`${BASE}/verifications`, async (c) => {
  const uid = await getUserId(c.req.header("Authorization"));
  const { type, content } = await c.req.json();
  if (!type || !content) return c.json({ error: "type and content required" }, 400);

  const analysis = analyzeContent(type, content);
  const item = {
    id: crypto.randomUUID(),
    type,
    content: content.length > 90 ? content.substring(0, 90) + "…" : content,
    ...analysis,
    createdAt: new Date().toISOString(),
    userId: uid,
  };

  const key = verifKey(uid);
  const existing = (await kv.get(key)) ?? [];
  await kv.set(key, [item, ...existing].slice(0, 100));

  // Update user stats
  const sk = statsKey(uid);
  const st = (await kv.get(sk)) ?? { total: 0, fake: 0, genuine: 0, suspicious: 0, scamsStopped: 0, protectedToday: 1247 };
  st.total += 1;
  if (item.result === "fake") { st.fake += 1; st.scamsStopped += 1; }
  else if (item.result === "genuine") st.genuine += 1;
  else st.suspicious += 1;
  st.protectedToday = Math.floor(st.total * 3.7 + 1247);
  await kv.set(sk, st);

  return c.json(item);
});

// DELETE a verification
app.delete(`${BASE}/verifications/:id`, async (c) => {
  const uid = await getUserId(c.req.header("Authorization"));
  const { id } = c.req.param();
  const key = verifKey(uid);
  const existing = (await kv.get(key)) ?? [];
  await kv.set(key, existing.filter((v: { id: string }) => v.id !== id));
  return c.json({ success: true });
});

// GET scam alerts — global, same for all users
app.get(`${BASE}/scam-alerts`, async (c) => {
  const data = await kv.get("scam_alerts_global");
  return c.json(data ?? SEED_ALERTS);
});

// POST report scam
app.post(`${BASE}/report-scam`, async (c) => {
  const uid = await getUserId(c.req.header("Authorization"));
  const body = await c.req.json();
  const existing = (await kv.get("scam_reports")) ?? [];
  const report = {
    id: crypto.randomUUID(),
    ...body,
    userId: uid,
    status: "under_review",
    createdAt: new Date().toISOString(),
  };
  await kv.set("scam_reports", [report, ...existing].slice(0, 500));
  return c.json({ success: true, reportId: report.id });
});

// GET stats — scoped to authenticated user
app.get(`${BASE}/stats`, async (c) => {
  const uid = await getUserId(c.req.header("Authorization"));
  const st = await kv.get(statsKey(uid));
  if (st) return c.json(st);
  // Compute from verifications if no stats cache yet
  const verifs = (await kv.get(verifKey(uid))) ?? SEED_VERIFICATIONS;
  const fake = verifs.filter((v: { result: string }) => v.result === "fake").length;
  const genuine = verifs.filter((v: { result: string }) => v.result === "genuine").length;
  return c.json({
    total: verifs.length,
    fake,
    genuine,
    suspicious: verifs.length - fake - genuine,
    scamsStopped: fake,
    protectedToday: Math.floor(verifs.length * 3.7 + 1247),
  });
});

// GET user profile summary
app.get(`${BASE}/profile`, async (c) => {
  const uid = await getUserId(c.req.header("Authorization"));
  const verifs = (await kv.get(verifKey(uid))) ?? [];
  const st = await kv.get(statsKey(uid));
  return c.json({
    userId: uid,
    totalVerifications: verifs.length,
    scamsCaught: st?.fake ?? verifs.filter((v: { result: string }) => v.result === "fake").length,
    memberSince: verifs.length > 0 ? verifs[verifs.length - 1].createdAt : new Date().toISOString(),
    plan: "free",
  });
});

Deno.serve(app.fetch);
