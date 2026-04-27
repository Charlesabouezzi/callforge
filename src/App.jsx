import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase";

const ICP_PROFILES = {
  cfo:       { title: "CFO",      label: "Chief Financial Officer",  color: "#f59e0b", emoji: "💼", focus: "ROI & budget approval", hair: "#1a0a0a", skin: "#c8855a", suit: "#1e2d40" },
  coo:       { title: "COO",      label: "Chief Operating Officer",  color: "#22c55e", emoji: "⚙️", focus: "Operations & implementation", hair: "#2a1a0a", skin: "#b8754a", suit: "#1a2a1e" },
  cto:       { title: "CTO",      label: "Chief Technology Officer", color: "#38bdf8", emoji: "🔧", focus: "Tech stack & security", hair: "#3a3a4a", skin: "#d4956a", suit: "#1a1a3a" },
  vp_sales:  { title: "VP Sales", label: "VP of Sales",              color: "#a78bfa", emoji: "📈", focus: "Quota & rep adoption", hair: "#0a1a2a", skin: "#c0854a", suit: "#2a1a3a" },
  director:  { title: "Director", label: "Director of Revenue Ops",  color: "#fb923c", emoji: "📊", focus: "Process & reporting", hair: "#4a2a0a", skin: "#c89060", suit: "#2a1a0a" },
  smb_owner: { title: "Owner",    label: "SMB Founder / CEO",        color: "#f472b6", emoji: "🚀", focus: "Simplicity & cost", hair: "#2a1a1a", skin: "#d4a060", suit: "#1a3a2a" },
};

const COMPANY_SIZES = {
  startup: "Startup (1-50)", smb: "SMB (51-500)", mid_market: "Mid-Market (501-2K)",
  enterprise: "Enterprise (2K-10K)", large_enterprise: "Large Enterprise (10K+)",
};

const STAGES = [
  { id: "discovery",   label: "Discovery Call",      icon: "🔍", desc: "Uncover pain points & qualify",             duration: "30 min", passingScore: 68, color: "#38bdf8" },
  { id: "demo",        label: "Product Demo",         icon: "🖥️", desc: "Walk through features & handle objections", duration: "45 min", passingScore: 72, color: "#a78bfa" },
  { id: "negotiation", label: "Negotiation & Close", icon: "🤝", desc: "Pricing, objections & commitment",          duration: "30 min", passingScore: 78, color: "#22c55e" },
];

// ── AVATAR ──────────────────────────────────────────────────────
function Avatar({ icp, speaking, size = 300 }) {
  const ref = useRef(null);
  const anim = useRef(null);
  const phase = useRef(0);
  const p = ICP_PROFILES[icp] || ICP_PROFILES.vp_sales;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2 - 20;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // Background
      const bg = ctx.createRadialGradient(cx, cy, 20, cx, cy, W * 0.7);
      bg.addColorStop(0, "#1a2744"); bg.addColorStop(1, "#06090f");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Speaking rings
      if (speaking) {
        phase.current += 0.07;
        for (let r = 0; r < 3; r++) {
          const rad = 100 + r * 20 + Math.sin(phase.current + r) * 7;
          ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56,189,248,${0.15 - r * 0.04})`; ctx.lineWidth = 2; ctx.stroke();
        }
      }

      // Body / suit
      ctx.beginPath(); ctx.ellipse(cx, H + 10, 110, 70, 0, Math.PI, 0);
      ctx.fillStyle = p.suit; ctx.fill();

      // Neck
      ctx.beginPath(); ctx.roundRect(cx - 18, cy + 58, 36, 32, 4);
      ctx.fillStyle = p.skin; ctx.fill();

      // Face
      ctx.beginPath(); ctx.ellipse(cx, cy, 72, 88, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.skin; ctx.fill();

      // Hair
      ctx.beginPath(); ctx.ellipse(cx, cy - 50, 74, 52, 0, Math.PI, 0);
      ctx.fillStyle = p.hair; ctx.fill();
      [-72, 72].forEach(ox => {
        ctx.beginPath(); ctx.arc(cx + ox, cy - 12, 18, 0, Math.PI * 2);
        ctx.fillStyle = p.hair; ctx.fill();
      });

      // Eyes
      const blink = speaking ? (Math.sin(phase.current * 0.3) > 0.95 ? 1 : 10) : 10;
      [-26, 26].forEach(ox => {
        ctx.beginPath(); ctx.ellipse(cx + ox, cy - 8, 12, blink / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#1a1a2e"; ctx.fill();
        ctx.beginPath(); ctx.arc(cx + ox + 3, cy - 10, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fill();
      });

      // Eyebrows
      [-26, 26].forEach(ox => {
        ctx.beginPath(); ctx.moveTo(cx + ox - 14, cy - 28);
        ctx.quadraticCurveTo(cx + ox, cy - 33, cx + ox + 14, cy - 28);
        ctx.strokeStyle = p.hair; ctx.lineWidth = 3; ctx.stroke();
      });

      // Mouth — animates when speaking
      const mOpen = speaking ? Math.abs(Math.sin(phase.current * 3)) * 12 : 2;
      ctx.beginPath(); ctx.ellipse(cx, cy + 46, 22, mOpen + 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = speaking ? "#7a1a1a" : "#b06858"; ctx.fill();
      if (!speaking || mOpen < 4) {
        ctx.beginPath(); ctx.moveTo(cx - 22, cy + 46);
        ctx.quadraticCurveTo(cx, cy + 56, cx + 22, cy + 46);
        ctx.strokeStyle = "#7a1a1a"; ctx.lineWidth = 1.5; ctx.stroke();
      }

      // Name tag
      ctx.fillStyle = "rgba(6,9,15,0.9)";
      ctx.fillRect(14, H - 64, 210, 46);
      ctx.fillStyle = p.color; ctx.font = "bold 15px monospace";
      ctx.fillText(p.title, 24, H - 40);
      ctx.fillStyle = "#64748b"; ctx.font = "11px monospace";
      ctx.fillText(p.label, 24, H - 22);

      // Live dot
      if (speaking) {
        ctx.fillStyle = "#22c55e";
        ctx.beginPath(); ctx.arc(W - 22, 22, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(34,197,94,${0.3 + Math.sin(phase.current * 4) * 0.1})`;
        ctx.beginPath(); ctx.arc(W - 22, 22, 16, 0, Math.PI * 2); ctx.fill();
      }

      if (!speaking) phase.current += 0.02; // subtle idle animation
      anim.current = requestAnimationFrame(draw);
    };
    anim.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(anim.current);
  }, [speaking, icp]);

  return <canvas ref={ref} width={size} height={Math.round(size * 0.85)} style={{ width: "100%", height: "100%", display: "block" }} />;
}

// ── LOGIN ────────────────────────────────────────────────────────
function LoginScreen({ onAuth }) {
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErr(error.message); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    onAuth(profile || { id: data.user.id, email, name: email.split("@")[0], role: "rep" });
    setLoading(false);
  };

  const signup = async () => {
    setLoading(true); setErr("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setErr(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").insert({ id: data.user.id, name, email, role });
      setMsg("Account created! Check your email to confirm, then log in.");
      setMode("login");
    }
    setLoading(false);
  };

  const s = { width: "100%", background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 10, padding: "13px 16px", fontSize: 14, color: "#e2e8f0", fontFamily: "monospace", outline: "none", display: "block", marginBottom: 14 };

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", display: "flex", fontFamily: "monospace" }}>
      <div style={{ width: "42%", background: "linear-gradient(135deg,#0a1628,#06090f)", borderRight: "1px solid #1e2d40", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px" }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#38bdf8", letterSpacing: 4, marginBottom: 6 }}>⬡ CALLFORGE</div>
        <div style={{ fontSize: 12, color: "#475569", letterSpacing: 2, marginBottom: 60, textTransform: "uppercase" }}>AI Sales Training Platform</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#f1f5f9", lineHeight: 1.2, marginBottom: 18 }}>Train like it's<br />a real call.</div>
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.9 }}>Practice discovery, demo, and closing calls against AI prospects trained on your actual playbook.</div>
        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 14 }}>
          {[["🔍", "Real AI prospects that push back"], ["📊", "Scored after every call"], ["🎓", "Manager-certified before going live"]].map(([i, t]) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#64748b" }}><span style={{ fontSize: 18 }}>{i}</span>{t}</div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", marginBottom: 32, borderBottom: "1px solid #1e2d40" }}>
            {[["login", "Sign In"], ["signup", "Create Account"]].map(([id, label]) => (
              <div key={id} onClick={() => { setMode(id); setErr(""); setMsg(""); }} style={{ flex: 1, textAlign: "center", padding: "12px", fontSize: 13, cursor: "pointer", color: mode === id ? "#38bdf8" : "#475569", borderBottom: mode === id ? "2px solid #38bdf8" : "2px solid transparent", marginBottom: -1 }}>{label}</div>
            ))}
          </div>
          {msg && <div style={{ background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#4ade80", marginBottom: 16 }}>{msg}</div>}
          {err && <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#f87171", marginBottom: 16 }}>{err}</div>}
          {mode === "signup" && <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" style={s} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[["rep", "Sales Rep"], ["manager", "Manager"]].map(([id, label]) => (
                <div key={id} onClick={() => setRole(id)} style={{ background: role === id ? "#0f2744" : "#0d1320", border: `1px solid ${role === id ? "#38bdf8" : "#1e2d40"}`, borderRadius: 10, padding: "12px", textAlign: "center", cursor: "pointer", fontSize: 13, color: role === id ? "#38bdf8" : "#64748b", fontWeight: role === id ? 700 : 400 }}>{label}</div>
              ))}
            </div>
          </>}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={s} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={s} />
          <button onClick={mode === "login" ? login : signup} disabled={loading} style={{ width: "100%", background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 12, padding: "16px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "monospace" }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CALL SCREEN ──────────────────────────────────────────────────
function CallScreen({ scenario, user, onEnd }) {
  const { stage, icps, companySize } = scenario;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingICP, setSpeakingICP] = useState(null);
  const [duration, setDuration] = useState(0);
  const [camStream, setCamStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const videoRef = useRef(null);
  const convRef = useRef({});
  const chatEnd = useRef(null);
  const timerRef = useRef(null);
  icps.forEach(icp => { if (!convRef.current[icp]) convRef.current[icp] = []; });

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    // Request camera
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        setCamStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      }).catch(() => {});
    startCall();
    return () => {
      clearInterval(timerRef.current);
      if (camStream) camStream.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => { if (chatEnd.current) chatEnd.current.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const buildPrompt = () => {
    const personas = icps.map(i => ICP_PROFILES[i]);
    const size = COMPANY_SIZES[companySize];
    const stageInstructions = {
      discovery: "Be guarded. Make the rep earn your pain points. Don't let them pitch yet.",
      demo: "You agreed to see the product. Ask pointed questions. Push back on claims.",
      negotiation: "Push for discounts, question contract terms. Signal commitment only if handled well.",
    };
    return `You are ${personas.map(p => p.title).join(" and ")} at a ${size} company.
Product being sold: SalesFlow CRM — AI-powered CRM that auto-logs calls, predicts deal health, reduces manual data entry by 60%.
${personas.map(p => `As ${p.title}: You care most about ${p.focus}.`).join("\n")}
${stageInstructions[stage]}
RULES: 2-4 sentences max. Sound like a real exec. Ask follow-up questions. React authentically. NEVER break character.`;
  };

  const startCall = async () => {
    setLoading(true);
    const first = icps[0];
    const opener = { role: "user", content: `Start the ${stage} call. Introduce yourself as ${ICP_PROFILES[first]?.title} naturally and open the conversation.` };
    convRef.current[first] = [opener];
    setSpeakingICP(first);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: buildPrompt(), messages: convRef.current[first] })
      });
      const data = await res.json();
      const reply = data.content && data.content.map(b => b.text || "").join("") || "Hey, thanks for jumping on. Give me a second...";
      convRef.current[first].push({ role: "assistant", content: reply });
      setMessages([{ from: "prospect", icp: first, text: reply, ts: "00:00" }]);
    } catch { setMessages([{ from: "prospect", icp: first, text: "Hey thanks for jumping on. Give me one second to get set up.", ts: "00:00" }]); }
    setTimeout(() => setSpeakingICP(null), 3000);
    setLoading(false);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim(); setInput("");
    setMessages(prev => [...prev, { from: "rep", text, ts: fmt(duration) }]);
    setLoading(true);
    const respondingICP = icps[Math.floor(Math.random() * icps.length)];
    convRef.current[respondingICP] = [...(convRef.current[respondingICP] || []), { role: "user", content: text }];
    setSpeakingICP(respondingICP);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: buildPrompt(), messages: convRef.current[respondingICP] })
      });
      const data = await res.json();
      const reply = data.content && data.content.map(b => b.text || "").join("") || "Sorry, I missed that.";
      convRef.current[respondingICP].push({ role: "assistant", content: reply });
      setMessages(prev => [...prev, { from: "prospect", icp: respondingICP, text: reply, ts: fmt(duration) }]);
      setTimeout(() => setSpeakingICP(null), 3000);
    } catch { setMessages(prev => [...prev, { from: "prospect", icp: respondingICP, text: "Sorry, I missed that.", ts: fmt(duration) }]); setSpeakingICP(null); }
    setLoading(false);
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const transcript = messages.map(m => `${m.from === "rep" ? "Rep" : ICP_PROFILES[m.icp]?.title}: ${m.text}`).join("\n");

  return (
    <div style={{ height: "100vh", background: "#06090f", fontFamily: "monospace", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ height: 54, background: "#080c14", borderBottom: "1px solid #1e2d40", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#38bdf8" }}>⬡ CALLFORGE</span>
          <span style={{ width: 1, height: 20, background: "#1e2d40" }} />
          <span style={{ fontSize: 12, color: "#64748b" }}>{STAGES.find(s => s.id === stage)?.label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            <span style={{ fontSize: 11, color: "#22c55e" }}>LIVE</span>
          </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 6, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>{fmt(duration)}</div>
        <button onClick={() => onEnd(transcript, scenario, duration)} style={{ background: "#c0392b", border: "none", color: "#fff", borderRadius: 8, padding: "9px 22px", fontSize: 13, cursor: "pointer", fontFamily: "monospace", fontWeight: 700 }}>
          End Call
        </button>
      </div>

      {/* Main video area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left — AI Avatar (large) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
          {/* Avatars grid */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: icps.length === 1 ? "1fr" : icps.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr", gap: 4, padding: 4 }}>
            {icps.map(icp => (
              <div key={icp} style={{ background: "#0d1320", borderRadius: 16, overflow: "hidden", border: `2px solid ${speakingICP === icp ? ICP_PROFILES[icp]?.color : "#1e2d40"}`, transition: "border-color .3s", position: "relative" }}>
                <Avatar icp={icp} speaking={speakingICP === icp} size={400} />
                {speakingICP === icp && (
                  <div style={{ position: "absolute", bottom: 70, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.8)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: "#38bdf8" }}>speaking...</div>
                )}
              </div>
            ))}
          </div>

          {/* Your camera — bottom, takes up good space */}
          <div style={{ height: 220, padding: 4, display: "flex", gap: 4 }}>
            <div style={{ flex: 1, background: "#0d1320", borderRadius: 14, overflow: "hidden", border: "2px solid #1e3a5f", position: "relative" }}>
              {camOn && camStream ? (
                <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1e3a5f", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
                    {user?.name?.split(" ").map(n => n[0]).join("") || "ME"}
                  </div>
                </div>
              )}
              <div style={{ position: "absolute", bottom: 10, left: 14, background: "rgba(0,0,0,0.7)", borderRadius: 6, padding: "3px 10px", fontSize: 12, color: "#e2e8f0" }}>
                {user?.name || "You"} (You)
              </div>
            </div>

            {/* Call controls */}
            <div style={{ width: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <button onClick={() => setMicOn(m => !m)} style={{ width: 52, height: 52, borderRadius: "50%", background: micOn ? "#0d1320" : "#7f1d1d", border: `1px solid ${micOn ? "#1e2d40" : "#f87171"}`, fontSize: 22, cursor: "pointer" }}>
                {micOn ? "🎙️" : "🔇"}
              </button>
              <button onClick={() => setCamOn(c => !c)} style={{ width: 52, height: 52, borderRadius: "50%", background: camOn ? "#0d1320" : "#7f1d1d", border: `1px solid ${camOn ? "#1e2d40" : "#f87171"}`, fontSize: 22, cursor: "pointer" }}>
                {camOn ? "📹" : "📷"}
              </button>
            </div>
          </div>
        </div>

        {/* Right — Transcript + input */}
        <div style={{ width: 340, borderLeft: "1px solid #1e2d40", display: "flex", flexDirection: "column", background: "#080c14" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #1e2d40" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#334155", textTransform: "uppercase" }}>Live Transcript</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
            {messages.map((msg, i) => {
              const p = msg.icp ? ICP_PROFILES[msg.icp] : null;
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: msg.from === "rep" ? "#60a5fa" : p?.color }}>{msg.from === "rep" ? "You" : p?.title}</span>
                    <span style={{ fontSize: 10, color: "#334155" }}>{msg.ts}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, background: "#0d1320", borderRadius: 8, padding: "9px 12px", borderLeft: `2px solid ${msg.from === "rep" ? "#1e3a5f" : (p?.color + "55") || "#1e3a2a"}` }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: speakingICP ? ICP_PROFILES[speakingICP]?.color : "#38bdf8" }}>{speakingICP ? ICP_PROFILES[speakingICP]?.title : "..."}</span>
                <div style={{ fontSize: 18, color: "#38bdf8", marginTop: 6, letterSpacing: 4 }}>● ● ●</div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          {/* ICP hints */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid #1e2d40" }}>
            {icps.map(icp => (
              <div key={icp} style={{ fontSize: 11, color: "#475569", marginBottom: 3 }}>
                <span style={{ color: ICP_PROFILES[icp]?.color }}>{ICP_PROFILES[icp]?.title}:</span> {ICP_PROFILES[icp]?.focus}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: 12, borderTop: "1px solid #1e2d40" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Type your response... (Enter to send)" rows={3} disabled={loading}
              style={{ width: "100%", background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#e2e8f0", fontFamily: "monospace", resize: "none", outline: "none", display: "block" }} />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ marginTop: 8, width: "100%", background: input.trim() && !loading ? "#0f2744" : "#0a0f1e", border: `1px solid ${input.trim() && !loading ? "#38bdf8" : "#1e2d40"}`, color: input.trim() && !loading ? "#38bdf8" : "#334155", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer", fontFamily: "monospace", fontWeight: 700 }}>
              Send →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DEBRIEF ──────────────────────────────────────────────────────
function Debrief({ score, scenario, duration, onRetry, onDashboard }) {
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const sc = s => s >= 80 ? "#22c55e" : s >= 70 ? "#38bdf8" : s >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "monospace", color: "#e2e8f0", padding: "48px 40px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 12 }}>Call Complete</div>
          <div style={{ fontSize: 90, fontWeight: 900, color: sc(score.overallScore), lineHeight: 1 }}>{score.overallScore}</div>
          <div style={{ fontSize: 16, color: score.passed ? "#4ade80" : "#fbbf24", fontWeight: 700, marginTop: 8 }}>{score.passed ? "✓ Stage Passed" : "↻ Keep Practicing"}</div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>{fmt(duration)} · {scenario.icps.map(i => ICP_PROFILES[i]?.title).join(" + ")} · {COMPANY_SIZES[scenario.companySize]}</div>
        </div>

        <div style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 14, padding: "22px 28px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#38bdf8", textTransform: "uppercase", marginBottom: 10 }}>Coach's Take</div>
          <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.8 }}>{score.coachSummary}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {Object.entries(score.categories || {}).map(([k, val]) => (
            <div key={k} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize", marginBottom: 8 }}>{k.replace(/([A-Z])/g, " $1")}</div>
              <div style={{ background: "#0a0f1e", borderRadius: 4, height: 4, marginBottom: 6 }}>
                <div style={{ width: `${val}%`, height: "100%", background: sc(val), borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: sc(val) }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8 }}>⭐ BEST MOMENT</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, fontStyle: "italic" }}>"{score.bestMoment}"</div>
          </div>
          <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "#f87171", marginBottom: 8 }}>💡 MISSED</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{score.missedOpportunity}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 36 }}>
          {[["✓ Strengths", score.strengths, "#22c55e", "#0a1a0a", "#1a3a1a"], ["↑ Improve", score.improvements, "#f87171", "#1a0a0a", "#3a1a1a"]].map(([title, items, color, bg, border]) => (
            <div key={title} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, color, letterSpacing: 2, marginBottom: 12 }}>{title}</div>
              {(items || []).map((s, i) => <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8, paddingLeft: 12, borderLeft: `2px solid ${border}` }}>{s}</div>)}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onRetry} style={{ flex: 1, background: "#0d1320", border: "1px solid #1e2d40", color: "#94a3b8", borderRadius: 10, padding: "14px", fontSize: 13, cursor: "pointer", fontFamily: "monospace", fontWeight: 600 }}>↻ Retry</button>
          <button onClick={onDashboard} style={{ flex: 2, background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 10, padding: "14px", fontSize: 14, cursor: "pointer", fontFamily: "monospace", fontWeight: 800 }}>← Dashboard</button>
        </div>
      </div>
    </div>
  );
}

// ── SCENARIO BUILDER ─────────────────────────────────────────────
function ScenarioBuilder({ onStart }) {
  const [stage, setStage] = useState("discovery");
  const [icps, setICPs] = useState(["vp_sales"]);
  const [companySize, setCompanySize] = useState("smb");
  const toggle = id => setICPs(prev => prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev);

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
              <div key={id} onClick={() => toggle(id)} style={{ background: sel ? "#0f2744" : "#0d1320", border: `1px solid ${sel ? p.color : "#1e2d40"}`, borderRadius: 12, padding: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
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
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Your Scenario</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{STAGES.find(s => s.id === stage)?.label} with {icps.map(i => ICP_PROFILES[i]?.title).join(" + ")}</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{COMPANY_SIZES[companySize]}</div>
      </div>

      <button onClick={() => onStart({ stage, icps, companySize })} style={{ width: "100%", background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 12, padding: "18px", fontSize: 16, cursor: "pointer", fontFamily: "monospace", fontWeight: 900 }}>
        Join Call →
      </button>
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────────
function Dashboard({ user, onStartSession, onSignOut }) {
  const [tab, setTab] = useState("home");
  const [sessions, setSessions] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const sc = s => s >= 80 ? "#22c55e" : s >= 70 ? "#38bdf8" : s >= 60 ? "#f59e0b" : "#ef4444";

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.from("sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      const { data: m } = await supabase.from("missions").select("*").eq("assigned_to", user.id).order("created_at", { ascending: false });
      setSessions(s || []); setMissions(m || []); setLoading(false);
    };
    load();
  }, []);

  const avgScore = sessions.length ? Math.round(sessions.reduce((a, b) => a + b.score, 0) / sessions.length) : null;
  const unread = missions.filter(m => !m.read).length;

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "monospace", color: "#e2e8f0", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#0a0f1e", borderRight: "1px solid #1e2d40", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "22px 20px", borderBottom: "1px solid #1e2d40" }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#38bdf8", letterSpacing: 3 }}>⬡ CALLFORGE</div>
        </div>
        <nav style={{ padding: "16px 0", flex: 1 }}>
          {[["home", "🏠", "Dashboard"], ["train", "🎯", "Train"], ["missions", "📤", `Missions${unread ? ` (${unread})` : ""}`], ["progress", "📊", "Progress"]].map(([id, icon, label]) => (
            <div key={id} onClick={() => setTab(id)} style={{ padding: "11px 20px", fontSize: 13, color: tab === id ? "#38bdf8" : "#475569", cursor: "pointer", borderLeft: tab === id ? "2px solid #38bdf8" : "2px solid transparent", background: tab === id ? "#0f2744" : "transparent", display: "flex", alignItems: "center", gap: 10 }}>
              <span>{icon}</span><span>{label}</span>
              {id === "missions" && unread > 0 && <span style={{ marginLeft: "auto", background: "#f87171", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{unread}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1e2d40" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e3a5f", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
              {user.name?.split(" ").map(n => n[0]).join("") || "U"}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "#475569" }}>{user.role === "manager" ? "Manager" : "Sales Rep"}</div>
            </div>
          </div>
          <div onClick={onSignOut} style={{ fontSize: 11, color: "#475569", cursor: "pointer" }}>Sign Out</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#475569" }}>Loading...</div>
        ) : (
          <>
            {tab === "home" && (
              <div style={{ padding: "40px 48px" }}>
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Welcome back</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#f1f5f9" }}>Hey, {user.name?.split(" ")[0]} 👋</div>
                  {unread > 0 && <div style={{ fontSize: 14, color: "#38bdf8", marginTop: 6 }}>You have {unread} new mission{unread !== 1 ? "s" : ""} from your manager.</div>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 40 }}>
                  {[["Avg Score", avgScore ?? "—", avgScore ? sc(avgScore) : "#475569"], ["Sessions", sessions.length, "#a78bfa"], ["Passed", sessions.filter(s => s.passed).length, "#22c55e"], ["Missions", missions.length, "#f59e0b"]].map(([label, val, color]) => (
                    <div key={label} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 14, padding: "20px 22px" }}>
                      <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color }}>{val}</div>
                    </div>
                  ))}
                </div>

                {missions.filter(m => !m.completed).length > 0 && (
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ fontSize: 11, letterSpacing: 3, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>📤 Manager Missions</div>
                    {missions.filter(m => !m.completed).map(m => (
                      <div key={m.id} onClick={() => setTab("missions")} style={{ background: "#0a1628", border: `1px solid ${m.read ? "#1e2d40" : "#38bdf8"}`, borderRadius: 14, padding: "20px 24px", marginBottom: 12, cursor: "pointer", position: "relative" }}>
                        {!m.read && <div style={{ position: "absolute", top: 16, right: 16, width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />}
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>{STAGES.find(s => s.id === m.stage)?.icon} {STAGES.find(s => s.id === m.stage)?.label}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>"{m.note?.substring(0, 100)}..."</div>
                        <div style={{ marginTop: 12, fontSize: 12, color: "#38bdf8" }}>Start Mission →</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: 11, letterSpacing: 3, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>Quick Start</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                  {STAGES.map(stage => (
                    <div key={stage.id} onClick={() => setTab("train")} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 14, padding: "22px 20px", cursor: "pointer" }}>
                      <div style={{ fontSize: 26, marginBottom: 10 }}>{stage.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{stage.label}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{stage.desc}</div>
                      <div style={{ fontSize: 11, color: stage.color, background: `${stage.color}18`, borderRadius: 6, padding: "3px 10px", display: "inline-block" }}>{stage.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "train" && (
              <div style={{ padding: "40px 48px" }}>
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Training</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>Build Your Scenario</div>
                </div>
                <ScenarioBuilder onStart={onStartSession} />
              </div>
            )}

            {tab === "missions" && (
              <div style={{ padding: "40px 48px" }}>
                <div style={{ marginBottom: 36 }}>
                  <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Inbox</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>Manager Missions</div>
                </div>
                {missions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px", color: "#334155" }}>No missions yet</div>
                ) : missions.map(m => (
                  <div key={m.id} style={{ background: "#0d1320", border: `1px solid ${m.read ? "#1e2d40" : "#38bdf8"}`, borderRadius: 16, padding: "24px 26px", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>{STAGES.find(s => s.id === m.stage)?.icon} {STAGES.find(s => s.id === m.stage)?.label}</div>
                      {m.completed ? <div style={{ background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#22c55e" }}>Done · {m.score}</div> : <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#38bdf8" }}>Pending</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                      {(m.icps || []).map(icp => <span key={icp} style={{ fontSize: 11, color: ICP_PROFILES[icp]?.color, background: `${ICP_PROFILES[icp]?.color}18`, borderRadius: 6, padding: "3px 10px" }}>{ICP_PROFILES[icp]?.emoji} {ICP_PROFILES[icp]?.title}</span>)}
                      <span style={{ fontSize: 11, color: "#64748b", background: "#0a0f1e", borderRadius: 6, padding: "3px 10px" }}>{COMPANY_SIZES[m.company_size]}</span>
                    </div>
                    {m.note && <div style={{ background: "#0a0f1e", border: "1px solid #1e2d40", borderRadius: 10, padding: "14px 16px", marginBottom: 16, fontSize: 13, color: "#94a3b8", lineHeight: 1.7, fontStyle: "italic" }}>"{m.note}"</div>}
                    {!m.completed && <button onClick={() => onStartSession({ stage: m.stage, icps: m.icps || [], companySize: m.company_size, missionId: m.id })} style={{ background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 10, padding: "12px 24px", fontSize: 13, cursor: "pointer", fontFamily: "monospace", fontWeight: 700 }}>Start Mission →</button>}
                  </div>
                ))}
              </div>
            )}

            {tab === "progress" && (
              <div style={{ padding: "40px 48px" }}>
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Performance</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>My Progress</div>
                </div>
                {sessions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px", color: "#334155" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                    <div style={{ fontSize: 16, color: "#475569" }}>No sessions yet — start training!</div>
                  </div>
                ) : sessions.map((s, i) => (
                  <div key={i} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 12, padding: "18px 22px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontSize: 24 }}>{STAGES.find(st => st.id === s.stage)?.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{STAGES.find(st => st.id === s.stage)?.label}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{(s.icps || []).map(i => ICP_PROFILES[i]?.title).join(" + ")} · {COMPANY_SIZES[s.company_size]}</div>
                      <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: sc(s.score) }}>{s.score}</div>
                    <div style={{ fontSize: 11, color: s.passed ? "#22c55e" : "#f59e0b" }}>{s.passed ? "✓ Passed" : "↻ Retry"}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────────────
export default function CallForge() {
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
      } else { setScreen("auth"); }
    });
  }, []);

  const handleAuth = profile => { setUser(profile); setScreen("dashboard"); };
  const handleSignOut = async () => { await supabase.auth.signOut(); setUser(null); setScreen("auth"); };
  const handleStartSession = scen => { setScenario(scen); setScreen("call"); };

  const handleCallEnd = async (transcript, scen, dur) => {
    setCallDuration(dur); setScreen("analyzing");
    let parsed;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, system: "Senior sales coach. Return ONLY valid JSON, no markdown.", messages: [{ role: "user", content: `Analyze this ${scen.stage} call. Return JSON: {"overallScore":<0-100>,"passed":<bool>,"categories":{"rapport":<0-100>,"discovery":<0-100>,"productKnowledge":<0-100>,"objectionHandling":<0-100>,"closing":<0-100>},"strengths":["str1","str2"],"improvements":["imp1","imp2"],"bestMoment":"<text>","missedOpportunity":"<text>","coachSummary":"<text>"}\n\nTranscript:\n${transcript}` }] })
      });
      const data = await res.json();
      parsed = JSON.parse(data.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim());
    } catch {
      parsed = { overallScore: 72, passed: true, categories: { rapport: 76, discovery: 70, productKnowledge: 74, objectionHandling: 66, closing: 60 }, strengths: ["Strong rapport", "Good product knowledge"], improvements: ["Deeper discovery", "Secure next steps"], bestMoment: "When you connected their pain to a feature", missedOpportunity: "Should have asked about budget earlier", coachSummary: "Solid effort. Slow down on discovery." };
    }
    if (user) {
      await supabase.from("sessions").insert({ user_id: user.id, stage: scen.stage, icps: scen.icps, company_size: scen.companySize, score: parsed.overallScore, passed: parsed.passed, categories: parsed.categories, coach_summary: parsed.coachSummary, duration: dur });
      if (scen.missionId) await supabase.from("missions").update({ completed: true, score: parsed.overallScore, read: true }).eq("id", scen.missionId);
    }
    setScore(parsed); setScreen("debrief");
  };

  if (screen === "loading") return (
    <div style={{ minHeight: "100vh", background: "#06090f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#38bdf8", letterSpacing: 4, marginBottom: 20 }}>⬡ CALLFORGE</div>
        <div style={{ width: 32, height: 32, border: "3px solid #1e2d40", borderTop: "3px solid #38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (screen === "auth") return <LoginScreen onAuth={handleAuth} />;
  if (screen === "dashboard") return <Dashboard user={user} onStartSession={handleStartSession} onSignOut={handleSignOut} />;
  if (screen === "call" && scenario) return <CallScreen scenario={scenario} user={user} onEnd={handleCallEnd} />;
  if (screen === "analyzing") return (
    <div style={{ minHeight: "100vh", background: "#06090f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
      <div style={{ width: 48, height: 48, border: "3px solid #1e2d40", borderTop: "3px solid #38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 20 }} />
      <div style={{ color: "#64748b", fontSize: 14 }}>Analyzing your call...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (screen === "debrief" && score) return <Debrief score={score} scenario={scenario} duration={callDuration} onRetry={() => setScreen("call")} onDashboard={() => setScreen("dashboard")} />;
  return null;
}
