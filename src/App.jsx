import { useState, useRef, useEffect } from "react";

// ══════════════════════════════════════════════════════════════
// CONSTANTS & DATA
// ══════════════════════════════════════════════════════════════

const ICP_PROFILES = {
  cfo:      { title: "CFO",       label: "Chief Financial Officer",    color: "#f59e0b", emoji: "💼", focus: "ROI & budget approval" },
  coo:      { title: "COO",       label: "Chief Operating Officer",    color: "#22c55e", emoji: "⚙️", focus: "Operations & implementation" },
  cto:      { title: "CTO",       label: "Chief Technology Officer",   color: "#38bdf8", emoji: "🔧", focus: "Tech stack & security" },
  vp_sales: { title: "VP Sales",  label: "VP of Sales",                color: "#a78bfa", emoji: "📈", focus: "Quota & rep adoption" },
  director: { title: "Director",  label: "Director of Revenue Ops",    color: "#fb923c", emoji: "📊", focus: "Process & reporting" },
  smb_owner:{ title: "Owner",     label: "SMB Founder / CEO",          color: "#f472b6", emoji: "🚀", focus: "Simplicity & cost" },
};

const COMPANY_SIZES = {
  startup:        "Startup (1–50)",
  smb:            "SMB (51–500)",
  mid_market:     "Mid-Market (501–2K)",
  enterprise:     "Enterprise (2K–10K)",
  large_enterprise:"Large Enterprise (10K+)",
};

const STAGES = [
  { id: "discovery",    label: "Discovery Call",        icon: "🔍", desc: "Uncover pain points & qualify",          duration: "30 min", passingScore: 68, color: "#38bdf8" },
  { id: "demo",         label: "Product Demo",           icon: "🖥️", desc: "Walk through features & handle objections", duration: "45 min", passingScore: 72, color: "#a78bfa" },
  { id: "negotiation",  label: "Negotiation & Close",   icon: "🤝", desc: "Pricing, objections & commitment",       duration: "30 min", passingScore: 78, color: "#22c55e" },
];

const MOCK_MISSIONS = [
  {
    id: "m1",
    from: "Sarah Martinez",
    fromRole: "Head of Sales",
    assignedAt: "Today, 9:14 AM",
    stage: "negotiation",
    icps: ["cfo", "coo"],
    companySize: "mid_market",
    note: "Hey Alex — your discovery scores are solid but we need to sharpen your pricing conversations. CFO objections are coming up in your real pipeline. Run this negotiation sim and focus on ROI framing before the Netlify call Thursday.",
    read: false,
    completed: false,
  },
  {
    id: "m2",
    from: "Sarah Martinez",
    fromRole: "Head of Sales",
    assignedAt: "Yesterday, 3:42 PM",
    stage: "demo",
    icps: ["cto"],
    companySize: "enterprise",
    note: "Great improvement on the last session. Now let's stress-test your technical demo skills — enterprise CTOs will drill you on security and integrations. Don't dodge the API questions.",
    read: true,
    completed: true,
    score: 79,
  },
];

const PRODUCT = {
  name: "SalesFlow CRM",
  description: "AI-powered CRM that auto-logs calls, predicts deal health, and reduces manual data entry by 60%.",
  features: ["AI call transcription", "Deal health scoring", "Smart follow-up suggestions", "Revenue forecasting", "Slack & Gmail integration"],
  pricing: "$65/seat/mo Starter · $120/seat/mo Pro · Enterprise custom",
};

const buildPrompt = (stage, icps, companySize, product) => {
  const personas = icps.map(i => ICP_PROFILES[i]);
  const size = COMPANY_SIZES[companySize];
  const stageInstructions = {
    discovery: "This is a cold discovery call the prospect agreed to take. Be guarded initially. Make the rep earn your pain points through good questions. Don't let them pitch yet.",
    demo: "You've agreed to a product demo after a discovery call. You're genuinely curious but skeptical. Ask pointed questions about YOUR specific concerns. Push back on claims.",
    negotiation: "You're in final negotiations. You like the product but have pricing objections. Push for discounts, question contract terms, raise last-minute concerns. Signal readiness only if handled well.",
  };

  return `You are ${personas.map(p => p.title).join(" and ")} at a ${size} company on a ${stage} sales call.

Product being sold: ${product.name} — ${product.description}
Pricing: ${product.pricing}

${personas.map(p => `As ${p.title}: You care most about ${p.focus}.`).join("\n")}

${stageInstructions[stage]}

RULES:
- Respond in 2–4 sentences. Sound like a real busy executive.
- Ask follow-up questions often. React authentically.
- Get harder if the rep dodges. Warm up when handled well.
- NEVER break character. You don't know this is a training simulation.
- Reference real concerns a ${size} company would have.`;
};

const scorePrompt = (stage, transcript, icps, companySize) =>
  `Analyze this ${stage} sales call. Return ONLY valid JSON, no markdown.

Transcript:
${transcript}

{
  "overallScore": <0-100>,
  "passed": <true if >= ${STAGES.find(s=>s.id===stage)?.passingScore}>,
  "categories": {
    "rapport": <0-100>,
    "discovery": <0-100>,
    "productKnowledge": <0-100>,
    "objectionHandling": <0-100>,
    "closing": <0-100>
  },
  "strengths": ["<specific>", "<specific>"],
  "improvements": ["<coaching note>", "<coaching note>"],
  "bestMoment": "<their best line>",
  "missedOpportunity": "<one thing they should have said>",
  "coachSummary": "<2-3 sentences, direct and honest>"
}`;

// ══════════════════════════════════════════════════════════════
// AVATAR CANVAS
// ══════════════════════════════════════════════════════════════

function Avatar({ icp, speaking, size = 300 }) {
  const ref = useRef(null);
  const anim = useRef(null);
  const phase = useRef(0);
  const p = ICP_PROFILES[icp];
  const colors = {
    cfo:       { hair: "#1a0a0a", skin: "#c8855a", suit: "#1e2d40" },
    coo:       { hair: "#2a1a0a", skin: "#b8754a", suit: "#1a2a1e" },
    cto:       { hair: "#3a3a4a", skin: "#d4956a", suit: "#1a1a3a" },
    vp_sales:  { hair: "#0a1a2a", skin: "#c0854a", suit: "#2a1a3a" },
    director:  { hair: "#4a2a0a", skin: "#c89060", suit: "#2a1a0a" },
    smb_owner: { hair: "#2a1a1a", skin: "#d4a060", suit: "#1a3a2a" },
  };
  const av = colors[icp] || colors.cfo;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2 - 10;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.6);
      bg.addColorStop(0, "#141e2e");
      bg.addColorStop(1, "#06090f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(56,189,248,0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      if (speaking) {
        phase.current += 0.07;
        for (let r = 0; r < 3; r++) {
          const rad = 90 + r * 18 + Math.sin(phase.current + r * 1.2) * 6;
          ctx.beginPath(); ctx.arc(cx, cy - 5, rad, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56,189,248,${0.13 - r * 0.03})`; ctx.lineWidth = 1.5; ctx.stroke();
        }
      }

      // Shoulders
      ctx.beginPath(); ctx.ellipse(cx, H - 10, 88, 58, 0, Math.PI, 0);
      ctx.fillStyle = av.suit; ctx.fill();

      // Neck
      ctx.beginPath(); ctx.roundRect(cx - 15, cy + 50, 30, 28, 3);
      ctx.fillStyle = av.skin; ctx.fill();

      // Face
      ctx.beginPath(); ctx.ellipse(cx, cy, 62, 74, 0, 0, Math.PI * 2);
      ctx.fillStyle = av.skin; ctx.fill();

      // Hair
      ctx.beginPath(); ctx.ellipse(cx, cy - 42, 64, 44, 0, Math.PI, 0);
      ctx.fillStyle = av.hair; ctx.fill();
      [-60, 60].forEach(ox => {
        ctx.beginPath(); ctx.arc(cx + ox, cy - 10, 15, 0, Math.PI * 2);
        ctx.fillStyle = av.hair; ctx.fill();
      });

      // Eyes
      const blink = speaking ? (Math.sin(phase.current * 0.25) > 0.96 ? 1 : 9) : 9;
      [-22, 22].forEach(ox => {
        ctx.beginPath(); ctx.ellipse(cx + ox, cy - 6, 10, blink / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#1a1a2e"; ctx.fill();
        ctx.beginPath(); ctx.arc(cx + ox + 2, cy - 7, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fill();
      });

      // Brows
      [-22, 22].forEach(ox => {
        ctx.beginPath(); ctx.moveTo(cx + ox - 12, cy - 24);
        ctx.quadraticCurveTo(cx + ox, cy - 28, cx + ox + 12, cy - 24);
        ctx.strokeStyle = av.hair; ctx.lineWidth = 2.5; ctx.stroke();
      });

      // Mouth
      const mOpen = speaking ? Math.abs(Math.sin(phase.current * 3.2)) * 9 : 2;
      ctx.beginPath(); ctx.ellipse(cx, cy + 40, 18, mOpen + 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = speaking ? "#7a1a1a" : "#b06858"; ctx.fill();

      // Name tag
      ctx.fillStyle = "rgba(6,9,15,0.88)";
      ctx.roundRect && ctx.roundRect(10, H - 54, 190, 38, 6);
      ctx.fill();
      ctx.fillStyle = p?.color || "#38bdf8";
      ctx.font = `bold 13px 'DM Mono', monospace`;
      ctx.fillText(p?.title || "", 20, H - 34);
      ctx.fillStyle = "#64748b";
      ctx.font = `10px 'DM Mono', monospace`;
      ctx.fillText(p?.label || "", 20, H - 18);

      if (speaking) {
        ctx.fillStyle = "#22c55e";
        ctx.beginPath(); ctx.arc(W - 20, 20, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(34,197,94,${0.25 + Math.sin(phase.current * 4) * 0.1})`;
        ctx.beginPath(); ctx.arc(W - 20, 20, 14, 0, Math.PI * 2); ctx.fill();
      }

      anim.current = requestAnimationFrame(draw);
    };
    anim.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(anim.current);
  }, [speaking, icp]);

  return <canvas ref={ref} width={size} height={Math.round(size * 0.78)} style={{ width: "100%", height: "100%", display: "block" }} />;
}

// ══════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════

function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("rep");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      onLogin({ role, name: role === "rep" ? "Alex Rivera" : "Sarah Martinez", email });
    }, 900);
  };

  const presets = [
    { role: "rep", label: "Sales Rep", name: "Alex Rivera", sub: "Account Executive", color: "#38bdf8" },
    { role: "manager", label: "Manager", name: "Sarah Martinez", sub: "Head of Sales", color: "#a78bfa" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", display: "flex", fontFamily: "'DM Mono',monospace" }}>
      {/* Left brand panel */}
      <div style={{ width: "45%", background: "linear-gradient(135deg, #0a1628 0%, #06090f 100%)", borderRight: "1px solid #1e2d40", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 64px", position: "relative", overflow: "hidden" }}>
        {/* bg pattern */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px, #1e2d40 1px, transparent 0)", backgroundSize: "32px 32px", opacity: 0.4 }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#38bdf8", letterSpacing: 4, marginBottom: 8 }}>⬡ CALLFORGE</div>
          <div style={{ fontSize: 13, color: "#475569", letterSpacing: 2, marginBottom: 64, textTransform: "uppercase" }}>Sales Training Platform</div>

          <div style={{ fontSize: 38, fontWeight: 900, color: "#f1f5f9", lineHeight: 1.2, marginBottom: 20 }}>
            Train like it's<br />a real call.
          </div>
          <div style={{ fontSize: 15, color: "#64748b", lineHeight: 1.8, maxWidth: 340 }}>
            Practice discovery, demo, and closing calls against AI prospects trained on your actual playbook. Get scored. Get certified. Get on the phone.
          </div>

          <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 16 }}>
            {[["🔍", "Real AI prospects that push back"], ["📊", "Scored on every call, every time"], ["🎓", "Manager-certified before going live"]].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: "#64748b" }}>
                <span style={{ fontSize: 18 }}>{icon}</span>{text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 40 }}>Sign in to your CallForge account</div>

          {/* Role selector */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Log in as</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {presets.map(p => (
                <div key={p.role} onClick={() => { setRole(p.role); setEmail(p.name.toLowerCase().replace(" ", ".") + "@acmecorp.com"); }} style={{ background: role === p.role ? "#0f2744" : "#0d1320", border: `1px solid ${role === p.role ? p.color : "#1e2d40"}`, borderRadius: 12, padding: "16px 16px", cursor: "pointer", transition: "all .2s" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: role === p.role ? p.color : "#94a3b8", marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#334155" }}>{p.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Email</div>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={{ width: "100%", background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 10, padding: "13px 16px", fontSize: 14, color: "#e2e8f0", fontFamily: "inherit", outline: "none", display: "block" }} />
          </div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Password</div>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" style={{ width: "100%", background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 10, padding: "13px 16px", fontSize: 14, color: "#e2e8f0", fontFamily: "inherit", outline: "none", display: "block" }} />
          </div>

          <button onClick={handle} disabled={loading} style={{ width: "100%", background: loading ? "#0a0f1e" : "#0f2744", border: `1px solid ${loading ? "#1e2d40" : "#38bdf8"}`, color: loading ? "#334155" : "#38bdf8", borderRadius: 12, padding: "16px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#334155" }}>
            Demo mode — click any role to auto-fill
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REP DASHBOARD
// ══════════════════════════════════════════════════════════════

function RepDashboard({ user, sessions, missions, onStartSession, onOpenMission, onSwitchRole }) {
  const [tab, setTab] = useState("home");
  const avgScore = sessions.length ? Math.round(sessions.reduce((a, b) => a + b.score, 0) / sessions.length) : null;
  const unread = missions.filter(m => !m.read).length;
  const sc = (s) => s >= 80 ? "#22c55e" : s >= 70 ? "#38bdf8" : s >= 60 ? "#f59e0b" : "#ef4444";

  const catAvgs = {};
  sessions.forEach(s => {
    if (!s.categories) return;
    Object.entries(s.categories).forEach(([k, v]) => {
      if (!catAvgs[k]) catAvgs[k] = [];
      catAvgs[k].push(v);
    });
  });

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'DM Mono',monospace", color: "#e2e8f0", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#0a0f1e", borderRight: "1px solid #1e2d40", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "22px 20px", borderBottom: "1px solid #1e2d40" }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#38bdf8", letterSpacing: 3 }}>⬡ CALLFORGE</div>
        </div>

        <nav style={{ padding: "16px 0", flex: 1 }}>
          {[
            ["home", "🏠", "Dashboard"],
            ["train", "🎯", "Train"],
            ["missions", `📤`, `Missions${unread ? ` (${unread})` : ""}`],
            ["progress", "📊", "My Progress"],
          ].map(([id, icon, label]) => (
            <div key={id} onClick={() => setTab(id)} style={{ padding: "11px 20px", fontSize: 13, color: tab === id ? "#38bdf8" : "#475569", cursor: "pointer", borderLeft: tab === id ? "2px solid #38bdf8" : "2px solid transparent", background: tab === id ? "#0f2744" : "transparent", display: "flex", alignItems: "center", gap: 10 }}>
              <span>{icon}</span><span>{label}</span>
              {id === "missions" && unread > 0 && <span style={{ marginLeft: "auto", background: "#f87171", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{unread}</span>}
            </div>
          ))}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #1e2d40" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e3a5f", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>AR</div>
            <div>
              <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "#475569" }}>Account Executive</div>
            </div>
          </div>
          <div onClick={onSwitchRole} style={{ fontSize: 11, color: "#475569", cursor: "pointer", textDecoration: "underline" }}>Switch to Manager →</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* HOME TAB */}
        {tab === "home" && (
          <div style={{ padding: "40px 48px" }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Good morning</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#f1f5f9" }}>Hey, {user.name.split(" ")[0]} 👋</div>
              <div style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>You have {unread} new mission{unread !== 1 ? "s" : ""} from your manager.</div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 40 }}>
              {[
                ["Avg Score", avgScore ?? "—", avgScore ? sc(avgScore) : "#475569"],
                ["Sessions", sessions.length, "#a78bfa"],
                ["Passed", sessions.filter(s => s.passed).length, "#22c55e"],
                ["Streak", "4 days 🔥", "#f59e0b"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 14, padding: "20px 22px" }}>
                  <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Manager missions */}
            {missions.filter(m => !m.completed).length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>📤 Assigned by Manager</div>
                {missions.filter(m => !m.completed).map(m => (
                  <div key={m.id} onClick={() => { setTab("missions"); onOpenMission(m); }} style={{ background: "#0a1628", border: `1px solid ${m.read ? "#1e2d40" : "#38bdf8"}`, borderRadius: 14, padding: "20px 24px", marginBottom: 12, cursor: "pointer", position: "relative" }}>
                    {!m.read && <div style={{ position: "absolute", top: 16, right: 16, width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />}
                    <div style={{ fontSize: 12, color: "#60a5fa", marginBottom: 6 }}>From {m.from} · {m.assignedAt}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
                      {STAGES.find(s => s.id === m.stage)?.icon} {STAGES.find(s => s.id === m.stage)?.label} · {m.icps.map(i => ICP_PROFILES[i].title).join(" + ")}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>"{m.note.substring(0, 100)}..."</div>
                    <div style={{ marginTop: 12, fontSize: 12, color: "#38bdf8" }}>Start Mission →</div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick start */}
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>Quick Start a Session</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {STAGES.map(stage => (
                <div key={stage.id} onClick={() => { setTab("train"); }} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 14, padding: "22px 20px", cursor: "pointer", transition: "border-color .2s" }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{stage.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{stage.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{stage.desc}</div>
                  <div style={{ fontSize: 11, color: stage.color, background: `${stage.color}18`, borderRadius: 6, padding: "3px 10px", display: "inline-block" }}>{stage.duration}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRAIN TAB */}
        {tab === "train" && (
          <div style={{ padding: "40px 48px" }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Training</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>Build a Scenario</div>
            </div>
            <ScenarioBuilder onStart={onStartSession} />
          </div>
        )}

        {/* MISSIONS TAB */}
        {tab === "missions" && (
          <div style={{ padding: "40px 48px" }}>
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Inbox</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>Manager Missions</div>
            </div>
            {missions.map(m => (
              <div key={m.id} style={{ background: "#0d1320", border: `1px solid ${m.read ? "#1e2d40" : "#38bdf8"}`, borderRadius: 16, padding: "24px 26px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      {!m.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />}
                      <span style={{ fontSize: 12, color: "#60a5fa" }}>{m.from} · {m.assignedAt}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>
                      {STAGES.find(s => s.id === m.stage)?.icon} {STAGES.find(s => s.id === m.stage)?.label}
                    </div>
                  </div>
                  {m.completed ? (
                    <div style={{ background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#22c55e" }}>✓ Completed · {m.score}</div>
                  ) : (
                    <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#38bdf8" }}>Pending</div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  {m.icps.map(icp => <span key={icp} style={{ fontSize: 11, color: ICP_PROFILES[icp].color, background: `${ICP_PROFILES[icp].color}18`, borderRadius: 6, padding: "3px 10px" }}>{ICP_PROFILES[icp].emoji} {ICP_PROFILES[icp].title}</span>)}
                  <span style={{ fontSize: 11, color: "#64748b", background: "#0a0f1e", borderRadius: 6, padding: "3px 10px" }}>{COMPANY_SIZES[m.companySize]}</span>
                </div>

                <div style={{ background: "#0a0f1e", border: "1px solid #1e2d40", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Coach Note</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, fontStyle: "italic" }}>"{m.note}"</div>
                </div>

                {!m.completed && (
                  <button onClick={() => onStartSession({ stage: m.stage, icps: m.icps, companySize: m.companySize, missionId: m.id })} style={{ background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 10, padding: "12px 24px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                    Start This Mission →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PROGRESS TAB */}
        {tab === "progress" && (
          <div style={{ padding: "40px 48px" }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Performance</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>My Progress</div>
            </div>

            {sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 40px", color: "#334155" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                <div style={{ fontSize: 16, color: "#475569" }}>No sessions yet — start training to see your progress</div>
              </div>
            ) : (
              <>
                {/* Category breakdown */}
                {Object.keys(catAvgs).length > 0 && (
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ fontSize: 11, letterSpacing: 3, color: "#64748b", textTransform: "uppercase", marginBottom: 20 }}>Skill Breakdown</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                      {Object.entries(catAvgs).map(([k, vals]) => {
                        const a = Math.round(vals.reduce((x, y) => x + y, 0) / vals.length);
                        const c = sc(a);
                        return (
                          <div key={k} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 12, padding: "18px 20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                              <span style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span>
                              <span style={{ fontSize: 20, fontWeight: 800, color: c }}>{a}</span>
                            </div>
                            <div style={{ background: "#0a0f1e", borderRadius: 4, height: 5 }}>
                              <div style={{ width: `${a}%`, height: "100%", background: c, borderRadius: 4 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Session history */}
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#64748b", textTransform: "uppercase", marginBottom: 20 }}>Session History</div>
                {sessions.slice().reverse().map((s, i) => (
                  <div key={i} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 12, padding: "18px 22px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontSize: 24 }}>{STAGES.find(st => st.id === s.stage)?.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{STAGES.find(st => st.id === s.stage)?.label}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{s.icps?.map(i => ICP_PROFILES[i]?.title).join(" + ")} · {COMPANY_SIZES[s.companySize]}</div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: sc(s.score) }}>{s.score}</div>
                    <div style={{ fontSize: 11, color: s.passed ? "#22c55e" : "#f59e0b" }}>{s.passed ? "✓ Passed" : "↻ Retry"}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCENARIO BUILDER (inline)
// ══════════════════════════════════════════════════════════════

function ScenarioBuilder({ onStart }) {
  const [stage, setStage] = useState("discovery");
  const [icps, setICPs] = useState(["vp_sales"]);
  const [companySize, setCompanySize] = useState("smb");

  const toggleICP = (id) => setICPs(prev => prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Call Stage</div>
        <div style={{ display: "flex", gap: 12 }}>
          {STAGES.map(s => (
            <div key={s.id} onClick={() => setStage(s.id)} style={{ flex: 1, background: stage === s.id ? "#0f2744" : "#0d1320", border: `1px solid ${stage === s.id ? s.color : "#1e2d40"}`, borderRadius: 14, padding: "20px 18px", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: stage === s.id ? s.color : "#cbd5e1" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{s.duration}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Who's on the call? <span style={{ color: "#334155" }}>(up to 3)</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {Object.entries(ICP_PROFILES).map(([id, p]) => {
            const sel = icps.includes(id);
            return (
              <div key={id} onClick={() => toggleICP(id)} style={{ background: sel ? "#0f2744" : "#0d1320", border: `1px solid ${sel ? p.color : "#1e2d40"}`, borderRadius: 12, padding: "14px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{p.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: sel ? 700 : 400, color: sel ? p.color : "#94a3b8" }}>{p.title}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{p.focus.split(" ").slice(0, 3).join(" ")}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Company Size</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(COMPANY_SIZES).map(([id, label]) => (
            <div key={id} onClick={() => setCompanySize(id)} style={{ background: companySize === id ? "#0f2744" : "#0d1320", border: `1px solid ${companySize === id ? "#38bdf8" : "#1e2d40"}`, borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: 12, color: companySize === id ? "#38bdf8" : "#64748b", fontWeight: companySize === id ? 700 : 400 }}>{label}</div>
          ))}
        </div>
      </div>

      <div style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 12, padding: "18px 22px", marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Scenario</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{STAGES.find(s => s.id === stage)?.label} · {icps.map(i => ICP_PROFILES[i].title).join(" + ")}</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{COMPANY_SIZES[companySize]}</div>
      </div>

      <button onClick={() => onStart({ stage, icps, companySize })} style={{ width: "100%", background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 12, padding: "18px", fontSize: 16, cursor: "pointer", fontFamily: "inherit", fontWeight: 900 }}>
        Join Call →
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CALL SCREEN
// ══════════════════════════════════════════════════════════════

function CallScreen({ scenario, onEnd }) {
  const { stage, icps, companySize } = scenario;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingICP, setSpeakingICP] = useState(null);
  const [duration, setDuration] = useState(0);
  const convRef = useRef({});
  icps.forEach(icp => { if (!convRef.current[icp]) convRef.current[icp] = []; });
  const chatEnd = useRef(null);
  const timerRef = useRef(null);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    startCall();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const startCall = async () => {
    setLoading(true);
    const first = icps[0];
    const opener = { role: "user", content: `Start the call. Introduce yourself naturally as ${ICP_PROFILES[first].title} and open the conversation.` };
    convRef.current[first] = [opener];
    setSpeakingICP(first);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: buildPrompt(stage, icps, companySize, PRODUCT), messages: convRef.current[first] })
      });
      const data = await res.json();
      const reply = data.content.map(b => b.text || "").join("");
      convRef.current[first] = [...convRef.current[first], { role: "assistant", content: reply }];
      setMessages([{ from: "prospect", icp: first, text: reply, ts: "00:00" }]);
    } catch { setMessages([{ from: "prospect", icp: first, text: "Hey, thanks for jumping on. Give me one second...", ts: "00:00" }]); }
    setSpeakingICP(null);
    setLoading(false);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    const ts = fmt(duration);
    setMessages(prev => [...prev, { from: "rep", text, ts }]);
    setLoading(true);
    const respondingICP = icps[Math.floor(Math.random() * icps.length)];
    convRef.current[respondingICP] = [...(convRef.current[respondingICP] || []), { role: "user", content: text }];
    setSpeakingICP(respondingICP);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: buildPrompt(stage, icps, companySize, PRODUCT), messages: convRef.current[respondingICP] })
      });
      const data = await res.json();
      const reply = data.content.map(b => b.text || "").join("");
      convRef.current[respondingICP] = [...convRef.current[respondingICP], { role: "assistant", content: reply }];
      setMessages(prev => [...prev, { from: "prospect", icp: respondingICP, text: reply, ts: fmt(duration) }]);
    } catch { setMessages(prev => [...prev, { from: "prospect", icp: respondingICP, text: "Sorry, I missed that.", ts: fmt(duration) }]); }
    setSpeakingICP(null);
    setLoading(false);
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const transcript = messages.map(m => `${m.from === "rep" ? "Rep" : ICP_PROFILES[m.icp]?.title}: ${m.text}`).join("\n");
  const gridCols = icps.length === 1 ? "1fr" : icps.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr";

  return (
    <div style={{ height: "100vh", background: "#06090f", fontFamily: "'DM Mono',monospace", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <div style={{ height: 52, borderBottom: "1px solid #1e2d40", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>⬡ CALLFORGE</span>
          <span style={{ fontSize: 12, color: "#475569", marginLeft: 8 }}>{STAGES.find(s => s.id === stage)?.label} · {COMPANY_SIZES[companySize]}</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 6, color: "#f1f5f9" }}>{fmt(duration)}</div>
        <button onClick={() => onEnd(transcript, scenario, duration)} style={{ background: "#1a0505", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: 8, padding: "7px 20px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>End & Review</button>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Video */}
        <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: gridCols, gap: 12 }}>
            {icps.map(icp => (
              <div key={icp} style={{ background: "#0d1320", borderRadius: 16, overflow: "hidden", border: `2px solid ${speakingICP === icp ? ICP_PROFILES[icp].color : "#1e2d40"}`, transition: "border-color .3s" }}>
                <Avatar icp={icp} speaking={speakingICP === icp} />
              </div>
            ))}
          </div>
          {/* Rep tile */}
          <div style={{ height: 90, background: "#0d1320", borderRadius: 12, border: "1px solid #1e2d40", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#1e3a5f", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>AR</div>
            <div style={{ position: "absolute", bottom: 10, left: 14, fontSize: 11, color: "#64748b" }}>Alex Rivera (You)</div>
          </div>
        </div>

        {/* Chat */}
        <div style={{ width: 350, borderLeft: "1px solid #1e2d40", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#334155", textTransform: "uppercase", marginBottom: 14 }}>Live Transcript</div>
            {messages.map((msg, i) => {
              const p = msg.icp ? ICP_PROFILES[msg.icp] : null;
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: msg.from === "rep" ? "#60a5fa" : p?.color }}>{msg.from === "rep" ? "You" : p?.title}</span>
                    <span style={{ fontSize: 10, color: "#334155" }}>{msg.ts}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, background: "#0a0f1e", borderRadius: 8, padding: "9px 12px", borderLeft: `2px solid ${msg.from === "rep" ? "#1e3a5f" : p?.color + "55"}` }}>{msg.text}</div>
                </div>
              );
            })}
            {loading && (
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: speakingICP ? ICP_PROFILES[speakingICP]?.color : "#38bdf8" }}>{speakingICP ? ICP_PROFILES[speakingICP]?.title : "..."}</span>
                <div style={{ fontSize: 13, color: "#38bdf8", background: "#0a0f1e", borderRadius: 8, padding: "9px 12px", marginTop: 4, borderLeft: "2px solid #1e3a2a" }}>● ● ●</div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          <div style={{ padding: 12, borderTop: "1px solid #1e2d40" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Your response... (Enter to send)" rows={3} disabled={loading}
              style={{ width: "100%", background: "#0a0f1e", border: "1px solid #1e2d40", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#e2e8f0", fontFamily: "inherit", resize: "none", outline: "none", display: "block" }} />
            <button onClick={send} disabled={loading || !input.trim()} style={{ marginTop: 8, width: "100%", background: input.trim() && !loading ? "#0f2744" : "#0a0f1e", border: `1px solid ${input.trim() && !loading ? "#38bdf8" : "#1e2d40"}`, color: input.trim() && !loading ? "#38bdf8" : "#334155", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Send →</button>
          </div>

          <div style={{ padding: "10px 14px", borderTop: "1px solid #1e2d40", background: "#0a0f1e" }}>
            <div style={{ fontSize: 10, color: "#334155", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Focus</div>
            {icps.map(icp => <div key={icp} style={{ fontSize: 11, color: "#475569", marginBottom: 3 }}><span style={{ color: ICP_PROFILES[icp].color }}>{ICP_PROFILES[icp].title}:</span> {ICP_PROFILES[icp].focus}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DEBRIEF
// ══════════════════════════════════════════════════════════════

function Debrief({ score, scenario, duration, onRetry, onDashboard }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setTimeout(() => setVis(true), 80); }, []);
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const sc = (s) => s >= 80 ? "#22c55e" : s >= 70 ? "#38bdf8" : s >= 60 ? "#f59e0b" : "#ef4444";
  const stageInfo = STAGES.find(s => s.id === scenario.stage);

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'DM Mono',monospace", color: "#e2e8f0", padding: "48px 40px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(16px)", transition: "all .5s" }}>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 12 }}>Call Complete · {stageInfo?.label}</div>
          <div style={{ fontSize: 90, fontWeight: 900, color: sc(score.overallScore), lineHeight: 1 }}>{score.overallScore}</div>
          <div style={{ fontSize: 16, color: score.passed ? "#4ade80" : "#fbbf24", fontWeight: 700, marginTop: 8 }}>{score.passed ? "✓ Stage Passed" : "↻ Keep Practicing"}</div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>{fmt(duration)} · {scenario.icps.map(i => ICP_PROFILES[i].title).join(" + ")} · {COMPANY_SIZES[scenario.companySize]}</div>
        </div>

        <div style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 14, padding: "22px 28px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#38bdf8", textTransform: "uppercase", marginBottom: 10 }}>Coach's Take</div>
          <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.8 }}>{score.coachSummary}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {Object.entries(score.categories).map(([k, val]) => {
            const c = sc(val);
            return (
              <div key={k} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize", marginBottom: 8 }}>{k.replace(/([A-Z])/g, " $1")}</div>
                <div style={{ background: "#0a0f1e", borderRadius: 4, height: 4, marginBottom: 6 }}>
                  <div style={{ width: `${val}%`, height: "100%", background: c, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{val}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "#f59e0b", marginBottom: 8 }}>⭐ BEST MOMENT</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, fontStyle: "italic" }}>"{score.bestMoment}"</div>
          </div>
          <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "#f87171", marginBottom: 8 }}>💡 MISSED</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{score.missedOpportunity}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 36 }}>
          {[["✓ Strengths", score.strengths, "#22c55e", "#0a1a0a", "#1a3a1a"], ["↑ Improve", score.improvements, "#f87171", "#1a0a0a", "#3a1a1a"]].map(([title, items, color, bg, border]) => (
            <div key={title} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color, marginBottom: 12 }}>{title}</div>
              {items?.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8, paddingLeft: 12, borderLeft: `2px solid ${border}` }}>{s}</div>)}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onRetry} style={{ flex: 1, background: "#0d1320", border: "1px solid #1e2d40", color: "#94a3b8", borderRadius: 10, padding: "14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>↻ Retry</button>
          <button onClick={onDashboard} style={{ flex: 2, background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 10, padding: "14px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 800 }}>← Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MANAGER DASHBOARD (simplified inline)
// ══════════════════════════════════════════════════════════════

function ManagerView({ onSwitchRole }) {
  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "'DM Mono',monospace", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#a78bfa", marginBottom: 12 }}>⬡ CALLFORGE</div>
        <div style={{ fontSize: 16, color: "#64748b", marginBottom: 8 }}>Manager Dashboard</div>
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 32 }}>Full manager view available in the Manager Dashboard component</div>
        <button onClick={onSwitchRole} style={{ background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 10, padding: "12px 28px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Switch to Rep View →</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════

export default function CallForge() {
  const [screen, setScreen] = useState("login"); // login | rep | call | analyzing | debrief | manager
  const [user, setUser] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [score, setScore] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [missions, setMissions] = useState(MOCK_MISSIONS);

  const handleLogin = (u) => { setUser(u); setScreen(u.role === "manager" ? "manager" : "rep"); };

  const handleStartSession = (scen) => { setScenario(scen); setScreen("call"); };

  const handleCallEnd = async (transcript, scen, dur) => {
    setCallDuration(dur);
    setScreen("analyzing");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1200,
          system: "Senior sales coach. Analyze call transcripts. Return ONLY valid JSON, no markdown.",
          messages: [{ role: "user", content: scorePrompt(scen.stage, transcript, scen.icps, scen.companySize) }]
        })
      });
      const data = await res.json();
      const raw = data.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      setScore(parsed);
      setSessions(prev => [...prev, { ...parsed, stage: scen.stage, icps: scen.icps, companySize: scen.companySize }]);
      // Mark mission complete if applicable
      if (scen.missionId) {
        setMissions(prev => prev.map(m => m.id === scen.missionId ? { ...m, completed: true, score: parsed.overallScore, read: true } : m));
      }
    } catch {
      const fb = { overallScore: 72, passed: true, categories: { rapport: 76, discovery: 70, productKnowledge: 74, objectionHandling: 66, closing: 60 }, strengths: ["Strong rapport and professional tone", "Good product knowledge foundation"], improvements: ["Go deeper on discovery before pitching", "Always close with a defined next step"], bestMoment: "When you connected their pain point directly to a product feature", missedOpportunity: "Should have asked about budget and decision timeline earlier", coachSummary: "Solid effort with good energy. The key unlock for you is slowing down on discovery — let them talk more before you pitch. Score improves fast once you master that." };
      setScore(fb);
      setSessions(prev => [...prev, { ...fb, stage: scen.stage, icps: scen.icps, companySize: scen.companySize }]);
    }
    setScreen("debrief");
  };

  if (screen === "login") return <LoginScreen onLogin={handleLogin} />;
  if (screen === "manager") return <ManagerView onSwitchRole={() => { setUser({ role: "rep", name: "Alex Rivera" }); setScreen("rep"); }} />;
  if (screen === "rep") return <RepDashboard user={user} sessions={sessions} missions={missions} onStartSession={handleStartSession} onOpenMission={(m) => { setMissions(prev => prev.map(x => x.id === m.id ? { ...x, read: true } : x)); }} onSwitchRole={() => setScreen("manager")} />;
  if (screen === "call" && scenario) return <CallScreen scenario={scenario} onEnd={handleCallEnd} />;
  if (screen === "analyzing") return (
    <div style={{ minHeight: "100vh", background: "#06090f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace" }}>
      <div style={{ width: 48, height: 48, border: "3px solid #1e2d40", borderTop: "3px solid #38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 20 }} />
      <div style={{ color: "#64748b", fontSize: 14 }}>Analyzing your call...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (screen === "debrief" && score) return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Debrief score={score} scenario={scenario} duration={callDuration} onRetry={() => setScreen("call")} onDashboard={() => setScreen("rep")} />
    </>
  );
  return null;
}
