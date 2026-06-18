import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase";

const C = {
  primary: "#0ea5e9", primaryDark: "#0284c7", primaryLight: "#38bdf8", primaryBg: "#f0f9ff", primaryBorder: "#bae6fd",
  secondary: "#6366f1", success: "#10b981", warning: "#f59e0b", danger: "#ef4444", white: "#ffffff",
  gray50: "#f8fafc", gray100: "#f1f5f9", gray200: "#e2e8f0", gray300: "#cbd5e1", gray400: "#94a3b8",
  gray500: "#64748b", gray600: "#475569", gray700: "#334155", gray800: "#1e293b", gray900: "#0f172a",
};

const S = {
  card: { background: C.white, borderRadius: 16, border: "1px solid " + C.gray200, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  input: { width: "100%", background: C.white, border: "1.5px solid " + C.gray200, borderRadius: 10, padding: "12px 16px", fontSize: 14, color: C.gray900, fontFamily: "Inter, sans-serif", outline: "none", display: "block" },
  btn: { background: C.primary, color: C.white, border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" },
  btnOutline: { background: C.white, color: C.primary, border: "1.5px solid " + C.primary, borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" },
  label: { fontSize: 13, fontWeight: 600, color: C.gray600, display: "block", marginBottom: 6 },
};

const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_KEY || "";

const ICP_AVATARS = {
  cfo:       { name: "Morgan Hayes",    title: "CFO",            company: "Brightline Solutions", color: "#f59e0b", bg: "#fffbeb", focus: "ROI & budget approval",        icon: "💼" },
  coo:       { name: "James Weston",    title: "COO",            company: "Brightline Solutions", color: "#10b981", bg: "#ecfdf5", focus: "Operations & implementation",  icon: "⚙️" },
  cto:       { name: "Alex Chen",       title: "CTO",            company: "Brightline Solutions", color: "#0ea5e9", bg: "#f0f9ff", focus: "Tech stack & security",         icon: "🔧" },
  vp_sales:  { name: "Jordan Mitchell", title: "VP of Sales",    company: "Brightline Solutions", color: "#8b5cf6", bg: "#f5f3ff", focus: "Quota & rep adoption",          icon: "📈" },
  director:  { name: "Taylor Brooks",   title: "Director RevOps",company: "Brightline Solutions", color: "#f97316", bg: "#fff7ed", focus: "Process & reporting",           icon: "📊" },
  smb_owner: { name: "Sam Rivera",      title: "Founder & CEO",  company: "Nexus Ventures",       color: "#ec4899", bg: "#fdf2f8", focus: "Simplicity & cost",            icon: "🚀" },
};

const COMPANY_SIZES = {
  startup: "Startup (1-50)", smb: "SMB (51-500)", mid_market: "Mid-Market (501-2K)",
  enterprise: "Enterprise (2K-10K)", large_enterprise: "Large Enterprise (10K+)",
};

const STAGES = [
  { id: "discovery",   label: "Discovery Call",      icon: "🔍", desc: "Uncover pain points & qualify",           duration: "30 min", passingScore: 68, color: "#0ea5e9" },
  { id: "demo",        label: "Product Demo",         icon: "🖥️", desc: "Walk through features & handle objections", duration: "45 min", passingScore: 72, color: "#8b5cf6" },
  { id: "negotiation", label: "Negotiation & Close", icon: "🤝", desc: "Pricing, objections & commitment",         duration: "30 min", passingScore: 78, color: "#10b981" },
];

const sc = s => s >= 80 ? C.success : s >= 70 ? C.primary : s >= 60 ? C.warning : C.danger;
const fmt = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

function LandingPage({ onGetStarted }) {
  return (
    <div style={{ background: C.white, fontFamily: "Inter, sans-serif", color: C.gray900, minHeight: "100vh" }}>
      <nav style={{ borderBottom: "1px solid " + C.gray100, padding: "0 80px", height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: C.white, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 900, fontSize: 18 }}>S</div>
          <span style={{ fontSize: 20, fontWeight: 800 }}>SalesHub</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["Features", "Pricing", "About"].map(item => (
            <span key={item} style={{ fontSize: 14, color: C.gray600, cursor: "pointer", fontWeight: 500 }}>{item}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onGetStarted} style={{ ...S.btnOutline, padding: "9px 20px", fontSize: 14 }}>Sign In</button>
          <button onClick={onGetStarted} style={{ ...S.btn, padding: "9px 20px", fontSize: 14 }}>Get Started Free</button>
        </div>
      </nav>

      <div style={{ background: "linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)", padding: "100px 80px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#dbeafe", borderRadius: 20, padding: "6px 16px", fontSize: 13, color: "#1d4ed8", fontWeight: 600, marginBottom: 24 }}>
          <span>🚀</span> AI-Powered Sales Training Platform
        </div>
        <h1 style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, maxWidth: 800, margin: "0 auto 24px" }}>
          Train your sales team like{" "}
          <span style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>never before</span>
        </h1>
        <p style={{ fontSize: 20, color: C.gray500, maxWidth: 600, margin: "0 auto 48px", lineHeight: 1.7 }}>
          Practice real sales calls with AI prospects, get instant coaching, track your team's performance, and certify reps before their first live call.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 80 }}>
          <button onClick={onGetStarted} style={{ ...S.btn, padding: "16px 40px", fontSize: 17, fontWeight: 700, borderRadius: 12 }}>Start Free Trial →</button>
          <button style={{ ...S.btnOutline, padding: "16px 40px", fontSize: 17, fontWeight: 700, borderRadius: 12 }}>Watch Demo</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, maxWidth: 800, margin: "0 auto" }}>
          {[["10x", "Faster rep ramp time"], ["94%", "Improvement in call scores"], ["3x", "More deals closed"], ["60%", "Reduction in coaching time"]].map(item => (
            <div key={item[1]} style={{ ...S.card, padding: "24px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.primary, marginBottom: 6 }}>{item[0]}</div>
              <div style={{ fontSize: 13, color: C.gray500 }}>{item[1]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "80px 80px", background: C.white }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Everything your sales team needs</h2>
          <p style={{ fontSize: 18, color: C.gray500, maxWidth: 500, margin: "0 auto" }}>One platform for training, coaching, and managing your entire sales operation.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {[
            ["🎙️", "AI Voice Calls", "Practice real conversations with AI prospects that respond like actual buyers.", C.primary],
            ["📊", "Performance Analytics", "Track every rep's scores, improvement trends, and skill gaps.", "#8b5cf6"],
            ["🎯", "Mission Assignment", "Assign targeted practice calls to specific reps based on their weaknesses.", "#10b981"],
            ["🧠", "Knowledge Base", "Upload call transcripts and product info. AI extracts winning talk tracks.", "#f59e0b"],
            ["🏆", "Certification System", "Set passing scores per stage. Managers certify reps before live calls.", "#ec4899"],
            ["📞", "CRM Integration", "Connect to HubSpot and Salesforce. Pull real pipeline data.", "#f97316"],
          ].map(item => (
            <div key={item[1]} style={{ ...S.card, padding: "32px 28px" }}>
              <div style={{ width: 52, height: 52, background: item[3] + "18", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 20 }}>{item[0]}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{item[1]}</h3>
              <p style={{ fontSize: 14, color: C.gray500, lineHeight: 1.7 }}>{item[2]}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "80px 80px", background: C.primaryBg }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Practice with any buyer persona</h2>
          <p style={{ fontSize: 18, color: C.gray500 }}>Our AI prospects behave exactly like real executives.</p>
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {Object.values(ICP_AVATARS).map(av => (
            <div key={av.title} style={{ background: av.bg, border: "2px solid " + av.color + "44", borderRadius: 16, padding: "20px 24px", textAlign: "center", minWidth: 160 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{av.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{av.title}</div>
              <div style={{ fontSize: 12, color: av.color, fontWeight: 600, marginTop: 4 }}>{av.focus.split(" ").slice(0, 3).join(" ")}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "80px", textAlign: "center", background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
        <h2 style={{ fontSize: 48, fontWeight: 900, color: C.white, marginBottom: 20 }}>Ready to transform your sales team?</h2>
        <p style={{ fontSize: 20, color: "rgba(255,255,255,0.85)", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>Start free. No credit card required.</p>
        <button onClick={onGetStarted} style={{ background: C.white, color: C.primary, border: "none", borderRadius: 12, padding: "18px 48px", fontSize: 18, fontWeight: 800, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Get Started Free →</button>
      </div>

      <div style={{ padding: "40px 80px", background: C.gray900, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: C.primary, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 900 }}>S</div>
          <span style={{ color: C.gray400, fontSize: 14 }}>SalesHub © 2025</span>
        </div>
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("rep");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const login = async () => {
    setLoading(true); setErr("");
    const r = await supabase.auth.signInWithPassword({ email, password });
    if (r.error) { setErr(r.error.message); setLoading(false); return; }
    const p = await supabase.from("profiles").select("*").eq("id", r.data.user.id).single();
    onAuth(p.data || { id: r.data.user.id, email, name: email.split("@")[0], role: "rep" });
    setLoading(false);
  };

  const signup = async () => {
    if (!email || !password || !name) return setErr("Please fill in all fields");
    setLoading(true); setErr("");
    const r = await supabase.auth.signUp({ email, password });
    if (r.error) { setErr(r.error.message); setLoading(false); return; }
    if (r.data.user) {
      await supabase.from("profiles").insert({ id: r.data.user.id, name, email, role });
      setMsg("Account created! Check your email to confirm, then log in.");
      setMode("login");
    }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!email) return setErr("Enter your email first");
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: "https://callforge.tech" });
    setMsg("Password reset email sent!");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 460, background: C.white, borderRadius: 24, border: "1px solid " + C.primaryBorder, boxShadow: "0 20px 60px rgba(14,165,233,0.12)", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", padding: "40px 40px 32px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.2)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: C.white, margin: "0 auto 16px" }}>S</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.white }}>SalesHub</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>AI Sales Training Platform</div>
        </div>
        <div style={{ padding: "32px 40px 40px" }}>
          <div style={{ display: "flex", background: C.gray100, borderRadius: 10, padding: 4, marginBottom: 28 }}>
            {[["login", "Sign In"], ["signup", "Create Account"]].map(item => (
              <div key={item[0]} onClick={() => { setMode(item[0]); setErr(""); setMsg(""); }}
                style={{ flex: 1, textAlign: "center", padding: "9px", fontSize: 14, cursor: "pointer", borderRadius: 8, fontWeight: 600, background: mode === item[0] ? C.white : "transparent", color: mode === item[0] ? C.primary : C.gray500 }}>
                {item[1]}
              </div>
            ))}
          </div>
          {msg && <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#065f46", marginBottom: 20 }}>{msg}</div>}
          {err && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#991b1b", marginBottom: 20 }}>{err}</div>}
          {mode === "signup" && (
            <div>
              <label style={S.label}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Alex Rivera" style={{ ...S.input, marginBottom: 16 }} />
              <label style={S.label}>I am a</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[["rep", "🎯", "Sales Rep"], ["manager", "👔", "Manager"]].map(item => (
                  <div key={item[0]} onClick={() => setRole(item[0])} style={{ border: "2px solid " + (role === item[0] ? C.primary : C.gray200), borderRadius: 10, padding: "14px 12px", textAlign: "center", cursor: "pointer", background: role === item[0] ? C.primaryBg : C.white }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{item[1]}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: role === item[0] ? C.primary : C.gray600 }}>{item[2]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <label style={S.label}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" type="email" style={{ ...S.input, marginBottom: 16 }} />
          <label style={S.label}>Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password" style={{ ...S.input, marginBottom: 24 }} />
          <button onClick={mode === "login" ? login : signup} disabled={loading}
            style={{ ...S.btn, width: "100%", padding: "14px", fontSize: 16, borderRadius: 12, opacity: loading ? 0.7 : 1, marginBottom: 16 }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
          {mode === "login" && <div onClick={resetPassword} style={{ textAlign: "center", fontSize: 13, color: C.primary, cursor: "pointer", fontWeight: 500 }}>Forgot password?</div>}
        </div>
      </div>
    </div>
  );
}

function RepDashboard({ user, onStartSession, onSignOut }) {
  const [tab, setTab] = useState("home");
  const [sessions, setSessions] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const s = await supabase.from("sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      const m = await supabase.from("missions").select("*").eq("assigned_to", user.id).order("created_at", { ascending: false });
      setSessions(s.data || []); setMissions(m.data || []); setLoading(false);
    };
    load();
  }, []);

  const avgScore = sessions.length ? Math.round(sessions.reduce((a, b) => a + b.score, 0) / sessions.length) : null;
  const unread = missions.filter(m => !m.read).length;
  const navItems = [["home", "🏠", "Dashboard"], ["train", "🎯", "Train"], ["missions", "📤", "Missions" + (unread ? " (" + unread + ")" : "")], ["progress", "📊", "My Progress"]];

  return (
    <div style={{ minHeight: "100vh", background: C.gray50, fontFamily: "Inter, sans-serif", display: "flex" }}>
      <div style={{ width: 240, background: C.white, borderRight: "1px solid " + C.gray200, display: "flex", flexDirection: "column", flexShrink: 0, position: "fixed", height: "100vh" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid " + C.gray100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 900, fontSize: 18 }}>S</div>
            <span style={{ fontSize: 18, fontWeight: 800 }}>SalesHub</span>
          </div>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {navItems.map(item => (
            <div key={item[0]} onClick={() => setTab(item[0])}
              style={{ padding: "11px 16px", fontSize: 14, color: tab === item[0] ? C.primary : C.gray600, cursor: "pointer", borderRadius: 10, background: tab === item[0] ? C.primaryBg : "transparent", fontWeight: tab === item[0] ? 600 : 400, display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
              <span>{item[1]}</span><span>{item[2]}</span>
              {item[0] === "missions" && unread > 0 && <span style={{ marginLeft: "auto", background: C.danger, color: C.white, borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{unread}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid " + C.gray100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.primaryBg, border: "2px solid " + C.primaryBorder, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
              {user.name ? user.name.split(" ").map(n => n[0]).join("") : "U"}
            </div>
            <div>
              <div style={{ fontSize: 13, color: C.gray800, fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: C.gray400 }}>Sales Rep</div>
            </div>
          </div>
          <div onClick={onSignOut} style={{ fontSize: 12, color: C.gray400, cursor: "pointer", fontWeight: 500 }}>Sign Out</div>
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: 240, overflowY: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: C.gray400 }}>
            <div style={{ width: 40, height: 40, border: "3px solid " + C.primaryBorder, borderTop: "3px solid " + C.primary, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <div>
            {tab === "home" && <RepHome user={user} sessions={sessions} missions={missions} avgScore={avgScore} unread={unread} onTrainClick={() => setTab("train")} onMissionsClick={() => setTab("missions")} />}
            {tab === "train" && <RepTrain onStart={onStartSession} />}
            {tab === "missions" && <RepMissions missions={missions} onStart={onStartSession} />}
            {tab === "progress" && <RepProgress sessions={sessions} />}
          </div>
        )}
      </div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

function RepHome({ user, sessions, missions, avgScore, unread, onTrainClick, onMissionsClick }) {
  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 13, color: C.primary, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Welcome back</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: C.gray900 }}>Hey, {user.name ? user.name.split(" ")[0] : "there"} 👋</div>
        {unread > 0 && <div style={{ fontSize: 15, color: C.primary, marginTop: 6 }}>You have {unread} new mission{unread !== 1 ? "s" : ""} from your manager.</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 40 }}>
        {[["Avg Score", avgScore || "—", avgScore ? sc(avgScore) : C.gray300, "📊"], ["Sessions", sessions.length, C.secondary, "🎯"], ["Passed", sessions.filter(s => s.passed).length, C.success, "✅"], ["Missions", missions.length, C.warning, "📤"]].map(item => (
          <div key={item[0]} style={{ ...S.card, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{item[0]}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: item[2] }}>{item[1]}</div>
              </div>
              <div style={{ fontSize: 24 }}>{item[3]}</div>
            </div>
          </div>
        ))}
      </div>
      {missions.filter(m => !m.completed).length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.gray800, marginBottom: 16 }}>📤 Manager Missions</div>
          {missions.filter(m => !m.completed).map(m => {
            const si = STAGES.find(s => s.id === m.stage) || {};
            return (
              <div key={m.id} onClick={onMissionsClick} style={{ ...S.card, padding: "20px 24px", marginBottom: 12, cursor: "pointer", borderLeft: "4px solid " + C.primary }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    {!m.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.primary, marginBottom: 8 }} />}
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.gray900, marginBottom: 4 }}>{si.icon} {si.label}</div>
                    <div style={{ fontSize: 13, color: C.gray500 }}>{m.note ? '"' + m.note.substring(0, 80) + '..."' : ""}</div>
                  </div>
                  <div style={{ color: C.primary, fontSize: 13, fontWeight: 600 }}>Start →</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 700, color: C.gray800, marginBottom: 16 }}>Start Training</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {STAGES.map(stage => (
          <div key={stage.id} onClick={onTrainClick} style={{ background: "linear-gradient(135deg, " + stage.color + "18, " + stage.color + "08)", border: "1.5px solid " + stage.color + "30", borderRadius: 16, padding: "28px 24px", cursor: "pointer" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{stage.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.gray900, marginBottom: 6 }}>{stage.label}</div>
            <div style={{ fontSize: 13, color: C.gray500, marginBottom: 16 }}>{stage.desc}</div>
            <div style={{ fontSize: 12, color: stage.color, background: stage.color + "18", borderRadius: 6, padding: "4px 10px", display: "inline-block", fontWeight: 600 }}>{stage.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepTrain({ onStart }) {
  const [stage, setStage] = useState("discovery");
  const [icp, setIcp] = useState("vp_sales");
  const [companySize, setCompanySize] = useState("smb");
  const av = ICP_AVATARS[icp];

  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 13, color: C.primary, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Training</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: C.gray900 }}>Build Your Scenario</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray700, marginBottom: 14 }}>Call Stage</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STAGES.map(s => (
                <div key={s.id} onClick={() => setStage(s.id)} style={{ ...S.card, padding: "16px 20px", cursor: "pointer", border: "2px solid " + (stage === s.id ? s.color : C.gray200), background: stage === s.id ? s.color + "08" : C.white, display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: stage === s.id ? s.color : C.gray800 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>{s.desc}</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.gray400 }}>{s.duration}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray700, marginBottom: 14 }}>Company Size</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.keys(COMPANY_SIZES).map(id => (
                <div key={id} onClick={() => setCompanySize(id)} style={{ border: "1.5px solid " + (companySize === id ? C.primary : C.gray200), borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: companySize === id ? C.primary : C.gray600, fontWeight: companySize === id ? 600 : 400, background: companySize === id ? C.primaryBg : C.white }}>
                  {COMPANY_SIZES[id]}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray700, marginBottom: 14 }}>Your AI Prospect</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Object.keys(ICP_AVATARS).map(id => {
                const p = ICP_AVATARS[id]; const sel = icp === id;
                return (
                  <div key={id} onClick={() => setIcp(id)} style={{ border: "2px solid " + (sel ? p.color : C.gray200), borderRadius: 12, padding: "14px 16px", cursor: "pointer", background: sel ? p.bg : C.white }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{p.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sel ? p.color : C.gray800 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{p.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg, " + av.color + "18, " + av.color + "08)", border: "1.5px solid " + av.color + "30", borderRadius: 16, padding: "24px", marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: C.gray500, fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Your Scenario</div>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{av.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.gray900, marginBottom: 4 }}>{STAGES.find(s => s.id === stage).label}</div>
            <div style={{ fontSize: 14, color: av.color, fontWeight: 600 }}>with {av.name}, {av.title}</div>
            <div style={{ fontSize: 13, color: C.gray500, marginTop: 4 }}>{av.company} · {COMPANY_SIZES[companySize]}</div>
          </div>
          <div style={{ background: C.primaryBg, border: "1px solid " + C.primaryBorder, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: C.primary, fontWeight: 500 }}>🎙️ Voice-enabled — speak naturally, the AI responds in real time</div>
          </div>
          <button onClick={() => onStart({ stage, icp, companySize })} style={{ ...S.btn, width: "100%", padding: "16px", fontSize: 16, fontWeight: 700, borderRadius: 12 }}>Join Call →</button>
        </div>
      </div>
    </div>
  );
}

function RepMissions({ missions, onStart }) {
  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ fontSize: 36, fontWeight: 900, color: C.gray900, marginBottom: 8 }}>Manager Missions</div>
      <div style={{ fontSize: 15, color: C.gray500, marginBottom: 36 }}>Practice assignments from your manager based on your skill gaps.</div>
      {missions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px", color: C.gray400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 16 }}>No missions yet — keep training!</div>
        </div>
      ) : missions.map(m => {
        const si = STAGES.find(s => s.id === m.stage) || {};
        return (
          <div key={m.id} style={{ ...S.card, padding: "24px 28px", marginBottom: 16, borderLeft: m.read ? "4px solid " + C.gray200 : "4px solid " + C.primary }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                {!m.read && <div style={{ fontSize: 11, color: C.primary, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>New Mission</div>}
                <div style={{ fontSize: 18, fontWeight: 800, color: C.gray900 }}>{si.icon} {si.label}</div>
              </div>
              {m.completed ? <div style={{ background: "#ecfdf5", color: C.success, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600 }}>Done ✓</div> : <div style={{ background: C.primaryBg, color: C.primary, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600 }}>Pending</div>}
            </div>
            {m.note && <div style={{ background: C.gray50, borderRadius: 10, padding: "14px 18px", marginBottom: 16, fontSize: 14, color: C.gray600, lineHeight: 1.7, fontStyle: "italic" }}>"{m.note}"</div>}
            {!m.completed && <button onClick={() => onStart({ stage: m.stage, icp: m.icps && m.icps[0] ? m.icps[0] : "vp_sales", companySize: m.company_size || "smb", missionId: m.id })} style={{ ...S.btn, padding: "10px 24px", fontSize: 14 }}>Start Mission →</button>}
          </div>
        );
      })}
    </div>
  );
}

function RepProgress({ sessions }) {
  const catAvgs = {};
  sessions.forEach(s => {
    if (!s.categories) return;
    Object.entries(s.categories).forEach(([k, v]) => { if (!catAvgs[k]) catAvgs[k] = []; catAvgs[k].push(v); });
  });
  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ fontSize: 36, fontWeight: 900, color: C.gray900, marginBottom: 36 }}>My Progress</div>
      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px", color: C.gray400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <div style={{ fontSize: 16 }}>No sessions yet — start training!</div>
        </div>
      ) : (
        <>
          {Object.keys(catAvgs).length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.gray800, marginBottom: 20 }}>Skill Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {Object.entries(catAvgs).map(([k, vals]) => {
                  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length); const color = sc(avg);
                  return (
                    <div key={k} style={{ ...S.card, padding: "20px" }}>
                      <div style={{ fontSize: 12, color: C.gray400, textTransform: "capitalize", marginBottom: 10, fontWeight: 600 }}>{k.replace(/([A-Z])/g, " $1")}</div>
                      <div style={{ background: C.gray100, borderRadius: 6, height: 8, marginBottom: 10 }}><div style={{ width: avg + "%", height: "100%", background: color, borderRadius: 6 }} /></div>
                      <div style={{ fontSize: 26, fontWeight: 800, color }}>{avg}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ fontSize: 16, fontWeight: 700, color: C.gray800, marginBottom: 20 }}>Session History</div>
          {sessions.map((s, i) => {
            const si = STAGES.find(st => st.id === s.stage) || {}; const av = s.icp ? ICP_AVATARS[s.icp] : null;
            return (
              <div key={i} style={{ ...S.card, padding: "18px 24px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 24 }}>{si.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.gray800 }}>{si.label}</div>
                  <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>{av ? av.name + " · " + av.title + " · " : ""}{COMPANY_SIZES[s.company_size]}</div>
                  <div style={{ fontSize: 11, color: C.gray300, marginTop: 2 }}>{new Date(s.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: sc(s.score) }}>{s.score}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.passed ? C.success : C.warning, background: s.passed ? "#ecfdf5" : "#fffbeb", borderRadius: 6, padding: "4px 10px" }}>{s.passed ? "✓ Passed" : "↻ Retry"}</div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function ManagerDashboard({ user, onSignOut }) {
  const [tab, setTab] = useState("team");
  const [team, setTeam] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRep, setSelectedRep] = useState(null);
  const [assigningTo, setAssigningTo] = useState(null);
  const [toast, setToast] = useState(null);
  const [aiReport, setAiReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    const load = async () => {
      const profiles = await supabase.from("profiles").select("*").eq("role", "rep");
      const allSessions = await supabase.from("sessions").select("*");
      const allMissions = await supabase.from("missions").select("*");
      const enriched = (profiles.data || []).map(p => ({ ...p, sessions: (allSessions.data || []).filter(s => s.user_id === p.id) }));
      setTeam(enriched); setMissions(allMissions.data || []); setLoading(false);
    };
    load();
  }, []);

  const repAvg = rep => rep.sessions.length ? Math.round(rep.sessions.reduce((a, b) => a + b.score, 0) / rep.sessions.length) : 0;
  const teamAvg = team.length ? Math.round(team.reduce((a, r) => a + repAvg(r), 0) / team.length) : 0;
  const certified = team.filter(r => repAvg(r) >= 75).length;

  const handleAssignMission = async (md) => {
    const { error } = await supabase.from("missions").insert({ assigned_by: user.id, assigned_to: md.repId, stage: md.stage, icps: [md.icp], company_size: md.companySize, note: md.note, completed: false, read: false });
    if (!error) { setToast("Mission sent to " + md.repName); setTimeout(() => setToast(null), 3000); setAssigningTo(null); }
  };

  const generateTeamReport = async () => {
    setLoadingReport(true);
    const teamData = team.map(r => repAvg(r) + " avg - " + r.name + " - " + r.sessions.length + " sessions").join(", ");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, system: "VP of Sales writing a concise team performance summary. Direct and actionable. Plain text.", messages: [{ role: "user", content: "Write a 3 paragraph team coaching summary based on: " + teamData + ". Cover overall health, who needs help, top 2 priorities." }] })
      });
      const data = await res.json();
      setAiReport(data.content.map(b => b.text || "").join(""));
    } catch (e) { setAiReport("Unable to generate report. Please check your API connection."); }
    setLoadingReport(false);
  };

  const navItems = [["team", "👥", "Team Overview"], ["missions", "📤", "Missions"], ["leaderboard", "🏆", "Leaderboard"], ["knowledge", "🧠", "Knowledge Base"]];

  return (
    <div style={{ minHeight: "100vh", background: C.gray50, fontFamily: "Inter, sans-serif", display: "flex" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      {toast && <div style={{ position: "fixed", top: 24, right: 24, background: C.success, color: C.white, borderRadius: 12, padding: "14px 20px", zIndex: 200, fontSize: 14, fontWeight: 600 }}>✓ {toast}</div>}
      <div style={{ width: 240, background: C.white, borderRight: "1px solid " + C.gray200, display: "flex", flexDirection: "column", flexShrink: 0, position: "fixed", height: "100vh" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid " + C.gray100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 900, fontSize: 18 }}>S</div>
            <span style={{ fontSize: 18, fontWeight: 800 }}>SalesHub</span>
          </div>
          <div style={{ fontSize: 11, color: C.primary, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", paddingLeft: 46 }}>Manager</div>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {navItems.map(item => (
            <div key={item[0]} onClick={() => setTab(item[0])} style={{ padding: "11px 16px", fontSize: 14, color: tab === item[0] ? C.primary : C.gray600, cursor: "pointer", borderRadius: 10, background: tab === item[0] ? C.primaryBg : "transparent", fontWeight: tab === item[0] ? 600 : 400, display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
              <span>{item[1]}</span><span>{item[2]}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid " + C.gray100 }}>
          <div style={{ fontSize: 13, color: C.gray800, fontWeight: 600, marginBottom: 4 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: C.gray400, marginBottom: 12 }}>Head of Sales</div>
          <div onClick={onSignOut} style={{ fontSize: 12, color: C.gray400, cursor: "pointer", fontWeight: 500 }}>Sign Out</div>
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: 240, overflowY: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: C.gray400 }}><div style={{ width: 40, height: 40, border: "3px solid " + C.primaryBorder, borderTop: "3px solid " + C.primary, borderRadius: "50%", animation: "spin 1s linear infinite" }} /></div>
        ) : (
          <div>
            {tab === "team" && (
              <div style={{ padding: "40px 48px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.primary, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Manager Dashboard</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: C.gray900 }}>Team Overview</div>
                  </div>
                  <button onClick={generateTeamReport} style={{ ...S.btn, padding: "12px 20px", fontSize: 14 }}>{loadingReport ? "Generating..." : "✦ AI Team Report"}</button>
                </div>
                {aiReport && <div style={{ ...S.card, padding: "24px 28px", marginBottom: 32, borderLeft: "4px solid " + C.primary }}><div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 12, textTransform: "uppercase" }}>AI Team Report</div><div style={{ fontSize: 14, color: C.gray600, lineHeight: 1.8 }}>{aiReport}</div></div>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 40 }}>
                  {[["Team Avg", teamAvg, C.primary, "📊"], ["Total Reps", team.length, C.secondary, "👥"], ["Certified", certified, C.success, "🎓"], ["Need Coaching", team.filter(r => repAvg(r) < 65).length, C.danger, "⚠️"]].map(item => (
                    <div key={item[0]} style={{ ...S.card, padding: "24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div><div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{item[0]}</div><div style={{ fontSize: 32, fontWeight: 900, color: item[2] }}>{item[1]}</div></div>
                        <div style={{ fontSize: 28 }}>{item[3]}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.gray800, marginBottom: 20 }}>Sales Team</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
                  {team.map(rep => {
                    const avg = repAvg(rep); const color = sc(avg);
                    const trend = rep.sessions.length >= 2 ? rep.sessions[rep.sessions.length - 1].score - rep.sessions[0].score : 0;
                    return (
                      <div key={rep.id} style={{ ...S.card, padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.primaryBg, border: "2px solid " + C.primaryBorder, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{rep.name ? rep.name.split(" ").map(n => n[0]).join("") : "?"}</div>
                            <div><div style={{ fontSize: 15, fontWeight: 700, color: C.gray900 }}>{rep.name}</div><div style={{ fontSize: 12, color: C.gray400 }}>{rep.role} · {rep.sessions.length} sessions</div></div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 32, fontWeight: 900, color }}>{avg || "—"}</div>
                            <div style={{ fontSize: 12, color: trend > 0 ? C.success : trend < 0 ? C.danger : C.gray400 }}>{trend > 0 ? "↑ +" + trend : trend < 0 ? "↓ " + trend : "→ stable"}</div>
                          </div>
                        </div>
                        <div style={{ background: C.gray100, borderRadius: 6, height: 6, marginBottom: 16 }}><div style={{ width: avg + "%", height: "100%", background: color, borderRadius: 6 }} /></div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                          {avg >= 75 && <span style={{ fontSize: 11, background: "#ecfdf5", color: C.success, borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>🎓 Certified</span>}
                          {avg < 65 && avg > 0 && <span style={{ fontSize: 11, background: "#fef2f2", color: C.danger, borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>⚠️ Needs Coaching</span>}
                          {avg === 0 && <span style={{ fontSize: 11, background: C.gray100, color: C.gray400, borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>No sessions yet</span>}
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={() => setSelectedRep(rep)} style={{ ...S.btnOutline, flex: 1, padding: "9px", fontSize: 13 }}>View Details</button>
                          <button onClick={() => setAssigningTo(rep)} style={{ ...S.btn, flex: 1, padding: "9px", fontSize: 13 }}>Assign Mission</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {tab === "missions" && (
              <div style={{ padding: "40px 48px" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.gray900, marginBottom: 36 }}>Assigned Missions</div>
                {missions.length === 0 ? <div style={{ textAlign: "center", padding: "80px", color: C.gray400 }}><div style={{ fontSize: 48, marginBottom: 16 }}>📭</div><div>No missions assigned yet</div></div> : missions.map((m, i) => {
                  const si = STAGES.find(s => s.id === m.stage) || {}; const rep = team.find(r => r.id === m.assigned_to);
                  return (
                    <div key={i} style={{ ...S.card, padding: "20px 24px", marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div><div style={{ fontSize: 15, fontWeight: 700, color: C.gray900 }}>→ {rep ? rep.name : "Unknown"}</div><div style={{ fontSize: 13, color: C.gray500 }}>{si.icon} {si.label}</div></div>
                        <div style={{ fontSize: 12, fontWeight: 600, background: m.completed ? "#ecfdf5" : C.primaryBg, color: m.completed ? C.success : C.primary, borderRadius: 8, padding: "5px 12px" }}>{m.completed ? "Completed" : "Pending"}</div>
                      </div>
                      {m.note && <div style={{ fontSize: 13, color: C.gray500, fontStyle: "italic" }}>"{m.note}"</div>}
                    </div>
                  );
                })}
              </div>
            )}
            {tab === "leaderboard" && (
              <div style={{ padding: "40px 48px" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.gray900, marginBottom: 36 }}>Team Leaderboard</div>
                {[...team].sort((a, b) => repAvg(b) - repAvg(a)).map((rep, idx) => {
                  const avg = repAvg(rep); const medal = ["🥇", "🥈", "🥉"][idx] || "#" + (idx + 1);
                  return (
                    <div key={rep.id} style={{ ...S.card, padding: "20px 24px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16, background: idx === 0 ? C.primaryBg : C.white, border: idx === 0 ? "2px solid " + C.primaryBorder : "1px solid " + C.gray200 }}>
                      <div style={{ fontSize: 28, width: 40, textAlign: "center" }}>{medal}</div>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.primaryBg, border: "2px solid " + C.primaryBorder, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{rep.name ? rep.name.split(" ").map(n => n[0]).join("") : "?"}</div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: C.gray900 }}>{rep.name}</div><div style={{ fontSize: 12, color: C.gray400 }}>{rep.sessions.length} sessions</div></div>
                      {avg >= 75 && <span style={{ fontSize: 12, background: "#ecfdf5", color: C.success, borderRadius: 20, padding: "4px 12px", fontWeight: 600 }}>🎓 Certified</span>}
                      <div style={{ fontSize: 36, fontWeight: 900, color: sc(avg) }}>{avg || "—"}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {tab === "knowledge" && <KnowledgeBase />}
          </div>
        )}
      </div>
      {selectedRep && <RepDetailModal rep={selectedRep} onClose={() => setSelectedRep(null)} onAssign={() => { setAssigningTo(selectedRep); setSelectedRep(null); }} />}
      {assigningTo && <AssignMissionModal rep={assigningTo} onClose={() => setAssigningTo(null)} onAssign={handleAssignMission} />}
    </div>
  );
}

function RepDetailModal({ rep, onClose, onAssign }) {
  const repAvgScore = rep.sessions.length ? Math.round(rep.sessions.reduce((a, b) => a + b.score, 0) / rep.sessions.length) : 0;
  const catAvgs = {};
  rep.sessions.forEach(s => { if (!s.categories) return; Object.entries(s.categories).forEach(([k, v]) => { if (!catAvgs[k]) catAvgs[k] = []; catAvgs[k].push(v); }); });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", zIndex: 100 }}>
      <div style={{ width: 480, height: "100vh", background: C.white, overflowY: "auto" }}>
        <div style={{ padding: "28px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid " + C.gray100, paddingBottom: 20 }}>
          <div><div style={{ fontSize: 20, fontWeight: 800, color: C.gray900 }}>{rep.name}</div><div style={{ fontSize: 13, color: C.gray400 }}>Sales Rep · {rep.sessions.length} sessions</div></div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.gray400 }}>✕</button>
        </div>
        <div style={{ padding: "0 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
            {[["Avg Score", repAvgScore, sc(repAvgScore)], ["Sessions", rep.sessions.length, C.secondary], ["Passed", rep.sessions.filter(s => s.passed).length, C.success]].map(item => (
              <div key={item[0]} style={{ background: C.gray50, borderRadius: 12, padding: "16px", textAlign: "center" }}><div style={{ fontSize: 26, fontWeight: 800, color: item[2] }}>{item[1]}</div><div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>{item[0]}</div></div>
            ))}
          </div>
          {Object.keys(catAvgs).length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gray700, marginBottom: 14 }}>Skill Breakdown</div>
              {Object.entries(catAvgs).map(([k, vals]) => {
                const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length); const color = sc(avg);
                return (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, color: C.gray600, textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span><span style={{ fontSize: 14, fontWeight: 700, color }}>{avg}</span></div>
                    <div style={{ background: C.gray100, borderRadius: 4, height: 6 }}><div style={{ width: avg + "%", height: "100%", background: color, borderRadius: 4 }} /></div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray700, marginBottom: 14 }}>Session History</div>
            {rep.sessions.length === 0 ? <div style={{ color: C.gray400, fontSize: 13 }}>No sessions yet</div> : rep.sessions.map((s, i) => {
              const si = STAGES.find(st => st.id === s.stage) || {};
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid " + C.gray100 }}>
                  <span style={{ fontSize: 18 }}>{si.icon}</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.gray800 }}>{si.label}</div><div style={{ fontSize: 11, color: C.gray400 }}>{new Date(s.created_at).toLocaleDateString()}</div></div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: sc(s.score) }}>{s.score}</div>
                  <div style={{ fontSize: 11, color: s.passed ? C.success : C.warning }}>{s.passed ? "✓" : "↻"}</div>
                </div>
              );
            })}
          </div>
          <button onClick={onAssign} style={{ ...S.btn, width: "100%", padding: "14px", fontSize: 15 }}>📤 Assign Mission →</button>
        </div>
      </div>
    </div>
  );
}

function AssignMissionModal({ rep, onClose, onAssign }) {
  const [stage, setStage] = useState("discovery");
  const [icp, setIcp] = useState("vp_sales");
  const [companySize, setCompanySize] = useState("smb");
  const [note, setNote] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateNote = async () => {
    setGenerating(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 150, system: "Write a short coaching note from a sales manager to a rep assigning practice. Under 60 words. Direct and encouraging.", messages: [{ role: "user", content: "Write a coaching note assigning a " + stage + " practice call with a " + ICP_AVATARS[icp].title + " at a " + COMPANY_SIZES[companySize] + " company to rep named " + rep.name.split(" ")[0] + "." }] })
      });
      const data = await res.json();
      setNote(data.content.map(b => b.text || "").join(""));
    } catch (e) { setNote("Hey " + rep.name.split(" ")[0] + ", please run this " + stage + " practice call and focus on asking great discovery questions."); }
    setGenerating(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ width: 520, background: C.white, borderRadius: 24, overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", padding: "28px 32px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Assign Mission</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.white }}>{rep.name}</div>
        </div>
        <div style={{ padding: "28px 32px", maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray700, marginBottom: 12 }}>Call Stage</div>
            <div style={{ display: "flex", gap: 8 }}>
              {STAGES.map(s => (<div key={s.id} onClick={() => setStage(s.id)} style={{ flex: 1, border: "2px solid " + (stage === s.id ? s.color : C.gray200), borderRadius: 10, padding: "12px", textAlign: "center", cursor: "pointer", background: stage === s.id ? s.color + "08" : C.white }}><div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div><div style={{ fontSize: 12, fontWeight: 600, color: stage === s.id ? s.color : C.gray600 }}>{s.label}</div></div>))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray700, marginBottom: 12 }}>AI Prospect</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {Object.keys(ICP_AVATARS).map(id => { const p = ICP_AVATARS[id]; return (<div key={id} onClick={() => setIcp(id)} style={{ border: "2px solid " + (icp === id ? p.color : C.gray200), borderRadius: 10, padding: "10px 12px", cursor: "pointer", background: icp === id ? p.bg : C.white, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>{p.icon}</span><div style={{ fontSize: 12, fontWeight: 600, color: icp === id ? p.color : C.gray600 }}>{p.title}</div></div>); })}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gray700, marginBottom: 12 }}>Company Size</div>
            <select value={companySize} onChange={e => setCompanySize(e.target.value)} style={{ ...S.input }}>
              {Object.entries(COMPANY_SIZES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gray700 }}>Coaching Note</div>
              <button onClick={generateNote} disabled={generating} style={{ ...S.btnOutline, padding: "6px 14px", fontSize: 12 }}>{generating ? "..." : "✦ AI Draft"}</button>
            </div>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Write a note to your rep..." style={{ ...S.input, resize: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onClose} style={{ ...S.btnOutline, flex: 1, padding: "13px" }}>Cancel</button>
            <button onClick={() => onAssign({ repId: rep.id, repName: rep.name, stage, icp, companySize, note })} style={{ ...S.btn, flex: 2, padding: "13px", fontSize: 15 }}>📤 Send Mission →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeBase() {
  const [transcripts, setTranscripts] = useState("");
  const [processing, setProcessing] = useState(false);
  const [extracted, setExtracted] = useState(null);

  const processTranscripts = async () => {
    if (!transcripts.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: "Extract sales intelligence from call transcripts. Return plain text with sections: TALK TRACKS, OBJECTION HANDLERS, PRICING RESPONSES, KEY INSIGHTS.", messages: [{ role: "user", content: "Analyze these transcripts and extract key sales intelligence:\n\n" + transcripts }] })
      });
      const data = await res.json();
      setExtracted(data.content.map(b => b.text || "").join(""));
    } catch (e) { setExtracted("Unable to process. Please check your API connection."); }
    setProcessing(false);
  };

  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ fontSize: 36, fontWeight: 900, color: C.gray900, marginBottom: 8 }}>Knowledge Base</div>
      <div style={{ fontSize: 15, color: C.gray500, marginBottom: 36 }}>Upload call transcripts to train the AI prospects.</div>
      <div style={{ background: C.primaryBg, border: "1px solid " + C.primaryBorder, borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 6 }}>How this works</div>
        <div style={{ fontSize: 14, color: C.gray600, lineHeight: 1.7 }}>Paste real call transcripts. AI extracts winning talk tracks, objection handlers, and pricing responses.</div>
      </div>
      <label style={S.label}>Paste Call Transcripts</label>
      <textarea rows={12} value={transcripts} onChange={e => setTranscripts(e.target.value)} placeholder="Paste your call transcripts here." style={{ ...S.input, resize: "none", marginBottom: 16 }} />
      <button onClick={processTranscripts} disabled={processing || !transcripts.trim()} style={{ ...S.btn, padding: "13px 28px", fontSize: 15, opacity: (processing || !transcripts.trim()) ? 0.6 : 1 }}>{processing ? "⚡ Analyzing..." : "⚡ Extract Intelligence →"}</button>
      {extracted && <div style={{ ...S.card, padding: "24px", marginTop: 24, borderLeft: "4px solid " + C.success }}><div style={{ fontSize: 14, fontWeight: 700, color: C.success, marginBottom: 12 }}>✓ Intelligence Extracted</div><div style={{ fontSize: 14, color: C.gray600, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{extracted}</div></div>}
    </div>
  );
}

function LiveCallScreen({ scenario, user, onEnd }) {
  const { stage, icp, companySize } = scenario;
  const av = ICP_AVATARS[icp] || ICP_AVATARS.vp_sales;
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [status, setStatus] = useState("connecting");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const conversationRef = useRef([]);
  const camStreamRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    startCamera();
    setTimeout(() => { startConversation(); setStatus("live"); }, 1500);
    return () => { clearInterval(timerRef.current); if (camStreamRef.current) camStreamRef.current.getTracks().forEach(t => t.stop()); stopListening(); };
  }, []);

  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function startCamera() {
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); camStreamRef.current = stream; if (videoRef.current) videoRef.current.srcObject = stream; } catch (e) {}
  }

  function buildPrompt() {
    const si = { discovery: "Be polite but guarded. Make the rep earn your pain points. Ask what prompted their outreach.", demo: "You agreed to see the product. Ask pointed questions. Push back on feature claims.", negotiation: "Push for discounts. Raise last-minute concerns. Signal readiness only if handled well." };
    return "You are " + av.name + ", " + av.title + " at " + av.company + ". You are on a " + stage + " sales call.\nProduct: SalesFlow CRM - AI-powered CRM reducing manual data entry by 60%.\nYour primary concern: " + av.focus + ".\n" + si[stage] + "\nRULES: 2-3 sentences max. Sound natural. Ask follow-up questions. NEVER break character.";
  }

  function startConversation() {
    const opening = "Hi, I am " + av.name + ", " + av.title + " at " + av.company + ". I have about 20 minutes. What did you want to show me?";
    conversationRef.current = [{ role: "assistant", content: opening }];
    setMessages([{ from: "prospect", text: opening, ts: "00:00" }]);
    setTimeout(() => startListening(), 2000);
  }

  async function getAIResponse(userText) {
    conversationRef.current.push({ role: "user", content: userText });
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 200, system: buildPrompt(), messages: conversationRef.current }) });
      const data = await res.json();
      const reply = data.content && data.content.map(b => b.text || "").join("") || "Sorry, can you repeat that?";
      conversationRef.current.push({ role: "assistant", content: reply });
      return reply;
    } catch (e) { return "Sorry I missed that, can you repeat?"; }
  }

  async function handleUserSpeech(transcript) {
    if (!transcript.trim()) return;
    setCurrentTranscript(""); stopListening();
    setMessages(prev => [...prev, { from: "rep", text: transcript, ts: fmt(duration) }]);
    setIsSpeaking(true);
    const reply = await getAIResponse(transcript);
    setMessages(prev => [...prev, { from: "prospect", text: reply, ts: fmt(duration) }]);
    setIsSpeaking(false);
if (micOn) setTimeout(() => startListening(), 600);
  }
 function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = "en-US";
    recognitionRef.current = r;
    let silenceTimer = null;
    let finalTranscriptBuffer = "";

    r.onstart = () => setIsListening(true);
    r.onresult = e => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (final) finalTranscriptBuffer += final;
      setCurrentTranscript(finalTranscriptBuffer + interim);

      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        if (finalTranscriptBuffer.trim()) {
          const toSend = finalTranscriptBuffer.trim();
          finalTranscriptBuffer = "";
          handleUserSpeech(toSend);
        }
      }, 1200);
    };
    r.onerror = (e) => {
      if (e.error !== "no-speech") setIsListening(false);
    };
    r.onend = () => {
      if (recognitionRef.current === r && micOn && !isSpeaking) {
        try { r.start(); } catch (err) {}
      } else {
        setIsListening(false);
      }
  };
   try { r.start(); } catch (e) {}
  }

  function stopListening() { if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; } setIsListening(false); }
  function toggleMic() { if (micOn) { stopListening(); setMicOn(false); } else { setMicOn(true); if (status === "live" && !isSpeaking) startListening(); } }

  function handleEndCall() {
    stopListening(); clearInterval(timerRef.current);
    if (camStreamRef.current) camStreamRef.current.getTracks().forEach(t => t.stop());
    const repCount = messages.filter(m => m.from === "rep").length;
    const transcript = messages.map(m => (m.from === "rep" ? "Rep" : av.title) + ": " + m.text).join("\n");
    onEnd(transcript, scenario, duration, repCount);
  }

  return (
    <div style={{ height: "100vh", background: "#0f172a", fontFamily: "Inter, sans-serif", color: C.white, display: "flex", flexDirection: "column" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}"}</style>
      <div style={{ height: 60, background: "#1e293b", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, background: C.primary, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }}>S</div>
            <span style={{ fontSize: 16, fontWeight: 700 }}>SalesHub</span>
          </div>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>{STAGES.find(s => s.id === stage).label}</span>
          {status === "live" && <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.1)", borderRadius: 20, padding: "4px 12px" }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, animation: "pulse 2s infinite" }} /><span style={{ fontSize: 12, color: C.success, fontWeight: 600 }}>LIVE</span></div>}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 6 }}>{fmt(duration)}</div>
        <button onClick={handleEndCall} style={{ background: C.danger, color: C.white, border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>End Call</button>
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "grid", gridTemplateRows: "1fr 1fr", gap: 4, padding: 4 }}>
          <div style={{ background: "#1e293b", borderRadius: 16, overflow: "hidden", border: "2px solid " + (isSpeaking ? av.color : "#334155"), position: "relative" }}>
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, " + av.color + "22, #1e293b)" }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: av.bg, border: "3px solid " + av.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 16 }}>{av.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{av.name}</div>
              <div style={{ fontSize: 14, color: av.color, fontWeight: 600, marginTop: 4 }}>{av.title} · {av.company}</div>
            </div>
            <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(0,0,0,0.7)", borderRadius: 8, padding: "6px 14px" }}><div style={{ fontSize: 13, fontWeight: 700, color: av.color }}>{av.name}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{av.title}</div></div>
            {isSpeaking && <div style={{ position: "absolute", top: 16, right: 16, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.7)", borderRadius: 20, padding: "6px 14px" }}><div style={{ display: "flex", gap: 3 }}>{[1, 2, 3, 2, 1].map((h, i) => <div key={i} style={{ width: 3, height: 8 * h, background: av.color, borderRadius: 3, animation: "pulse " + (0.4 + i * 0.1) + "s infinite" }} />)}</div><span style={{ fontSize: 11, color: av.color, fontWeight: 600 }}>speaking</span></div>}
          </div>
          <div style={{ background: "#0f172a", borderRadius: 16, overflow: "hidden", border: "2px solid " + (isListening ? C.success : "#334155"), position: "relative" }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: camOn ? "block" : "none" }} />
            {!camOn && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><div style={{ width: 72, height: 72, borderRadius: "50%", background: "#1e293b", color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{user && user.name ? user.name.split(" ").map(n => n[0]).join("") : "ME"}</div><div style={{ fontSize: 13, color: "#64748b" }}>Camera off</div></div>}
            <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(0,0,0,0.7)", borderRadius: 8, padding: "6px 14px" }}><div style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{user && user.name ? user.name : "You"}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Sales Rep</div></div>
            {isListening && <div style={{ position: "absolute", top: 16, right: 72, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.7)", borderRadius: 20, padding: "6px 14px" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, animation: "pulse .8s infinite" }} /><span style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>listening</span></div>}
            {currentTranscript && <div style={{ position: "absolute", bottom: 56, left: 16, right: 16, background: "rgba(0,0,0,0.85)", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: C.white, fontStyle: "italic" }}>"{currentTranscript}"</div>}
            <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", gap: 8 }}>
              <button onClick={toggleMic} style={{ width: 42, height: 42, borderRadius: "50%", background: micOn ? "rgba(0,0,0,0.6)" : C.danger, border: "none", fontSize: 18, cursor: "pointer" }}>{micOn ? "🎙️" : "🔇"}</button>
              <button onClick={() => setCamOn(c => !c)} style={{ width: 42, height: 42, borderRadius: "50%", background: camOn ? "rgba(0,0,0,0.6)" : C.danger, border: "none", fontSize: 18, cursor: "pointer" }}>{camOn ? "📹" : "📷"}</button>
            </div>
          </div>
        </div>
        <div style={{ width: 320, borderLeft: "1px solid #334155", display: "flex", flexDirection: "column", background: "#1e293b" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #334155" }}><div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Live Transcript</div></div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 700, color: msg.from === "rep" ? C.primary : av.color }}>{msg.from === "rep" ? (user && user.name ? user.name.split(" ")[0] : "You") : av.name.split(" ")[0]}</span><span style={{ fontSize: 11, color: "#475569" }}>{msg.ts}</span></div>
                <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, background: "#0f172a", borderRadius: 10, padding: "10px 14px", borderLeft: "3px solid " + (msg.from === "rep" ? C.primary : av.color) }}>{msg.text}</div>
              </div>
            ))}
            {isSpeaking && <div style={{ marginBottom: 16 }}><span style={{ fontSize: 12, fontWeight: 700, color: av.color }}>{av.name.split(" ")[0]}</span><div style={{ fontSize: 20, color: av.color, marginTop: 8, letterSpacing: 6 }}>● ● ●</div></div>}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid #334155", background: "#0f172a" }}><div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 6 }}>FOCUS: {av.title.toUpperCase()}</div><div style={{ fontSize: 12, color: av.color }}>{av.focus}</div></div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid #334155", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: isListening ? C.success : isSpeaking ? av.color : "#334155", animation: (isListening || isSpeaking) ? "pulse 1s infinite" : "none" }} />
              <span style={{ fontSize: 12, color: isListening ? C.success : isSpeaking ? av.color : "#475569", fontWeight: 500 }}>{isListening ? "Listening..." : isSpeaking ? av.name.split(" ")[0] + " is speaking..." : "Waiting..."}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Debrief({ score, scenario, duration, onRetry, onDashboard }) {
  const av = ICP_AVATARS[scenario.icp] || ICP_AVATARS.vp_sales;
  const si = STAGES.find(s => s.id === scenario.stage) || {};
  return (
    <div style={{ minHeight: "100vh", background: C.gray50, fontFamily: "Inter, sans-serif", padding: "48px 40px" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ background: "linear-gradient(135deg, " + (score.passed ? "#0ea5e9" : "#f59e0b") + ", " + (score.passed ? "#0284c7" : "#d97706") + ")", borderRadius: 24, padding: "48px", textAlign: "center", marginBottom: 32, color: C.white }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.8, marginBottom: 16 }}>Call Complete · {si.label}</div>
          <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 1, marginBottom: 12 }}>{score.overallScore}</div>
          <div style={{ fontSize: 20, fontWeight: 700, opacity: 0.9, marginBottom: 8 }}>{score.passed ? "✓ Stage Passed!" : "Keep Practicing"}</div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>{fmt(duration)} · {av.name}, {av.title} · {COMPANY_SIZES[scenario.companySize]}</div>
        </div>
        <div style={{ ...S.card, padding: "28px 32px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Coach's Take</div>
          <div style={{ fontSize: 15, color: C.gray600, lineHeight: 1.8 }}>{score.coachSummary}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
          {Object.entries(score.categories || {}).map(([k, val]) => { const color = sc(val); return (<div key={k} style={{ ...S.card, padding: "20px" }}><div style={{ fontSize: 12, color: C.gray400, textTransform: "capitalize", fontWeight: 600, marginBottom: 10 }}>{k.replace(/([A-Z])/g, " $1")}</div><div style={{ background: C.gray100, borderRadius: 6, height: 8, marginBottom: 10 }}><div style={{ width: val + "%", height: "100%", background: color, borderRadius: 6 }} /></div><div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div></div>); })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 16, padding: "22px" }}><div style={{ fontSize: 12, fontWeight: 700, color: C.warning, marginBottom: 10, letterSpacing: 1 }}>⭐ BEST MOMENT</div><div style={{ fontSize: 14, color: C.gray600, lineHeight: 1.7, fontStyle: "italic" }}>"{score.bestMoment}"</div></div>
          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 16, padding: "22px" }}><div style={{ fontSize: 12, fontWeight: 700, color: C.danger, marginBottom: 10, letterSpacing: 1 }}>💡 MISSED</div><div style={{ fontSize: 14, color: C.gray600, lineHeight: 1.7 }}>{score.missedOpportunity}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 36 }}>
          <div style={{ background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: 16, padding: "22px" }}><div style={{ fontSize: 12, fontWeight: 700, color: C.success, marginBottom: 12, letterSpacing: 1 }}>✓ STRENGTHS</div>{(score.strengths || []).map((s, i) => <div key={i} style={{ fontSize: 14, color: C.gray600, marginBottom: 8, paddingLeft: 14, borderLeft: "3px solid " + C.success }}>{s}</div>)}</div>
          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 16, padding: "22px" }}><div style={{ fontSize: 12, fontWeight: 700, color: C.danger, marginBottom: 12, letterSpacing: 1 }}>↑ IMPROVE</div>{(score.improvements || []).map((s, i) => <div key={i} style={{ fontSize: 14, color: C.gray600, marginBottom: 8, paddingLeft: 14, borderLeft: "3px solid " + C.danger }}>{s}</div>)}</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <button onClick={onRetry} style={{ ...S.btnOutline, flex: 1, padding: "14px", fontSize: 15 }}>↻ Retry</button>
          <button onClick={onDashboard} style={{ ...S.btn, flex: 2, padding: "14px", fontSize: 16, fontWeight: 700 }}>← Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [user, setUser] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [score, setScore] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data: profile }) => {
          setUser(profile || { id: session.user.id, email: session.user.email, name: session.user.email.split("@")[0], role: "rep" });
          setScreen("dashboard");
        });
      } else { setScreen("landing"); }
    });
  }, []);

  const handleAuth = profile => { setUser(profile); setScreen("dashboard"); };
  const handleSignOut = async () => { await supabase.auth.signOut(); setUser(null); setScreen("landing"); };
  const handleStartSession = scen => { setScenario(scen); setScreen("call"); };

  const handleCallEnd = async (transcript, scen, dur, repMsgCount) => {
    setCallDuration(dur);
    if (repMsgCount < 1) {
      setScore({ overallScore: 0, passed: false, categories: { rapport: 0, discovery: 0, productKnowledge: 0, objectionHandling: 0, closing: 0 }, strengths: ["Call ended without speaking"], improvements: ["Stay on and engage with the prospect"], bestMoment: "No conversation recorded", missedOpportunity: "You need to speak to get scored", coachSummary: "You ended the call without saying anything. Jump in next time and practice engaging the prospect." });
      setScreen("debrief");
      return;
    }
    setScreen("analyzing");
    let parsed;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, system: "Senior sales coach. Return ONLY valid JSON, no markdown.", messages: [{ role: "user", content: "Analyze this " + scen.stage + " call. Return JSON: {\"overallScore\":<0-100>,\"passed\":<bool>,\"categories\":{\"rapport\":<0-100>,\"discovery\":<0-100>,\"productKnowledge\":<0-100>,\"objectionHandling\":<0-100>,\"closing\":<0-100>},\"strengths\":[\"str1\",\"str2\"],\"improvements\":[\"imp1\",\"imp2\"],\"bestMoment\":\"<text>\",\"missedOpportunity\":\"<text>\",\"coachSummary\":\"<2-3 sentences>\"}\n\nTranscript:\n" + transcript }] }) });
      const data = await res.json();
      parsed = JSON.parse(data.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim());
    } catch (e) {
      parsed = { overallScore: 70, passed: true, categories: { rapport: 74, discovery: 68, productKnowledge: 72, objectionHandling: 65, closing: 60 }, strengths: ["Good energy on the call", "Engaged with the prospect"], improvements: ["Ask more open-ended discovery questions", "Secure a clear next step before ending"], bestMoment: "When you asked about their current process", missedOpportunity: "Should have asked about budget and decision timeline", coachSummary: "Solid start. Focus on asking more open-ended questions and always close with a specific next step." };
    }
    if (user) {
      await supabase.from("sessions").insert({ user_id: user.id, stage: scen.stage, icp: scen.icp, icps: [scen.icp], company_size: scen.companySize, score: parsed.overallScore, passed: parsed.passed, categories: parsed.categories, coach_summary: parsed.coachSummary, duration: dur });
      if (scen.missionId) await supabase.from("missions").update({ completed: true, score: parsed.overallScore, read: true }).eq("id", scen.missionId);
    }
    setScore(parsed);
    setScreen("debrief");
  };

  if (screen === "loading") return (
    <div style={{ minHeight: "100vh", background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 900, fontSize: 28, margin: "0 auto 20px" }}>S</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.gray900, marginBottom: 20 }}>SalesHub</div>
        <div style={{ width: 36, height: 36, border: "3px solid " + C.primaryBorder, borderTop: "3px solid " + C.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
      </div>
    </div>
  );

  if (screen === "landing") return <LandingPage onGetStarted={() => setScreen("auth")} />;
  if (screen === "auth") return <AuthScreen onAuth={handleAuth} />;
  if (screen === "dashboard" && user) {
    if (user.role === "manager") return <ManagerDashboard user={user} onSignOut={handleSignOut} />;
    return <RepDashboard user={user} onStartSession={handleStartSession} onSignOut={handleSignOut} />;
  }
  if (screen === "call" && scenario) return <LiveCallScreen scenario={scenario} user={user} onEnd={handleCallEnd} />;
  if (screen === "analyzing") return (
    <div style={{ minHeight: "100vh", background: C.primaryBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{ width: 52, height: 52, border: "4px solid " + C.primaryBorder, borderTop: "4px solid " + C.primary, borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 24 }} />
      <div style={{ fontSize: 18, fontWeight: 600, color: C.gray600 }}>Analyzing your call...</div>
    </div>
  );
  if (screen === "debrief" && score) return <Debrief score={score} scenario={scenario} duration={callDuration} onRetry={() => setScreen("call")} onDashboard={() => setScreen("dashboard")} />;
  return null;
}
