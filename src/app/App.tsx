import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import {
  ShieldCheck, ShieldAlert, ShieldX,
  Home, History, Bell, User, Settings,
  Search, Upload, Camera, FileText, Mic,
  QrCode, MessageSquare, Mail, Globe, Image,
  Newspaper, Share2, ChevronRight, ChevronLeft,
  Check, X, AlertTriangle, Zap, Lock, Eye, EyeOff,
  Trash2, LogOut, Moon, Download,
  Clock, Filter, MoreHorizontal,
  Send, Paperclip, ArrowRight, Sparkles,
  BadgeCheck, Flame, Bot, Crown, HelpCircle,
  Languages, BarChart2, Activity, ExternalLink,
  Flag, Bookmark, FileImage, Signal,
  Wifi, Battery, Radio, RefreshCw, Info, Accessibility, BookOpen, MapPin
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { User as SupabaseUser } from "../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
type Screen =
  | "splash" | "onboarding" | "signin"
  | "home" | "verify-type" | "upload" | "scanning" | "results"
  | "history" | "alerts" | "assistant" | "profile"
  | "premium" | "notifications" | "settings";

interface Evidence { type: string; detail: string; status: "pass" | "fail" | "warn"; }
interface Verification {
  id: string; type: string; content: string; score: number;
  result: "genuine" | "fake" | "suspicious";
  riskLevel: "low" | "medium" | "high" | "critical";
  explanation: string; evidence: Evidence[];
  recommendedAction: string; createdAt: string;
}
interface ScamAlert { id: string; icon: string; title: string; desc: string; agency: string; severity: string; time: string; }

// ── API ───────────────────────────────────────────────────────────────────────
const API_BASE = "https://sdoqztflsdrcowtrrscv.supabase.co/functions/v1/make-server-f4602ef7";
async function api(path: string, opts?: RequestInit) {
  const res = await fetch(API_BASE + path, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start: number;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy: "#050A18", navyMid: "#0D1F4A",
  blue: "#2563EB", blueDark: "#1D4ED8", blueLight: "#EFF6FF",
  green: "#10B981", amber: "#F59E0B", red: "#EF4444", purple: "#7C3AED",
  bg: "#F0F4FF", text: "#0F172A", textMid: "#334155", muted: "#64748B",
  border: "rgba(15,23,42,0.07)",
};

const GC: React.CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 4px 24px rgba(15,23,42,0.07), inset 0 1px 0 #fff",
};

const DC: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.13)",
};

const DARK_HEADER: React.CSSProperties = {
  background: "radial-gradient(ellipse at 20% 20%, #1a3a8f 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #0a1f5c 0%, transparent 60%), #050A18",
  borderRadius: "0 0 32px 32px",
};

// ── Motion variants ───────────────────────────────────────────────────────────
const SLIDE = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 360, damping: 36 } },
  exit: { x: "-20%", opacity: 0, transition: { duration: 0.18 } },
};
const STG = { animate: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } };
const ITEM = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 380, damping: 30 } },
};

// ── Shared UI ─────────────────────────────────────────────────────────────────
function SBar({ dark = false }: { dark?: boolean }) {
  const col = dark ? "rgba(255,255,255,0.8)" : C.text;
  return (
    <div className="flex items-center justify-between px-6 pt-4 pb-1 flex-shrink-0">
      <span style={{ fontSize: 13, fontWeight: 700, color: col }}>9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal size={12} style={{ color: col }} />
        <Wifi size={12} style={{ color: col }} />
        <Battery size={13} style={{ color: col }} />
      </div>
    </div>
  );
}

function GCard({ children, className = "", onClick, style }: { children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties; }) {
  return (
    <motion.div onClick={onClick} whileTap={onClick ? { scale: 0.975 } : undefined}
      className={`rounded-2xl ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ ...GC, borderRadius: 20, ...style }}>
      {children}
    </motion.div>
  );
}

function PBtn({ children, onClick, color = C.blue, disabled = false }: { children: React.ReactNode; onClick?: () => void; color?: string; disabled?: boolean; }) {
  return (
    <motion.button onClick={onClick} disabled={disabled} whileTap={{ scale: 0.97 }}
      className="w-full py-4 px-6 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
      style={{ fontSize: 15, background: disabled ? "#94A3B8" : `linear-gradient(135deg,${color},${color}cc)`, boxShadow: disabled ? "none" : `0 6px 28px ${color}44,inset 0 1px 0 rgba(255,255,255,0.25)`, borderRadius: 20 }}>
      {children}
    </motion.button>
  );
}

function RiskChip({ level }: { level: string }) {
  const M: Record<string, { bg: string; text: string; label: string }> = {
    low: { bg: "#DCFCE7", text: "#16A34A", label: "Low Risk" },
    medium: { bg: "#FEF3C7", text: "#D97706", label: "Medium Risk" },
    high: { bg: "#FEE2E2", text: "#DC2626", label: "High Risk" },
    critical: { bg: "#FEE2E2", text: "#991B1B", label: "Critical" },
  };
  const c = M[level] ?? M.medium;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold"
      style={{ fontSize: 11, background: c.bg, color: c.text }}>
      <AlertTriangle size={9} />{c.label}
    </span>
  );
}

function VBadge({ result }: { result: string }) {
  const M: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
    genuine: { bg: C.green, icon: <ShieldCheck size={12} />, label: "Genuine" },
    fake: { bg: C.red, icon: <ShieldX size={12} />, label: "Fake" },
    suspicious: { bg: C.amber, icon: <ShieldAlert size={12} />, label: "Suspicious" },
  };
  const c = M[result] ?? M.suspicious;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold"
      style={{ fontSize: 11, background: c.bg, boxShadow: `0 3px 10px ${c.bg}55` }}>
      {c.icon}{c.label}
    </span>
  );
}

function BNav({ active, go }: { active: string; go: (s: Screen) => void }) {
  const tabs: { id: string; Icon: React.ElementType; label: string; s: Screen }[] = [
    { id: "home", Icon: Home, label: "Home", s: "home" },
    { id: "history", Icon: History, label: "History", s: "history" },
    { id: "alerts", Icon: Bell, label: "Alerts", s: "alerts" },
    { id: "assistant", Icon: Bot, label: "AI Chat", s: "assistant" },
    { id: "profile", Icon: User, label: "Profile", s: "profile" },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 pb-6 pt-2 px-2"
      style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-around">
        {tabs.map(t => {
          const on = active === t.id;
          return (
            <motion.button key={t.id} onClick={() => go(t.s)} whileTap={{ scale: 0.86 }}
              className="flex flex-col items-center gap-1 px-3 py-1">
              <div className="relative">
                {on && <motion.div layoutId="npill" className="absolute -inset-2 rounded-xl" style={{ background: `${C.blue}15` }} transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <t.Icon size={20} style={{ color: on ? C.blue : C.muted }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: on ? C.blue : C.muted }}>{t.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Trust Gauge ───────────────────────────────────────────────────────────────
function TrustGauge({ score }: { score: number }) {
  const display = useCountUp(score, 1800);
  const col = score >= 68 ? C.green : score >= 38 ? C.amber : C.red;
  const r = 78; const cx = 110; const cy = 112;
  const circ = Math.PI * r;
  const prog = (display / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 220, height: 130 }}>
        <svg width={220} height={130} viewBox="0 0 220 130" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="gaugeTrack" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E2E8F0" /><stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="gaugeFill" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={col} /><stop offset="100%" stopColor={col + "bb"} />
            </linearGradient>
            <filter id="gaugeGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="url(#gaugeTrack)" strokeWidth={13} strokeLinecap="round" />
          <motion.path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="url(#gaugeFill)" strokeWidth={13} strokeLinecap="round" filter="url(#gaugeGlow)"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${prog} ${circ}` }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }} />
          <text x={cx - r} y={cy + 18} textAnchor="middle" fontSize={9} fill={C.muted} fontFamily="Plus Jakarta Sans">0</text>
          <text x={cx + r} y={cy + 18} textAnchor="middle" fontSize={9} fill={C.muted} fontFamily="Plus Jakarta Sans">100</text>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
          <span style={{ fontSize: 44, fontWeight: 900, color: col, letterSpacing: -2, lineHeight: 1 }}>{display}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginTop: 2 }}>Trust Score</span>
        </div>
      </div>
    </div>
  );
}

// ── Splash ────────────────────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 30% 40%,#1a3a8f 0%,transparent 55%),radial-gradient(ellipse at 70% 60%,#0a1f5c 0%,transparent 55%),#050A18" }}>
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ width: 4 + i * 3, height: 4 + i * 3, background: `rgba(255,255,255,${0.05 + i * 0.01})`, left: `${10 + i * 14}%`, top: `${12 + i * 11}%` }}
          animate={{ y: [-8, 8, -8] }} transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }} />
      ))}
      <motion.div className="flex flex-col items-center gap-7"
        initial={{ opacity: 0, scale: 0.82, y: 28 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.2 }}>
        <div className="relative">
          <motion.div className="absolute -inset-5 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle,rgba(16,185,129,0.28) 0%,transparent 70%)" }}
            animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 2.5, repeat: Infinity }} />
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={DC}>
            <ShieldCheck size={50} className="text-white" style={{ filter: "drop-shadow(0 0 18px rgba(16,185,129,0.9))" }} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex items-center gap-2.5">
            <span style={{ fontSize: 32, fontWeight: 900, color: "white" }}>TrustAI</span>
            <motion.span className="px-2.5 py-1 rounded-xl font-black text-white"
              style={{ fontSize: 12, background: "linear-gradient(135deg,#10B981,#059669)", boxShadow: "0 4px 14px rgba(16,185,129,0.5)" }}
              animate={{ boxShadow: ["0 4px 14px rgba(16,185,129,0.4)", "0 4px 24px rgba(16,185,129,0.8)", "0 4px 14px rgba(16,185,129,0.4)"] }}
              transition={{ duration: 2, repeat: Infinity }}>
              INDIA
            </motion.span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>The AI Trust Layer for Every Indian</p>
        </div>
        <div className="flex gap-2.5 mt-4">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="rounded-full" style={{ height: 8, background: i === 1 ? C.green : "rgba(255,255,255,0.25)", width: i === 1 ? 28 : 8 }}
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />
          ))}
        </div>
      </motion.div>
      <motion.div className="absolute bottom-10 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Powered by Advanced AI</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>🇮🇳 Built for Bharat · DPDP Compliant</span>
      </motion.div>
    </div>
  );
}

// ── Onboarding ────────────────────────────────────────────────────────────────
const OB = [
  { color: C.blue, bg: "#EFF6FF", Icon: BarChart2, emoji: "🛡️", title: "AI-Powered Verification", body: "Instantly verify WhatsApp forwards, SMS, news, and digital content with AI that catches 94% of scams." },
  { color: C.green, bg: "#ECFDF5", Icon: Activity, emoji: "📊", title: "Trust Score System", body: "Every piece of content gets a 0–100 Trust Score with detailed evidence — know exactly what you're dealing with." },
  { color: C.purple, bg: "#F5F3FF", Icon: Lock, emoji: "🔐", title: "Privacy First, Always", body: "Your data never leaves India. 100% encrypted, DPDP Act 2023 compliant — we never store your content." },
];

function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0);
  const ob = OB[page];
  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }}>
      <div className="flex-1 flex flex-col items-center justify-center px-7 gap-8">
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
            className="w-full rounded-3xl p-8 flex flex-col items-center gap-5" style={{ background: ob.bg }}>
            <motion.div className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ background: "white", color: ob.color, boxShadow: `0 10px 40px ${ob.color}28` }}
              initial={{ scale: 0.7, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 22 }}>
              <ob.Icon size={46} />
            </motion.div>
            <motion.div style={{ fontSize: 52 }} animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>{ob.emoji}</motion.div>
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div key={"t" + page} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 text-center">
            <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, lineHeight: 1.25 }}>{ob.title}</h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, fontWeight: 500 }}>{ob.body}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-2">
          {OB.map((_, i) => (
            <motion.div key={i} className="rounded-full" style={{ height: 8 }}
              animate={{ width: i === page ? 26 : 8, backgroundColor: i === page ? ob.color : "#CBD5E1" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }} />
          ))}
        </div>
      </div>
      <div className="px-6 pb-10 flex flex-col gap-3">
        {page < 2 ? (
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.96 }} onClick={onDone}
              className="flex-1 py-4 rounded-2xl font-bold" style={{ background: "#F1F5F9", color: C.muted, borderRadius: 20 }}>Skip</motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setPage(p => p + 1)}
              className="flex-[2] py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg,${ob.color},${ob.color}bb)`, boxShadow: `0 6px 24px ${ob.color}44`, borderRadius: 20, fontSize: 15 }}>
              Next <ArrowRight size={18} />
            </motion.button>
          </div>
        ) : <PBtn onClick={onDone} color={C.blue}><Zap size={18} />Get Started — It&apos;s Free</PBtn>}
      </div>
    </div>
  );
}

// ── Sign In ───────────────────────────────────────────────────────────────────
type AuthView = "options" | "email" | "magic" | "check-email";

function friendlyError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Wrong email or password. Please try again.";
  if (msg.includes("Email not confirmed")) return "Please check your inbox and confirm your email first.";
  if (msg.includes("User already registered")) return "Account exists — please sign in instead.";
  if (msg.includes("Password should be at least")) return "Password must be at least 6 characters.";
  if (msg.includes("Unable to validate email")) return "Please enter a valid email address.";
  if (msg.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("network") || msg.includes("fetch")) return "Network error. Check your connection.";
  return msg;
}

function SignInScreen({ onDone }: { onDone: () => void }) {
  const [view, setView] = useState<AuthView>("options");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const setErr = (msg: string) => { setErrMsg(msg); setTimeout(() => setErrMsg(""), 5000); };

  const Spin = () => (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}>
      <RefreshCw size={17} className="text-white" />
    </motion.div>
  );

  // ── Email / password ──────────────────────────────────────────────────────
  const handleEmail = async () => {
    if (!email.trim()) { setErr("Please enter your email address."); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setBusy(true); setErrMsg("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) { setErr(friendlyError(error.message)); return; }
        // If session returned immediately, email confirmation is off — go straight in
        if (data.session) { onDone(); return; }
        // Otherwise show "check email" screen
        setView("check-email");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) { setErr(friendlyError(error.message)); return; }
        onDone();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? friendlyError(e.message) : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ── Magic link ────────────────────────────────────────────────────────────
  const handleMagicLink = async () => {
    if (!email.trim()) { setErr("Enter your email to receive a magic link."); return; }
    setBusy(true); setErrMsg("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.href },
      });
      if (error) { setErr(friendlyError(error.message)); return; }
      setView("check-email");
    } catch {
      setErr("Could not send magic link. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setBusy(true); setErrMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href },
      });
      if (error) { setErr(friendlyError(error.message)); setBusy(false); }
      // on success, browser redirects — no further action needed
    } catch {
      setErr("Google sign-in failed. Please try email instead.");
      setBusy(false);
    }
  };

  const Field = ({ icon, placeholder, value, onChange, type = "text", right }: {
    icon: React.ReactNode; placeholder: string; value: string;
    onChange: (v: string) => void; type?: string; right?: React.ReactNode;
  }) => (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{ background: "white", border: `1.5px solid ${errMsg ? C.red + "66" : C.border}`, borderRadius: 16 }}>
      <div style={{ color: C.muted, flexShrink: 0 }}>{icon}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
        onKeyDown={e => { if (e.key === "Enter") { if (view === "email") handleEmail(); else if (view === "magic") handleMagicLink(); } }}
        className="flex-1 outline-none bg-transparent"
        style={{ fontSize: 14, color: C.text, fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
      {right}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: C.bg, scrollbarWidth: "none" }}>
      <SBar />

      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex flex-col items-center gap-3">
        <motion.div className="rounded-3xl flex items-center justify-center"
          style={{ width: 72, height: 72, background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, boxShadow: `0 12px 40px ${C.blue}44` }}
          initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}>
          <ShieldCheck size={34} className="text-white" />
        </motion.div>
        <motion.div className="flex flex-col items-center gap-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text }}>
            {view === "options" ? "Welcome to TrustAI" :
             view === "email" ? (mode === "signin" ? "Sign In" : "Create Account") :
             view === "magic" ? "Magic Link" : "Check Your Email"}
          </h1>
          <p style={{ fontSize: 13, color: C.muted, fontWeight: 500, textAlign: "center" }}>
            {view === "options" ? "India's most trusted AI verification platform" :
             view === "check-email" ? `We sent a link to ${email}` : ""}
          </p>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Options view ── */}
        {view === "options" && (
          <motion.div key="options" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="flex-1 px-6 flex flex-col gap-3 mt-1">

            {/* Google */}
            <GCard className="p-4 flex items-center gap-4" onClick={handleGoogle}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: C.bg }}>
                {busy ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}><RefreshCw size={18} style={{ color: C.blue }} /></motion.div> : "🔵"}
              </div>
              <div className="flex-1">
                <p style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Continue with Google</p>
                <p style={{ fontSize: 11, color: C.muted }}>Fast · Secure · Recommended</p>
              </div>
              <span className="text-white font-black px-2 py-0.5 rounded-full" style={{ fontSize: 10, background: C.green }}>Best</span>
            </GCard>

            {/* Email */}
            <GCard className="p-4 flex items-center gap-4" onClick={() => { setMode("signin"); setView("email"); setErrMsg(""); }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: C.bg }}>✉️</div>
              <div className="flex-1">
                <p style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Email &amp; Password</p>
                <p style={{ fontSize: 11, color: C.muted }}>Sign in or create a new account</p>
              </div>
              <ChevronRight size={15} style={{ color: "#CBD5E1" }} />
            </GCard>

            {/* Magic link */}
            <GCard className="p-4 flex items-center gap-4" onClick={() => { setView("magic"); setErrMsg(""); }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: C.bg }}>🔗</div>
              <div className="flex-1">
                <p style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Email Magic Link</p>
                <p style={{ fontSize: 11, color: C.muted }}>No password needed · One click sign-in</p>
              </div>
              <ChevronRight size={15} style={{ color: "#CBD5E1" }} />
            </GCard>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: C.border }} />
              <span style={{ fontSize: 11, color: C.muted }}>or</span>
              <div className="flex-1 h-px" style={{ background: C.border }} />
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={onDone}
              className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
              style={{ border: "2px dashed #CBD5E1", color: C.muted, borderRadius: 20, fontSize: 14 }}>
              <Eye size={17} />Browse as Guest
            </motion.button>
          </motion.div>
        )}

        {/* ── Email / Password view ── */}
        {view === "email" && (
          <motion.div key="email" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="flex-1 px-6 flex flex-col gap-4 mt-1">

            {/* Sign In / Sign Up toggle */}
            <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#F1F5F9" }}>
              {(["signin", "signup"] as const).map(m => (
                <motion.button key={m} onClick={() => { setMode(m); setErrMsg(""); }}
                  className="flex-1 py-2.5 rounded-xl font-bold"
                  style={{ fontSize: 13, background: mode === m ? "white" : "transparent", color: mode === m ? C.text : C.muted, boxShadow: mode === m ? "0 1px 6px rgba(15,23,42,0.1)" : "none" }}>
                  {m === "signin" ? "Sign In" : "Sign Up"}
                </motion.button>
              ))}
            </div>

            <Field icon={<Mail size={17} />} placeholder="your@email.com" value={email} onChange={v => { setEmail(v); setErrMsg(""); }} type="email" />
            <Field icon={<Lock size={17} />} placeholder="Password (min 6 chars)" value={password} onChange={v => { setPassword(v); setErrMsg(""); }}
              type={showPw ? "text" : "password"}
              right={
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowPw(s => !s)} style={{ flexShrink: 0 }}>
                  {showPw ? <EyeOff size={16} style={{ color: C.muted }} /> : <Eye size={16} style={{ color: C.muted }} />}
                </motion.button>
              } />

            {/* Inline error */}
            <AnimatePresence>
              {errMsg && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                  style={{ background: "#FEF2F2", border: `1px solid #FECACA` }}>
                  <AlertTriangle size={14} style={{ color: C.red, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "#DC2626", fontWeight: 600 }}>{errMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === "signup" && !errMsg && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: C.blueLight }}>
                <Info size={13} style={{ color: C.blue, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: C.blue, fontWeight: 500, lineHeight: 1.5 }}>
                  A confirmation link will be sent to your email. Click it to activate your account, then sign in.
                </p>
              </div>
            )}

            <PBtn onClick={handleEmail} color={C.blue}>
              {busy ? <Spin /> : mode === "signin" ? <><Lock size={16} />Sign In</> : <><BadgeCheck size={16} />Create Account</>}
            </PBtn>

            {mode === "signin" && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setView("magic"); setErrMsg(""); }}
                className="text-center py-1" style={{ fontSize: 13, color: C.blue, fontWeight: 600 }}>
                Forgot password? Use magic link →
              </motion.button>
            )}

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setView("options"); setErrMsg(""); }}
              className="flex items-center justify-center gap-1 py-1"
              style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>
              <ChevronLeft size={15} />Back
            </motion.button>
          </motion.div>
        )}

        {/* ── Magic link view ── */}
        {view === "magic" && (
          <motion.div key="magic" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="flex-1 px-6 flex flex-col gap-4 mt-1">
            <div className="rounded-2xl p-4" style={{ background: C.blueLight, border: `1px solid #BFDBFE` }}>
              <p style={{ fontSize: 13, color: C.blue, fontWeight: 600, lineHeight: 1.6 }}>
                🔗 Enter your email and we&apos;ll send you a one-click sign-in link. No password needed.
              </p>
            </div>
            <Field icon={<Mail size={17} />} placeholder="your@email.com" value={email} onChange={v => { setEmail(v); setErrMsg(""); }} type="email" />

            <AnimatePresence>
              {errMsg && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                  style={{ background: "#FEF2F2", border: `1px solid #FECACA` }}>
                  <AlertTriangle size={14} style={{ color: C.red, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "#DC2626", fontWeight: 600 }}>{errMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <PBtn onClick={handleMagicLink} color={C.blue}>
              {busy ? <Spin /> : <><Mail size={16} />Send Magic Link</>}
            </PBtn>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setView("options"); setErrMsg(""); }}
              className="flex items-center justify-center gap-1 py-1"
              style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>
              <ChevronLeft size={15} />Back
            </motion.button>
          </motion.div>
        )}

        {/* ── Check email view ── */}
        {view === "check-email" && (
          <motion.div key="check" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 px-6 flex flex-col items-center gap-5 mt-4">
            <motion.div className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: C.blueLight }}
              animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Mail size={44} style={{ color: C.blue }} />
            </motion.div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text }}>Check Your Inbox</h2>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, fontWeight: 500 }}>
                We sent a link to <strong style={{ color: C.text }}>{email}</strong>.{"\n"}Click it to sign in — then come back here.
              </p>
            </div>
            <div className="w-full rounded-2xl p-4" style={{ background: "#ECFDF5", border: "1px solid #BBF7D0" }}>
              <p style={{ fontSize: 12, color: "#16A34A", fontWeight: 600, lineHeight: 1.5 }}>
                ✅ Check spam/junk if you don&apos;t see it within 2 minutes.
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setView("email"); setMode("signin"); }}
              className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
              style={{ background: C.blueLight, color: C.blue, borderRadius: 20, fontSize: 14 }}>
              <RefreshCw size={16} />Already confirmed? Sign In
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setView("options")}
              style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>
              ← Back to options
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>

      <p className="text-center px-8 pb-6 mt-4" style={{ fontSize: 11, color: "#94A3B8" }}>
        By continuing you agree to our Terms &amp; Privacy Policy. Protected under DPDP Act 2023. 🇮🇳
      </p>
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
function HomeScreen({ go, verifs, stats, loading, user }: { go: (s: Screen) => void; verifs: Verification[]; stats: Record<string, number> | null; loading: boolean; user: SupabaseUser | null; }) {
  const cats = [
    { Icon: MessageSquare, label: "WhatsApp", color: "#25D366", bg: "#F0FDF4" },
    { Icon: QrCode, label: "QR Code", color: C.blue, bg: C.blueLight },
    { Icon: Globe, label: "Website", color: C.purple, bg: "#F5F3FF" },
    { Icon: Mail, label: "Email", color: C.amber, bg: "#FFFBEB" },
    { Icon: Image, label: "Image", color: "#EC4899", bg: "#FDF2F8" },
    { Icon: Newspaper, label: "News", color: C.red, bg: "#FEF2F2" },
    { Icon: Mic, label: "Voice", color: "#06B6D4", bg: "#ECFEFF" },
    { Icon: Share2, label: "Social", color: "#F97316", bg: "#FFF7ED" },
  ];
  const total = useCountUp(stats?.total ?? 0, 1200);
  const scams = useCountUp(stats?.scamsStopped ?? 0, 1400);
  const prot = useCountUp(stats?.protectedToday ?? 0, 1600);

  return (
    <div className="h-full overflow-y-auto pb-28" style={{ background: C.bg, scrollbarWidth: "none" }}>
      <div style={{ ...DARK_HEADER, paddingBottom: 24 }}>
        <SBar dark />
        <div className="px-5 pt-1">
          <div className="flex items-center justify-between mb-5">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>नमस्ते{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : user ? "" : ", Guest"} 👋</p>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: "white" }}>Stay Protected Today</h1>
            </motion.div>
            <div className="flex gap-2">
              {[
                { Icon: Bell, action: () => go("notifications") },
                { Icon: Settings, action: () => go("settings") },
              ].map((b, i) => (
                <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={b.action}
                  className="w-10 h-10 rounded-xl flex items-center justify-center" style={DC}>
                  <b.Icon size={18} className="text-white" />
                </motion.button>
              ))}
            </div>
          </div>
          <motion.div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-4" style={DC}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Search size={17} style={{ color: "rgba(255,255,255,0.5)" }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Search or paste content to verify…</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <PBtn onClick={() => go("verify-type")} color={C.green}><Zap size={19} />Quick Verify Now</PBtn>
          </motion.div>
          <motion.div className="grid grid-cols-3 gap-3 mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}>
            {[
              { val: total, label: "Verified", Icon: ShieldCheck },
              { val: scams, label: "Scams Caught", Icon: ShieldX },
              { val: prot, label: "Protected", Icon: Activity },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-3 rounded-2xl" style={DC}>
                <s.Icon size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
                <span style={{ fontSize: 17, fontWeight: 900, color: "white" }}>{s.val.toLocaleString("en-IN")}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: 15, fontWeight: 900, color: C.text }}>Verify By Type</span>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => go("verify-type")} style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>See all</motion.button>
        </div>
        <motion.div className="grid grid-cols-4 gap-3" variants={STG} initial="initial" animate="animate">
          {cats.map((cat, i) => (
            <motion.button key={i} variants={ITEM} whileTap={{ scale: 0.9 }} onClick={() => go("upload")}
              className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl" style={{ background: cat.bg }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm" style={{ color: cat.color }}>
                <cat.Icon size={19} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.textMid }}>{cat.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: 15, fontWeight: 900, color: C.text }}>Recent Verifications</span>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => go("history")} style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>View all</motion.button>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <RefreshCw size={16} style={{ color: C.blue }} />
            </motion.div>
            <span style={{ fontSize: 13, color: C.muted }}>Loading…</span>
          </div>
        ) : (
          <motion.div className="flex flex-col gap-3" variants={STG} initial="initial" animate="animate">
            {verifs.slice(0, 3).map((v) => (
              <motion.div key={v.id} variants={ITEM}>
                <GCard className="p-4 flex items-center gap-3.5" onClick={() => go("results")}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: v.result === "fake" ? "#FEF2F2" : v.result === "genuine" ? "#ECFDF5" : "#FEF9C3", color: v.result === "fake" ? C.red : v.result === "genuine" ? C.green : C.amber }}>
                    {v.result === "fake" ? <ShieldX size={19} /> : v.result === "genuine" ? <ShieldCheck size={19} /> : <ShieldAlert size={19} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 800, background: C.bg, color: C.muted }}>{v.type}</span>
                      <span style={{ fontSize: 10, color: "#94A3B8" }}>{new Date(v.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                    </div>
                    <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v.content}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span style={{ fontSize: 18, fontWeight: 900, color: v.score >= 68 ? C.green : v.score >= 38 ? C.amber : C.red }}>{v.score}</span>
                    <VBadge result={v.result} />
                  </div>
                </GCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <div className="px-5 mt-6 flex flex-col gap-4">
        <motion.div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#FEF2F2,#FEE2E2)", border: "1px solid #FECACA" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center gap-2 mb-3">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Flame size={16} style={{ color: C.red }} />
            </motion.div>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#DC2626" }}>Trending Scams in India</span>
          </div>
          {["Fake Aadhaar Update SMS circulating in Maharashtra", "PM Kisan fraud sites targeting farmers across India", "Fake SBI KYC block messages — ignore and block"].map((s, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C.red }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#7F1D1D" }}>{s}</span>
            </div>
          ))}
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => go("alerts")}
            className="mt-3 flex items-center gap-1" style={{ fontSize: 12, fontWeight: 900, color: "#DC2626" }}>
            View all alerts <ArrowRight size={12} />
          </motion.button>
        </motion.div>

        <GCard className="p-4">
          <div className="flex items-start gap-3">
            <motion.div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.blueLight }}
              animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
              <Sparkles size={18} style={{ color: C.blue }} />
            </motion.div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 900, color: C.blue }}>AI Safety Tip of the Day</span>
              <p style={{ fontSize: 13, fontWeight: 500, color: C.text, marginTop: 4, lineHeight: 1.6 }}>
                73% of WhatsApp viral forwards contain false information. Always verify before sharing with family.
              </p>
            </div>
          </div>
        </GCard>

        <motion.div className="rounded-2xl overflow-hidden cursor-pointer" style={{ background: "linear-gradient(135deg,#2563EB 0%,#7C3AED 100%)" }}
          whileTap={{ scale: 0.98 }} onClick={() => go("premium")}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Crown size={17} style={{ color: "#FDE047" }} />
              </motion.div>
              <span style={{ fontSize: 13, fontWeight: 900, color: "white" }}>Upgrade to Pro</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>Unlimited scans · Advanced AI · Export reports</p>
            <span className="px-4 py-2 rounded-xl font-black text-white" style={{ fontSize: 12, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}>
              View Plans →
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Verify Type ───────────────────────────────────────────────────────────────
function VerifyTypeScreen({ go }: { go: (s: Screen) => void }) {
  const types = [
    { Icon: MessageSquare, label: "WhatsApp Message", desc: "Forwards, screenshots, texts", color: "#25D366", bg: "#F0FDF4" },
    { Icon: QrCode, label: "QR Code", desc: "Payment, URL, contact QRs", color: C.blue, bg: C.blueLight },
    { Icon: Globe, label: "Website / URL", desc: "Phishing and scam sites", color: C.purple, bg: "#F5F3FF" },
    { Icon: Mail, label: "Email", desc: "Phishing and fraud emails", color: C.amber, bg: "#FFFBEB" },
    { Icon: Image, label: "Image / Photo", desc: "Deepfakes and edited images", color: "#EC4899", bg: "#FDF2F8" },
    { Icon: Newspaper, label: "News Article", desc: "Fake news and misinformation", color: C.red, bg: "#FEF2F2" },
    { Icon: Mic, label: "Voice Note", desc: "AI voice clones and fake audio", color: "#06B6D4", bg: "#ECFEFF" },
    { Icon: Share2, label: "Social Media Post", desc: "Viral and manipulated posts", color: "#F97316", bg: "#FFF7ED" },
    { Icon: FileText, label: "Document / PDF", desc: "Fake certificates and PDFs", color: C.muted, bg: "#F8FAFC" },
  ];
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: C.bg, scrollbarWidth: "none" }}>
      <SBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => go("home")}
          className="w-9 h-9 rounded-xl flex items-center justify-center" style={GC}>
          <ChevronLeft size={18} />
        </motion.button>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: C.text }}>What to Verify?</h2>
          <p style={{ fontSize: 12, color: C.muted }}>Choose the content type</p>
        </div>
      </div>
      <motion.div className="flex-1 px-5 pb-8 flex flex-col gap-3" variants={STG} initial="initial" animate="animate">
        {types.map((t, i) => (
          <motion.div key={i} variants={ITEM}>
            <GCard className="p-4 flex items-center gap-4" onClick={() => go("upload")}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: t.bg, color: t.color }}>
                <t.Icon size={23} />
              </div>
              <div className="flex-1">
                <p style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{t.label}</p>
                <p style={{ fontSize: 11, color: C.muted }}>{t.desc}</p>
              </div>
              <ChevronRight size={15} style={{ color: "#CBD5E1" }} />
            </GCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Upload ────────────────────────────────────────────────────────────────────
function UploadScreen({ go, onSubmit }: { go: (s: Screen) => void; onSubmit: (text: string, type: string) => void; }) {
  const [text, setText] = useState("");
  const [drag, setDrag] = useState(false);
  const methods = [
    { Icon: Camera, label: "Camera", color: C.blue },
    { Icon: FileImage, label: "Gallery", color: C.purple },
    { Icon: Globe, label: "Paste URL", color: C.green },
    { Icon: QrCode, label: "Scan QR", color: C.amber },
    { Icon: Mic, label: "Record Voice", color: C.red },
    { Icon: FileText, label: "Document", color: "#06B6D4" },
  ];
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: C.bg, scrollbarWidth: "none" }}>
      <SBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => go("verify-type")}
          className="w-9 h-9 rounded-xl flex items-center justify-center" style={GC}>
          <ChevronLeft size={18} />
        </motion.button>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: C.text }}>Upload Content</h2>
          <p style={{ fontSize: 12, color: C.muted }}>WhatsApp · AI Verification</p>
        </div>
      </div>
      <div className="px-5 flex flex-col gap-4 pb-10">
        <motion.div className="rounded-2xl border-2 border-dashed p-8 flex flex-col items-center gap-4"
          animate={{ borderColor: drag ? C.blue : "#CBD5E1", backgroundColor: drag ? C.blueLight : "#ffffff", scale: drag ? 1.02 : 1 }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)} onDrop={() => setDrag(false)}>
          <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: C.blueLight }}
            animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <Upload size={28} style={{ color: C.blue }} />
          </motion.div>
          <div className="text-center">
            <p style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Drop files here</p>
            <p style={{ fontSize: 12, color: C.muted }}>or use any method below</p>
          </div>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>Images, PDFs, Audio, Video supported</span>
        </motion.div>
        <motion.div className="grid grid-cols-3 gap-3" variants={STG} initial="initial" animate="animate">
          {methods.map((m, i) => (
            <motion.button key={i} variants={ITEM} whileTap={{ scale: 0.9 }}
              onClick={() => toast.info(`${m.label} — coming soon!`)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl"
              style={{ background: "white", border: `1px solid ${C.border}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${m.color}14`, color: m.color }}>
                <m.Icon size={19} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textMid }}>{m.label}</span>
            </motion.button>
          ))}
        </motion.div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: C.border }} />
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>or paste text below</span>
          <div className="flex-1 h-px" style={{ background: C.border }} />
        </div>
        <div className="relative">
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Paste WhatsApp message, news text, URL, or email here…"
            className="w-full p-4 resize-none outline-none"
            style={{ background: "white", border: `1.5px solid ${text ? C.blue : C.border}`, borderRadius: 20, fontSize: 13, color: C.text, minHeight: 110, fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: text ? `0 0 0 3px ${C.blue}18` : "none" }}
            rows={4} />
          <AnimatePresence>
            {text && (
              <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                onClick={() => setText("")}
                className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#F1F5F9" }}>
                <X size={11} style={{ color: C.muted }} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {text && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-between px-4 py-2 rounded-xl" style={{ background: C.blueLight }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.blue }}>{text.length} characters · Ready to analyze</span>
              <BadgeCheck size={14} style={{ color: C.blue }} />
            </motion.div>
          )}
        </AnimatePresence>
        <PBtn onClick={() => { if (!text.trim()) { toast.error("Please enter content to verify"); return; } onSubmit(text, "whatsapp"); go("scanning"); }} color={C.blue}>
          <Zap size={18} />Analyze with AI
        </PBtn>
        <div className="flex items-center gap-2 justify-center">
          <Lock size={11} style={{ color: "#94A3B8" }} />
          <span style={{ fontSize: 11, color: "#94A3B8" }}>End-to-end encrypted · Not stored after analysis</span>
        </div>
      </div>
    </div>
  );
}

// ── Scanning ──────────────────────────────────────────────────────────────────
function ScanningScreen({ go }: { go: (s: Screen) => void }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const stages = [
    { label: "Extracting content structure…", Icon: FileText },
    { label: "Cross-referencing 50+ databases…", Icon: BookOpen },
    { label: "Analysing linguistic patterns…", Icon: Activity },
    { label: "Checking source credibility…", Icon: Globe },
    { label: "Running deepfake detection…", Icon: Eye },
    { label: "Computing Trust Score…", Icon: BarChart2 },
    { label: "Generating AI explanation…", Icon: Sparkles },
  ];
  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(id); setTimeout(() => go("results"), 500); return 100; }
        const n = p + 1.4;
        setStage(Math.min(Math.floor(n / 15), stages.length - 1));
        return n;
      });
    }, 55);
    return () => clearInterval(id);
  }, [go, stages.length]);

  const r = 78; const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 30% 30%,#1a3a8f 0%,transparent 55%),radial-gradient(ellipse at 70% 70%,#0a1f5c 0%,transparent 55%),#050A18" }}>
      {[100, 144, 188].map((s, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ width: s, height: s, border: `1px solid rgba(37,99,235,${0.15 - i * 0.04})` }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: "linear" }} />
      ))}
      <div className="relative flex flex-col items-center gap-8 z-10 px-8">
        <div className="relative">
          <svg width={196} height={196} viewBox="0 0 196 196">
            <defs>
              <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
            <circle cx={98} cy={98} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
            <motion.circle cx={98} cy={98} r={r} fill="none" stroke="url(#sg)" strokeWidth={10} strokeLinecap="round"
              strokeDasharray={circ}
              animate={{ strokeDashoffset: circ - (progress / 100) * circ }}
              style={{ transformOrigin: "center", transform: "rotate(-90deg)" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1], filter: ["drop-shadow(0 0 10px rgba(16,185,129,0.5))", "drop-shadow(0 0 24px rgba(16,185,129,0.9))", "drop-shadow(0 0 10px rgba(16,185,129,0.5))"] }}
              transition={{ duration: 1.8, repeat: Infinity }}>
              <ShieldCheck size={46} style={{ color: "#10B981" }} />
            </motion.div>
            <span style={{ fontSize: 28, fontWeight: 900, color: "white", marginTop: 4 }}>{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "white" }}>AI Analyzing Content</h2>
          <AnimatePresence mode="wait">
            <motion.div key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full" style={DC}>
              <motion.div className="w-2 h-2 rounded-full" style={{ background: "#10B981" }}
                animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{stages[stage].label}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="w-full flex flex-col gap-2.5">
          {stages.map((s, i) => {
            const done = i < stage; const active = i === stage;
            return (
              <motion.div key={i} className="flex items-center gap-3"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: done || active ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.06 }}>
                <motion.div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  animate={{ scale: active ? [1, 1.15, 1] : 1 }} transition={{ duration: 0.8, repeat: active ? Infinity : 0 }}
                  style={{ background: done ? "#10B981" : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)" }}>
                  {done ? <Check size={11} className="text-white" /> : <s.Icon size={11} style={{ color: "rgba(255,255,255,0.5)" }} />}
                </motion.div>
                <span style={{ fontSize: 12, fontWeight: 500, color: done || active ? "white" : "rgba(255,255,255,0.3)" }}>{s.label}</span>
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={DC}>
          <Clock size={13} style={{ color: "rgba(255,255,255,0.45)" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Est. {Math.max(0, Math.ceil((100 - progress) * 0.055))}s · 94% accuracy</span>
        </div>
      </div>
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────
const DEMO_RESULT: Verification = {
  id: "demo", type: "WhatsApp", content: "PM announces free ₹15,000 for all Indians — forward to claim…",
  score: 7, result: "fake", riskLevel: "critical",
  explanation: "This content shows strong indicators of fraud. Multiple scam patterns detected including forwarding requests and fabricated government scheme claims with monetary lures.",
  evidence: [
    { type: "Pattern Analysis", detail: "Viral forwarding request combined with monetary claim — primary misinformation tactic", status: "fail" },
    { type: "Source Check", detail: "No official government announcement matching this claim found in any verified database", status: "fail" },
    { type: "Urgency Analysis", detail: "Artificial urgency language used to drive hasty decisions without fact-checking", status: "fail" },
    { type: "Domain Verification", detail: "Links to unregistered domain created just 2 days ago — classic phishing indicator", status: "fail" },
    { type: "Fact Database", detail: "Flagged by PIB Fact Check and AltNews as circulating misinformation", status: "warn" },
  ],
  recommendedAction: "Block sender immediately. Do NOT share this content. Report at cybercrime.gov.in or call 1930.",
  createdAt: new Date().toISOString(),
};

function ResultsScreen({ go, result }: { go: (s: Screen) => void; result: Verification | null; }) {
  const [tab, setTab] = useState<"summary" | "evidence" | "action">("summary");
  const r = result ?? DEMO_RESULT;
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6" style={{ background: C.bg, scrollbarWidth: "none" }}>
      <div style={{ ...DARK_HEADER, paddingBottom: 28 }}>
        <SBar dark />
        <div className="flex items-center gap-3 px-5 pt-1 mb-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => go("home")}
            className="w-9 h-9 rounded-xl flex items-center justify-center" style={DC}>
            <ChevronLeft size={18} className="text-white" />
          </motion.button>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "white" }}>Verification Result</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{r.type} · {new Date(r.createdAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 px-5">
          <TrustGauge score={r.score} />
          <div className="flex items-center gap-3 mt-1">
            <VBadge result={r.result} />
            <RiskChip level={r.riskLevel} />
          </div>
        </div>
      </div>

      <div className="flex gap-1 mx-5 mt-5 p-1.5 rounded-2xl" style={GC}>
        {(["summary", "evidence", "action"] as const).map(t => (
          <motion.button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl font-bold capitalize relative overflow-hidden"
            style={{ fontSize: 13, color: tab === t ? "white" : C.muted }}>
            {tab === t && <motion.div layoutId="tabBg" className="absolute inset-0 rounded-xl" style={{ background: `linear-gradient(135deg,${C.blue},${C.blueDark})` }} />}
            <span className="relative z-10">{t}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="px-5 mt-4 flex flex-col gap-4">
          {tab === "summary" && (
            <>
              <GCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.blueLight }}>
                    <Bot size={16} style={{ color: C.blue }} />
                  </div>
                  <span style={{ fontWeight: 900, fontSize: 13, color: C.text }}>AI Explanation</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: C.textMid }}>{r.explanation}</p>
              </GCard>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Credibility", val: r.score < 30 ? "Very Low" : r.score < 60 ? "Low" : "High", color: r.score < 60 ? C.red : C.green, Icon: ShieldCheck },
                  { label: "AI Confidence", val: "94%", color: C.blue, Icon: Sparkles },
                  { label: "Risk Level", val: r.riskLevel.charAt(0).toUpperCase() + r.riskLevel.slice(1), color: r.riskLevel === "critical" ? C.red : r.riskLevel === "high" ? C.amber : C.green, Icon: AlertTriangle },
                  { label: "Evidence Found", val: `${r.evidence.length} items`, color: C.purple, Icon: BookOpen },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <GCard className="p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${item.color}14`, color: item.color }}>
                        <item.Icon size={16} />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: C.muted }}>{item.label}</p>
                        <p style={{ fontWeight: 900, fontSize: 13, color: C.text }}>{item.val}</p>
                      </div>
                    </GCard>
                  </motion.div>
                ))}
              </div>
            </>
          )}
          {tab === "evidence" && (
            <motion.div className="flex flex-col gap-3" variants={STG} initial="initial" animate="animate">
              {r.evidence.map((ev, i) => (
                <motion.div key={i} variants={ITEM}>
                  <GCard className="p-4 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: ev.status === "pass" ? "#DCFCE7" : ev.status === "fail" ? "#FEE2E2" : "#FEF3C7" }}>
                      {ev.status === "pass" ? <Check size={13} style={{ color: C.green }} /> : ev.status === "fail" ? <X size={13} style={{ color: C.red }} /> : <AlertTriangle size={13} style={{ color: C.amber }} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{ev.type}</p>
                      <p style={{ fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 1.6 }}>{ev.detail}</p>
                    </div>
                  </GCard>
                </motion.div>
              ))}
              <GCard className="p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.blueLight }}>
                  <Info size={15} style={{ color: C.blue }} />
                </div>
                <p style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>Analysis by TrustAI Engine v3.1 · 94% accuracy across 50M+ verifications</p>
              </GCard>
            </motion.div>
          )}
          {tab === "action" && (
            <motion.div className="flex flex-col gap-3" variants={STG} initial="initial" animate="animate">
              <motion.div variants={ITEM} className="rounded-2xl p-4"
                style={{ background: r.result === "fake" ? "#FEF2F2" : r.result === "genuine" ? "#ECFDF5" : "#FFFBEB", border: `1px solid ${r.result === "fake" ? "#FECACA" : r.result === "genuine" ? "#BBF7D0" : "#FDE68A"}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={15} style={{ color: r.result === "fake" ? C.red : r.result === "genuine" ? C.green : C.amber }} />
                  <span style={{ fontWeight: 900, fontSize: 13, color: r.result === "fake" ? "#DC2626" : r.result === "genuine" ? "#16A34A" : "#D97706" }}>Recommended Action</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: r.result === "fake" ? "#7F1D1D" : r.result === "genuine" ? "#14532D" : "#78350F" }}>{r.recommendedAction}</p>
              </motion.div>
              {[
                { Icon: Flag, label: "Report as Scam", color: C.red, bg: "#FEF2F2", fn: () => toast.success("Scam reported! Our team will review within 24h.") },
                { Icon: Share2, label: "Share Result", color: C.blue, bg: C.blueLight, fn: () => toast.success("Sharing result…") },
                { Icon: Bookmark, label: "Save Report", color: C.purple, bg: "#F5F3FF", fn: () => toast.success("Report saved!") },
                { Icon: ExternalLink, label: "Report to Cyber Crime", color: C.green, bg: "#ECFDF5", fn: () => toast.info("Visit cybercrime.gov.in or call 1930") },
              ].map((btn, i) => (
                <motion.button key={i} variants={ITEM} whileTap={{ scale: 0.97 }} onClick={btn.fn}
                  className="w-full p-4 rounded-2xl flex items-center gap-3" style={{ background: btn.bg, border: `1px solid ${C.border}` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "white", color: btn.color, boxShadow: "0 2px 8px rgba(15,23,42,0.08)" }}>
                    <btn.Icon size={16} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{btn.label}</span>
                  <ChevronRight size={15} style={{ color: "#CBD5E1", marginLeft: "auto" }} />
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────
function HistoryScreen({ go, verifs, onDel }: { go: (s: Screen) => void; verifs: Verification[]; onDel: (id: string) => void; }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const shown = verifs.filter(v => (filter === "all" || v.result === filter) && (!q || v.content.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28" style={{ background: C.bg, scrollbarWidth: "none" }}>
      <SBar />
      <div className="px-5 pt-2 pb-3 flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text }}>History</h2>
          <p style={{ fontSize: 12, color: C.muted }}>{verifs.length} verifications</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-xl flex items-center justify-center" style={GC}>
          <Filter size={15} style={{ color: C.muted }} />
        </motion.button>
      </div>
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={GC}>
          <Search size={15} style={{ color: C.muted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search verifications…"
            className="flex-1 outline-none bg-transparent" style={{ fontSize: 13, color: C.text, fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
        </div>
      </div>
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {["all", "fake", "genuine", "suspicious"].map(f => (
          <motion.button key={f} whileTap={{ scale: 0.93 }} onClick={() => setFilter(f)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full font-bold capitalize"
            style={filter === f ? { background: C.blue, color: "white", fontSize: 12, boxShadow: `0 4px 14px ${C.blue}44` } : { ...GC, color: C.muted, fontSize: 12 }}>
            {f}
          </motion.button>
        ))}
      </div>
      <motion.div className="px-5 flex flex-col gap-3" variants={STG} initial="initial" animate="animate">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <ShieldCheck size={40} style={{ color: "#CBD5E1" }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: C.muted }}>No verifications found</p>
          </div>
        ) : shown.map(v => (
          <motion.div key={v.id} variants={ITEM} layout>
            <GCard className="p-4 flex items-center gap-3.5" onClick={() => go("results")}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: v.result === "fake" ? "#FEF2F2" : v.result === "genuine" ? "#ECFDF5" : "#FEF9C3", color: v.result === "fake" ? C.red : v.result === "genuine" ? C.green : C.amber }}>
                {v.result === "fake" ? <ShieldX size={20} /> : v.result === "genuine" ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 800, background: C.bg, color: C.muted }}>{v.type}</span>
                  <span style={{ fontSize: 10, color: "#94A3B8" }}>{new Date(v.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                </div>
                <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v.content}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span style={{ fontSize: 17, fontWeight: 900, color: v.score >= 68 ? C.green : v.score >= 38 ? C.amber : C.red }}>{v.score}</span>
                <VBadge result={v.result} />
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={e => { e.stopPropagation(); onDel(v.id); toast.success("Deleted"); }}
                className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FEF2F2" }}>
                <Trash2 size={13} style={{ color: C.red }} />
              </motion.button>
            </GCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Alerts ────────────────────────────────────────────────────────────────────
function AlertsScreen({ go, alerts }: { go: (s: Screen) => void; alerts: ScamAlert[]; }) {
  const sev: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
    high: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
    medium: { bg: C.blueLight, text: C.blue, border: "#BFDBFE" },
    low: { bg: "#ECFDF5", text: "#16A34A", border: "#BBF7D0" },
  };
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28" style={{ background: C.bg, scrollbarWidth: "none" }}>
      <SBar />
      <div className="px-5 pt-2 pb-4 flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text }}>Scam Alerts</h2>
          <p style={{ fontSize: 12, color: C.muted }}>{alerts.length} active alerts</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => toast.success("Scam report submitted! Thank you.")}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-white"
          style={{ fontSize: 12, background: C.red, boxShadow: `0 4px 14px ${C.red}44` }}>
          <Flag size={13} />Report Scam
        </motion.button>
      </div>
      <div className="px-5 mb-4">
        <motion.div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg,${C.red},#DC2626)` }}
          animate={{ boxShadow: [`0 4px 20px ${C.red}44`, `0 4px 36px ${C.red}66`, `0 4px 20px ${C.red}44`] }}
          transition={{ duration: 2, repeat: Infinity }}>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
            <Radio size={22} className="text-white" />
          </motion.div>
          <div>
            <p style={{ fontWeight: 900, color: "white", fontSize: 13 }}>Emergency Alert Active</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{alerts.filter(a => a.severity === "critical").length} critical scams detected nationwide</p>
          </div>
        </motion.div>
      </div>
      <motion.div className="px-5 flex flex-col gap-3" variants={STG} initial="initial" animate="animate">
        {alerts.map((a, i) => {
          const s = sev[a.severity] ?? sev.medium;
          return (
            <motion.div key={a.id ?? i} variants={ITEM}>
              <div className="rounded-2xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="flex items-start gap-3">
                  <span style={{ fontSize: 22 }}>{a.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontWeight: 900, fontSize: 13, color: C.text }}>{a.title}</span>
                      <span style={{ fontSize: 10, color: s.text }}>{a.time}</span>
                    </div>
                    <p style={{ fontSize: 12, lineHeight: 1.6, color: C.textMid, marginBottom: 10 }}>{a.desc}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black px-2.5 py-0.5 rounded-full" style={{ fontSize: 10, background: s.text }}>{a.agency}</span>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => go("upload")}
                        style={{ fontSize: 12, fontWeight: 700, color: s.text }}>Verify this →</motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      <div className="px-5 mt-5 mb-4">
        <h3 style={{ fontWeight: 900, fontSize: 15, color: C.text, marginBottom: 12 }}>Government Partners</h3>
        {["PIB Fact Check", "Cyber Dost", "RBI Kehta Hai"].map((org, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.3 }}>
            <GCard className="p-3.5 flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.blueLight }}>
                <BadgeCheck size={19} style={{ color: C.blue }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{org}</p>
                  <BadgeCheck size={13} style={{ color: C.blue }} />
                </div>
                <p style={{ fontSize: 11, color: C.muted }}>Official government partner</p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} className="px-3 py-1.5 rounded-xl font-black"
                style={{ fontSize: 11, background: C.blueLight, color: C.blue }}>Follow</motion.button>
            </GCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Assistant ─────────────────────────────────────────────────────────────────
interface Msg { role: "user" | "assistant"; text: string; time: string; }
const AI_RESP = [
  "Great question! Based on my analysis, this type of message uses urgency triggers and information requests — major red flags. I recommend not sharing and verifying through official sources.",
  "This is a very common scam in India. The giveaway is the generic sender ID and OTP request. Real banks NEVER ask for OTP via SMS. Block the sender immediately.",
  "The linguistic patterns suggest AI-generated misinformation. I found similar content flagged by PIB Fact Check in the last 48 hours.",
  "The domain was registered just 3 days ago — a classic phishing indicator. Do NOT enter any personal information.",
  "This matches a known scam pattern targeting rural India. Please report at cybercrime.gov.in or call the National Cyber Crime Helpline: 1930.",
];

function AssistantScreen() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: "assistant",
    text: "नमस्ते! I'm your TrustAI assistant. I can verify content, explain scam tactics, and help you stay safe online. How can I help? 🛡️",
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [ri, setRi] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const SUGG = ["Is this WhatsApp forward fake?", "How to spot phishing emails?", "Common UPI scams 2024", "Report a scam to cybercrime portal"];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const send = useCallback(() => {
    if (!input.trim()) return;
    const t = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setMsgs(m => [...m, { role: "user", text: input, time: t }]);
    setInput(""); setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { role: "assistant", text: AI_RESP[ri % AI_RESP.length], time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
      setRi(i => i + 1);
    }, 1600);
  }, [input, ri]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }}>
      <SBar />
      <div className="px-5 py-3 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})` }}>
          <Bot size={21} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 style={{ fontWeight: 900, fontSize: 15, color: C.text }}>TrustAI Assistant</h2>
          <div className="flex items-center gap-1.5">
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }}
              animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>Online · Powered by AI</span>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-xl flex items-center justify-center" style={GC}>
          <MoreHorizontal size={17} style={{ color: C.muted }} />
        </motion.button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence>
          {msgs.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})` }}>
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className="max-w-[80%]">
                <div className={`px-4 py-3 rounded-2xl font-medium leading-relaxed ${msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"}`}
                  style={msg.role === "user"
                    ? { fontSize: 13, background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, color: "white", boxShadow: `0 4px 16px ${C.blue}44` }
                    : { fontSize: 13, ...GC, color: C.text }}>
                  {msg.text}
                </div>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 4, paddingLeft: 4, textAlign: msg.role === "user" ? "right" : "left" }}>{msg.time}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg,${C.blue},${C.purple})` }}>
              <Bot size={14} className="text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5" style={GC}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: C.muted }}
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>
      {msgs.length <= 1 && (
        <div className="px-5 pb-2">
          <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8 }}>Suggested:</p>
          <div className="flex flex-wrap gap-2">
            {SUGG.map((s, i) => (
              <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => setInput(s)}
                className="px-3 py-1.5 rounded-xl font-semibold" style={{ fontSize: 11, ...GC, color: C.textMid }}>
                {s}
              </motion.button>
            ))}
          </div>
        </div>
      )}
      <div className="px-4 pb-28 pt-2 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={GC}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => toast.info("Attachment — coming soon!")}
            className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.bg }}>
            <Paperclip size={15} style={{ color: C.muted }} />
          </motion.button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask about any scam or content…"
            className="flex-1 outline-none bg-transparent" style={{ fontSize: 13, color: C.text, fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
          <motion.button whileTap={{ scale: 0.88 }} onClick={send}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            animate={{ backgroundColor: input ? C.blue : "#F1F5F9" }}
            style={{ boxShadow: input ? `0 4px 12px ${C.blue}44` : "none" }}>
            {input ? <Send size={15} className="text-white" /> : <Mic size={15} style={{ color: C.muted }} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function ProfileScreen({ go, user, onSignOut }: { go: (s: Screen) => void; user: SupabaseUser | null; onSignOut: () => void; }) {
  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? (user?.email ? user.email.split("@")[0] : "Guest User");
  const displayEmail = user?.email ?? user?.phone ?? "guest@trustai.in";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "TU";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const secs = [
    { title: "Account", items: [{ Icon: User, label: "Personal Information", color: C.blue }, { Icon: Languages, label: "Language", sub: "English", color: C.purple }, { Icon: Bell, label: "Notifications", color: C.amber }] },
    { title: "App", items: [{ Icon: Crown, label: "Premium Plan", sub: "Free Tier", color: C.amber, s: "premium" as Screen }, { Icon: Lock, label: "Privacy & Security", color: C.green }, { Icon: Accessibility, label: "Accessibility", color: "#06B6D4" }, { Icon: Moon, label: "Appearance", color: "#475569" }] },
    { title: "Support", items: [{ Icon: HelpCircle, label: "Help & FAQ", color: C.blue }, { Icon: Flag, label: "Report an Issue", color: C.red }, { Icon: Info, label: "About TrustAI India", color: C.muted }] },
    { title: "Data", items: [{ Icon: Download, label: "Export My Data", color: C.green }, { Icon: Trash2, label: "Delete Account", color: C.red }] },
  ];
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28" style={{ background: C.bg, scrollbarWidth: "none" }}>
      <div style={{ ...DARK_HEADER, paddingBottom: 28 }}>
        <SBar dark />
        <div className="flex flex-col items-center pt-2">
          <motion.div className="relative mb-3" initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-20 h-20 rounded-3xl object-cover"
                style={{ boxShadow: `0 12px 40px ${C.blue}55` }} />
            ) : (
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-white"
                style={{ fontSize: 26, background: `linear-gradient(135deg,${C.blue},${C.purple})`, boxShadow: `0 12px 40px ${C.blue}55` }}>
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.green, border: "2px solid #050A18" }}>
              <BadgeCheck size={14} className="text-white" />
            </div>
          </motion.div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{displayName}</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{displayEmail}</p>
          <div className="flex gap-3 mt-5">
            {[{ label: "Verified", val: "124" }, { label: "Scams Found", val: "31" }, { label: "Saved", val: "18" }].map((s, i) => (
              <div key={i} className="flex flex-col items-center px-5 py-2.5 rounded-2xl" style={DC}>
                <span style={{ fontWeight: 900, color: "white", fontSize: 18 }}>{s.val}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 mt-5 flex flex-col gap-5">
        {secs.map((sec, si) => (
          <motion.div key={si} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.08 }}>
            <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 8 }}>{sec.title}</p>
            <div className="rounded-2xl overflow-hidden" style={GC}>
              {sec.items.map((item, ii) => (
                <motion.button key={ii} whileTap={{ background: "#F8FAFC" }} onClick={() => item.s && go(item.s)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  style={{ borderBottom: ii < sec.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${item.color}14`, color: item.color }}>
                    <item.Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{item.label}</p>
                    {item.sub && <p style={{ fontSize: 11, color: C.muted }}>{item.sub}</p>}
                  </div>
                  <ChevronRight size={15} style={{ color: "#CBD5E1" }} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
        <motion.button whileTap={{ scale: 0.97 }} onClick={onSignOut}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold mb-4"
          style={{ background: "#FEF2F2", color: C.red, fontSize: 14, borderRadius: 20 }}>
          <LogOut size={17} />Sign Out
        </motion.button>
      </div>
    </div>
  );
}

// ── Premium ───────────────────────────────────────────────────────────────────
function PremiumScreen({ go }: { go: (s: Screen) => void }) {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const feats = [
    ["5 scans/day", "Unlimited scans", "Unlimited + API"],
    ["Basic AI Engine", "Advanced AI v3", "Enterprise AI v4"],
    ["Summary report", "Full detailed report", "Forensic report PDF"],
    ["—", "Priority support", "24/7 dedicated support"],
    ["—", "Batch scanning", "Team management"],
    ["—", "CSV data export", "API + webhooks"],
  ];
  const plans = [
    { name: "Free", price: "₹0", period: "forever", color: C.muted, hi: false },
    { name: "Pro", price: billing === "annual" ? "₹99" : "₹149", period: billing === "annual" ? "/mo · ₹1,188/yr" : "/month", color: C.blue, hi: true },
    { name: "Business", price: billing === "annual" ? "₹299" : "₹399", period: billing === "annual" ? "/mo · ₹3,588/yr" : "/month", color: C.purple, hi: false },
  ];
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-8" style={{ background: C.bg, scrollbarWidth: "none" }}>
      <div style={{ background: `linear-gradient(160deg,#050A18 0%,${C.blue} 100%)`, borderRadius: "0 0 32px 32px", paddingBottom: 24 }}>
        <SBar dark />
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => go("profile")} className="ml-5 mb-4 w-9 h-9 rounded-xl flex items-center justify-center" style={DC}>
          <ChevronLeft size={18} className="text-white" />
        </motion.button>
        <div className="flex flex-col items-center">
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
            <Crown size={36} style={{ color: "#FDE047" }} />
          </motion.div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "white", marginTop: 8 }}>Go Premium</h2>
          <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.65)", marginTop: 4, marginBottom: 20, textAlign: "center", paddingLeft: 32, paddingRight: 32 }}>Unlimited verification · Advanced AI · Export reports</p>
          <div className="flex gap-1 p-1 rounded-xl" style={DC}>
            {(["monthly", "annual"] as const).map(b => (
              <motion.button key={b} onClick={() => setBilling(b)} className="px-5 py-2 rounded-lg font-bold capitalize"
                style={billing === b ? { background: "white", color: C.blue, fontSize: 13 } : { color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                {b}{b === "annual" && <span style={{ color: C.green }}> −33%</span>}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 mt-5 flex gap-3">
        {plans.map((plan, i) => (
          <motion.div key={i} className="flex-1 rounded-2xl p-3.5 flex flex-col gap-2.5"
            style={plan.hi ? { background: plan.color, boxShadow: `0 12px 40px ${plan.color}44`, borderRadius: 20 } : { ...GC, borderRadius: 20 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, color: plan.hi ? "rgba(255,255,255,0.7)" : C.muted }}>{plan.name}</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: plan.hi ? "white" : C.text }}>{plan.price}</p>
              <p style={{ fontSize: 9, lineHeight: 1.4, color: plan.hi ? "rgba(255,255,255,0.55)" : "#94A3B8" }}>{plan.period}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {feats.map((row, ri) => (
                <div key={ri} className="flex items-center gap-1.5">
                  {row[i] === "—" ? <X size={9} style={{ color: plan.hi ? "rgba(255,255,255,0.3)" : "#CBD5E1", flexShrink: 0 }} /> : <Check size={9} style={{ color: plan.hi ? "#FDE047" : plan.color, flexShrink: 0 }} />}
                  <span style={{ fontSize: 9, fontWeight: 500, lineHeight: 1.3, color: plan.hi ? (row[i] === "—" ? "rgba(255,255,255,0.25)" : "white") : (row[i] === "—" ? "#CBD5E1" : C.textMid) }}>{row[i]}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="px-5 mt-5">
        <PBtn color={C.blue} onClick={() => toast.success("Starting 7-day free trial! 🎉")}>
          <Crown size={17} />Start 7-Day Free Trial
        </PBtn>
        <p style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 12 }}>No credit card needed · Cancel anytime · Secured by Razorpay 🔐</p>
      </div>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
function NotifScreen() {
  const items = [
    { icon: "🚨", title: "Critical Scam Alert", body: "New UPI refund fraud active in Delhi NCR — stay alert", time: "2m ago", unread: true },
    { icon: "✅", title: "Verification Complete", body: "Your WhatsApp message scored 7/100 — Confirmed Fake", time: "15m ago", unread: true },
    { icon: "📋", title: "Weekly Safety Report", body: "You verified 12 items this week and caught 7 scams — great job!", time: "2h ago", unread: true },
    { icon: "💡", title: "AI Safety Tip", body: "73% of viral forwards are false. Always verify before sharing with family.", time: "5h ago", unread: false },
    { icon: "🔔", title: "New Login Detected", body: "New sign-in from Chrome, Mumbai — was this you?", time: "Yesterday", unread: false },
    { icon: "🎉", title: "Milestone Reached!", body: "You have verified 100+ items! Helping protect India. 🇮🇳", time: "2 days ago", unread: false },
  ];
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28" style={{ background: C.bg, scrollbarWidth: "none" }}>
      <SBar />
      <div className="px-5 pt-2 pb-4 flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text }}>Notifications</h2>
          <p style={{ fontSize: 12, color: C.muted }}>{items.filter(n => n.unread).length} unread</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>Mark all read</motion.button>
      </div>
      <motion.div className="px-5 flex flex-col gap-2.5" variants={STG} initial="initial" animate="animate">
        {items.map((n, i) => (
          <motion.div key={i} variants={ITEM}>
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={n.unread ? { ...GC, border: `1px solid ${C.blue}22` } : { background: "rgba(255,255,255,0.5)", border: `1px solid ${C.border}` }}>
              {n.unread && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: C.blue }} />}
              <span style={{ fontSize: 20 }}>{n.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p style={{ fontWeight: 700, fontSize: 13, color: n.unread ? C.text : C.muted }}>{n.title}</p>
                  <span style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0 }}>{n.time}</span>
                </div>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 1.6 }}>{n.body}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function SettingsScreen({ go }: { go: (s: Screen) => void }) {
  const [dark, setDark] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const [bio, setBio] = useState(true);
  const groups = [
    { title: "Appearance", items: [
      { Icon: Moon, label: "Dark Mode", color: "#475569", toggle: true, val: dark, set: () => { setDark(d => !d); toast.success(dark ? "Light mode enabled" : "Dark mode enabled"); } },
      { Icon: Languages, label: "Language", color: C.purple, sub: "English" },
      { Icon: Accessibility, label: "Accessibility", color: "#06B6D4" },
    ]},
    { title: "Privacy & Security", items: [
      { Icon: Lock, label: "Biometric Lock", color: C.green, toggle: true, val: bio, set: () => setBio(b => !b) },
      { Icon: Bell, label: "Push Notifications", color: C.amber, toggle: true, val: notifs, set: () => setNotifs(n => !n) },
      { Icon: Eye, label: "Privacy Controls", color: C.blue },
    ]},
    { title: "Permissions", items: [
      { Icon: Camera, label: "Camera", color: C.red, sub: "Allowed" },
      { Icon: Mic, label: "Microphone", color: C.purple, sub: "Allowed" },
      { Icon: Bell, label: "Notifications", color: C.amber, sub: "Allowed" },
      { Icon: MapPin, label: "Location", color: C.green, sub: "Denied" },
    ]},
  ];
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-8" style={{ background: C.bg, scrollbarWidth: "none" }}>
      <SBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => go("profile")}
          className="w-9 h-9 rounded-xl flex items-center justify-center" style={GC}>
          <ChevronLeft size={18} />
        </motion.button>
        <h2 style={{ fontSize: 17, fontWeight: 900, color: C.text }}>Settings</h2>
      </div>
      <div className="px-5 flex flex-col gap-5">
        {groups.map((g, gi) => (
          <motion.div key={gi} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.1 }}>
            <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 8 }}>{g.title}</p>
            <div className="rounded-2xl overflow-hidden" style={GC}>
              {g.items.map((item, ii) => (
                <div key={ii} className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: ii < g.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${item.color}14`, color: item.color }}>
                    <item.Icon size={15} />
                  </div>
                  <div className="flex-1">
                    <p style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{item.label}</p>
                    {item.sub && <p style={{ fontSize: 11, color: C.muted }}>{item.sub}</p>}
                  </div>
                  {item.toggle ? (
                    <motion.button onClick={item.set} style={{ width: 46, height: 26, borderRadius: 13, position: "relative" }}
                      animate={{ backgroundColor: item.val ? C.blue : "#CBD5E1" }}>
                      <motion.div style={{ position: "absolute", top: 3, width: 20, height: 20, borderRadius: 10, background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
                        animate={{ left: item.val ? 22 : 3 }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                    </motion.button>
                  ) : <ChevronRight size={15} style={{ color: "#CBD5E1" }} />}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="rounded-2xl p-4" style={GC}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg,${C.blue},${C.blueDark})` }}>
                <ShieldCheck size={24} className="text-white" />
              </div>
              <div>
                <p style={{ fontWeight: 900, color: C.text }}>TrustAI India</p>
                <p style={{ fontSize: 11, color: C.muted }}>v1.0.0 · DPDP Act 2023 Compliant</p>
              </div>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: C.muted }}>Made with ❤️ for Bharat. Protecting millions of Indians from digital fraud every day. 🇮🇳</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [verifs, setVerifs] = useState<Verification[]>([]);
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastResult, setLastResult] = useState<Verification | null>(null);

  const go = useCallback((s: Screen) => setScreen(s), []);

  // ── Auth session listener ──────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // After splash: route based on auth state
  const handleSplashDone = useCallback(() => {
    if (user) go("home");
    else go("onboarding");
  }, [user, go]);

  const handleSignedIn = useCallback(() => {
    toast.success("Welcome to TrustAI India! 🛡️");
    go("home");
  }, [go]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setVerifs([]); setAlerts([]); setStats(null);
    go("signin");
    toast.success("Signed out successfully.");
  }, [go]);

  const navActive = (["home", "history", "alerts", "assistant", "profile"] as Screen[]).includes(screen) ? screen : "";
  const showNav = (["home", "history", "alerts", "assistant", "profile"] as Screen[]).includes(screen);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [vs, als, st] = await Promise.all([api("/verifications"), api("/scam-alerts"), api("/stats")]);
      setVerifs(vs); setAlerts(als); setStats(st);
    } catch { toast.error("Could not load data — showing cached content."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (screen === "home") loadData(); }, [screen, loadData]);

  const handleSubmit = useCallback(async (text: string, type: string) => {
    try {
      const result = await api("/verifications", { method: "POST", body: JSON.stringify({ content: text, type }) });
      setLastResult(result);
      setVerifs(v => [result, ...v]);
    } catch { toast.error("Analysis failed — showing demo result."); }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setVerifs(v => v.filter(x => x.id !== id));
    try { await api(`/verifications/${id}`, { method: "DELETE" }); } catch { /* silent */ }
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case "splash": return <SplashScreen onDone={authReady ? handleSplashDone : () => go("onboarding")} />;
      case "onboarding": return <OnboardingScreen onDone={() => go("signin")} />;
      case "signin": return <SignInScreen onDone={handleSignedIn} />;
      case "home": return <HomeScreen go={go} verifs={verifs} stats={stats} loading={loading} user={user} />;
      case "verify-type": return <VerifyTypeScreen go={go} />;
      case "upload": return <UploadScreen go={go} onSubmit={handleSubmit} />;
      case "scanning": return <ScanningScreen go={go} />;
      case "results": return <ResultsScreen go={go} result={lastResult} />;
      case "history": return <HistoryScreen go={go} verifs={verifs} onDel={handleDelete} />;
      case "alerts": return <AlertsScreen go={go} alerts={alerts} />;
      case "assistant": return <AssistantScreen />;
      case "profile": return <ProfileScreen go={go} user={user} onSignOut={handleSignOut} />;
      case "premium": return <PremiumScreen go={go} />;
      case "notifications": return <NotifScreen />;
      case "settings": return <SettingsScreen go={go} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4"
      style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "radial-gradient(ellipse at 20% 50%,#0d1f5c 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,#1a0a2e 0%,transparent 50%),#08091a" }}>
      <Toaster position="top-center" richColors toastOptions={{ style: { fontFamily: "'Plus Jakarta Sans',sans-serif", borderRadius: 16, fontSize: 13, fontWeight: 600 } }} />

      {/* Ambient orbs */}
      {[
        { w: 320, h: 320, top: "8%", left: "8%", c: "rgba(37,99,235,0.13)" },
        { w: 220, h: 220, top: "55%", left: "68%", c: "rgba(124,58,237,0.11)" },
        { w: 160, h: 160, top: "28%", left: "58%", c: "rgba(16,185,129,0.09)" },
      ].map((o, i) => (
        <motion.div key={i} className="fixed rounded-full pointer-events-none"
          style={{ width: o.w, height: o.h, top: o.top, left: o.left, background: `radial-gradient(circle,${o.c},transparent 70%)`, filter: "blur(40px)" }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5 + i * 2, repeat: Infinity, ease: "easeInOut" }} />
      ))}

      {/* Phone frame */}
      <div className="relative flex-shrink-0" style={{ width: 390, height: 844, borderRadius: 50, background: "#0F172A", boxShadow: "0 50px 100px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.08),inset 0 1px 0 rgba(255,255,255,0.12)" }}>
        {/* Side buttons */}
        {[{ side: "left", top: 130, h: 32 }, { side: "left", top: 178, h: 56 }, { side: "left", top: 238, h: 56 }, { side: "right", top: 168, h: 80 }].map((b, i) => (
          <div key={i} style={{ position: "absolute", [b.side]: -3, top: b.top, width: 3, height: b.h, background: "#1E293B", borderRadius: b.side === "left" ? "2px 0 0 2px" : "0 2px 2px 0" }} />
        ))}

        {/* Screen */}
        <div className="absolute overflow-hidden" style={{ inset: 2, borderRadius: 48, background: C.bg }}>
          <AnimatePresence mode="wait">
            <motion.div key={screen} className="absolute inset-0" {...SLIDE}>
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
          {showNav && <BNav active={navActive} go={go} />}
        </div>

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
          style={{ width: 130, height: 36, background: "#0F172A", borderRadius: "0 0 22px 22px" }}>
          <div style={{ width: 50, height: 16, background: "#1E293B", borderRadius: 8 }} />
          <div style={{ position: "absolute", right: 36, width: 12, height: 12, background: "#1E293B", borderRadius: "50%" }} />
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50" style={{ width: 112, height: 5, background: "rgba(255,255,255,0.2)", borderRadius: 3 }} />

        {/* Glare */}
        <div className="absolute inset-[2px] pointer-events-none" style={{ borderRadius: 48, background: "linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 50%)" }} />
      </div>

      {/* Screen jump pills */}
      <div className="relative z-10 flex flex-wrap gap-1.5 justify-center max-w-xl px-4">
        {(["home","verify-type","upload","scanning","results","history","alerts","assistant","profile","premium","notifications","settings"] as Screen[]).map(s => (
          <motion.button key={s} whileTap={{ scale: 0.91 }} onClick={() => go(s)}
            className="px-2.5 py-1 rounded-full font-bold capitalize"
            style={screen === s ? { fontSize: 10, background: C.blue, color: "white", boxShadow: `0 3px 10px ${C.blue}55` } : { fontSize: 10, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {s.replace("-", " ")}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
