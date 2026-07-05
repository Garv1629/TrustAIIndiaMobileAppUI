import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const BASE = "/make-server-f4602ef7";

app.use("/*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], maxAge: 600 }));

const SCAM_KW = ["free", "winner", "won", "prize", "lottery", "click here", "urgent", "act now", "congratulations", "otp", "blocked", "suspended", "verify immediately", "claim now", "kyc", "reward", "cash back", "refund", "lucky", "forward to claim", "share to win", "guaranteed", "registration fee", "advance payment", "bitcoin", "dear customer", "valued user", "action required", "download apk"];
const TRUST_KW = ["reuters", "official statement", "press release", "government of india", "nic.in", "gov.in", "supreme court", "rbi", "sebi", "pib confirms", "ministry of"];

function analyzeContent(type: string, content: string) {
  const low = content.toLowerCase();
  let score = 60;
  const evidence: { type: string; detail: string; status: "pass" | "fail" | "warn" }[] = [];

  const scamHits = SCAM_KW.filter(k => low.includes(k));
  if (scamHits.length > 0) { score -= Math.min(scamHits.length * 9, 45); evidence.push({ type: "Pattern Analysis", detail: `Detected ${scamHits.length} scam pattern(s): "${scamHits.slice(0, 2).join('", "')}"`, status: "fail" }); }

  const trustHits = TRUST_KW.filter(k => low.includes(k));
  if (trustHits.length > 0) { score += Math.min(trustHits.length * 12, 30); evidence.push({ type: "Credibility Markers", detail: `Found ${trustHits.length} verified credibility indicator(s)`, status: "pass" }); }

  if (type === "website") {
    if ([".xyz", ".tk", ".ml", ".pw", ".top", ".win"].some(t => low.includes(t))) { score -= 30; evidence.push({ type: "Domain Check", detail: "Suspicious TLD used in phishing attacks", status: "fail" }); }
    else if (low.includes(".gov.in") || low.includes(".nic.in")) { score += 25; evidence.push({ type: "Domain Check", detail: "Verified official Indian government domain", status: "pass" }); }
  }
  if (type === "whatsapp" || type === "sms") {
    if (low.includes("forward") || low.includes("share") || low.includes("viral")) { score -= 18; evidence.push({ type: "Viral Pattern", detail: "Requests forwarding — primary misinformation tactic", status: "fail" }); }
  }
  if (type === "email") {
    if (low.includes("dear customer") || low.includes("valued user")) { score -= 18; evidence.push({ type: "Personalization", detail: "Generic salutation — real institutions use your name", status: "fail" }); }
  }
  if (["immediate", "urgent", "expires today", "last chance", "within 24 hours"].some(w => low.includes(w))) { score -= 14; evidence.push({ type: "Urgency Analysis", detail: "Artificial urgency language — classic manipulation tactic", status: "fail" }); }
  if (evidence.length === 0) evidence.push({ type: "General Analysis", detail: "No specific indicators found — moderate confidence", status: "warn" });

  score = Math.max(4, Math.min(96, score));
  const result: "genuine" | "fake" | "suspicious" = score >= 68 ? "genuine" : score >= 38 ? "suspicious" : "fake";
  const riskLevel: "low" | "medium" | "high" | "critical" = score >= 68 ? "low" : score >= 50 ? "medium" : score >= 28 ? "high" : "critical";
  const explanations = { genuine: "Content appears legitimate. Credibility markers found, no major red flags detected.", suspicious: "Mixed signals detected. Exercise caution before sharing or acting on this content.", fake: "Strong indicators of fraud or misinformation. Multiple scam patterns detected. Do not share." };
  const actions = { genuine: "Appears safe. Always verify important decisions with official sources (india.gov.in).", suspicious: "Do not share OTPs or bank details. Verify with official channels.", fake: "Block sender. Do NOT share. Report at cybercrime.gov.in or call 1930." };
  return { score, result, riskLevel, explanation: explanations[result], evidence, recommendedAction: actions[result] };
}

const DEFAULT_ALERTS = [
  { id: "a1", icon: "🚨", title: "New UPI Refund Scam", desc: "Fraudsters posing as bank officials asking for OTP to process your refund", agency: "RBI Warning", severity: "critical", time: "1h ago" },
  { id: "a2", icon: "⚠️", title: "Fake PM Kisan Portal", desc: "Phishing sites mimicking pmkisan.gov.in to steal Aadhaar and bank details", agency: "Cyber Dost", severity: "critical", time: "2h ago" },
  { id: "a3", icon: "🎭", title: "Deepfake PM Modi Video", desc: "AI-generated video falsely shows PM announcing free scheme — viral on WhatsApp", agency: "PIB Fact Check", severity: "critical", time: "3h ago" },
  { id: "a4", icon: "📱", title: "WhatsApp Job Fraud", desc: "Fake part-time job offers requiring ₹5,000 registration fee via UPI", agency: "MHA Advisory", severity: "high", time: "5h ago" },
  { id: "a5", icon: "🔗", title: "IRCTC Phishing Email", desc: "Fake IRCTC emails with malicious links targeting credit card data", agency: "CERT-In Alert", severity: "high", time: "Yesterday" },
  { id: "a6", icon: "🎰", title: "Lottery Scam SMS", desc: "Messages claiming you won ₹25 lakh from BSNL annual lottery scheme", agency: "TRAI Advisory", severity: "medium", time: "Yesterday" },
];

const DEFAULT_VERIFICATIONS = [
  { id: "v1", type: "WhatsApp", content: "PM announces free ₹15,000 for all — forward to 10 friends to claim...", score: 7, result: "fake", riskLevel: "critical", explanation: "Classic forward scam with fabricated government scheme.", evidence: [{ type: "Pattern Analysis", detail: "Viral forwarding request + monetary claim", status: "fail" }], recommendedAction: "Block sender and report to cybercrime.gov.in", createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "v2", type: "News", content: "RBI cuts repo rate by 50bps in emergency MPC meeting", score: 89, result: "genuine", riskLevel: "low", explanation: "Verified by multiple credible financial news sources.", evidence: [{ type: "Source Check", detail: "Confirmed by RBI official press release", status: "pass" }], recommendedAction: "Content appears legitimate and verified.", createdAt: new Date(Date.now() - 18000000).toISOString() },
  { id: "v3", type: "Website", content: "freegov-scheme-apply2024.xyz", score: 9, result: "fake", riskLevel: "critical", explanation: "Phishing domain impersonating government services.", evidence: [{ type: "Domain Check", detail: "Suspicious .xyz TLD with government impersonation", status: "fail" }], recommendedAction: "Do not visit. Report to CERT-In.", createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: "v4", type: "Email", content: "Dear Customer, Your SBI account will be blocked. Click to verify KYC", score: 11, result: "fake", riskLevel: "critical", explanation: "Classic SBI phishing email with generic salutation.", evidence: [{ type: "Personalization", detail: "Generic greeting indicates mass phishing", status: "fail" }], recommendedAction: "Delete immediately. Never click such links.", createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "v5", type: "Social", content: "Delhi earthquake of 8.5 magnitude predicted this Friday by NASA", score: 34, result: "suspicious", riskLevel: "high", explanation: "NASA does not predict earthquakes — unverified viral claim.", evidence: [{ type: "Source Check", detail: "No matching NASA advisory found", status: "warn" }], recommendedAction: "Verify with official IMD earthquake portal.", createdAt: new Date(Date.now() - 172800000).toISOString() },
];

app.get(`${BASE}/health`, (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.get(`${BASE}/verifications`, async (c) => {
  const data = await kv.get("verifications");
  return c.json(data ?? DEFAULT_VERIFICATIONS);
});

app.post(`${BASE}/verifications`, async (c) => {
  const { type, content } = await c.req.json();
  if (!type || !content) return c.json({ error: "type and content required" }, 400);
  const analysis = analyzeContent(type, content);
  const item = { id: crypto.randomUUID(), type, content: content.length > 90 ? content.substring(0, 90) + "…" : content, ...analysis, createdAt: new Date().toISOString() };
  const existing = (await kv.get("verifications")) ?? DEFAULT_VERIFICATIONS;
  await kv.set("verifications", [item, ...existing].slice(0, 50));
  return c.json(item);
});

app.delete(`${BASE}/verifications/:id`, async (c) => {
  const { id } = c.req.param();
  const existing = (await kv.get("verifications")) ?? [];
  await kv.set("verifications", existing.filter((v: any) => v.id !== id));
  return c.json({ success: true });
});

app.get(`${BASE}/scam-alerts`, async (c) => {
  const data = await kv.get("scam_alerts");
  return c.json(data ?? DEFAULT_ALERTS);
});

app.post(`${BASE}/report-scam`, async (c) => {
  const body = await c.req.json();
  const existing = (await kv.get("scam_reports")) ?? [];
  const report = { id: crypto.randomUUID(), ...body, status: "under_review", createdAt: new Date().toISOString() };
  await kv.set("scam_reports", [report, ...existing].slice(0, 200));
  return c.json({ success: true, reportId: report.id });
});

app.get(`${BASE}/stats`, async (c) => {
  const verifications = (await kv.get("verifications")) ?? DEFAULT_VERIFICATIONS;
  const fake = verifications.filter((v: any) => v.result === "fake").length;
  const genuine = verifications.filter((v: any) => v.result === "genuine").length;
  return c.json({ total: verifications.length, fake, genuine, suspicious: verifications.length - fake - genuine, scamsStopped: fake, protectedToday: Math.floor(verifications.length * 3.7 + 1247) });
});

Deno.serve(app.fetch);
