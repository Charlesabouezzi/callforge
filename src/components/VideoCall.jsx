import { useState, useRef, useEffect } from "react";

const ICP_PROFILES = {
  cfo:       { title: "CFO",      label: "Chief Financial Officer",  color: "#f59e0b", suit: "#1e2d40", skin: "#c8855a", hair: "#1a0a0a" },
  coo:       { title: "COO",      label: "Chief Operating Officer",  color: "#22c55e", suit: "#1a2a1e", skin: "#b8754a", hair: "#2a1a0a" },
  cto:       { title: "CTO",      label: "Chief Technology Officer", color: "#38bdf8", suit: "#1a1a3a", skin: "#d4956a", hair: "#3a3a4a" },
  vp_sales:  { title: "VP Sales", label: "VP of Sales",              color: "#a78bfa", suit: "#2a1a3a", skin: "#c0854a", hair: "#0a1a2a" },
  director:  { title: "Director", label: "Director of Revenue Ops",  color: "#fb923c", suit: "#2a1a0a", skin: "#c89060", hair: "#4a2a0a" },
  smb_owner: { title: "Owner",    label: "SMB Founder / CEO",        color: "#f472b6", suit: "#1a3a2a", skin: "#d4a060", hair: "#2a1a1a" },
};

// ── Animated Avatar Canvas ─────────────────────────────────────
function AvatarCanvas({ icp, speaking }) {
  const ref = useRef(null);
  const animRef = useRef(null);
  const phase = useRef(0);
  const profile = ICP_PROFILES[icp] || ICP_PROFILES.vp_sales;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H * 0.42;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0d1520");
      bg.addColorStop(1, "#06090f");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle grid lines
      ctx.strokeStyle = "rgba(56,189,248,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Speaking animation rings
      if (speaking) {
        phase.current += 0.06;
        for (let r = 0; r < 4; r++) {
          const radius = 110 + r * 22 + Math.sin(phase.current + r * 0.8) * 8;
          const alpha = 0.12 - r * 0.025;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Body / suit
      ctx.beginPath();
      ctx.ellipse(cx, H - 30, 130, 90, 0, Math.PI, 0);
      ctx.fillStyle = profile.suit;
      ctx.fill();

      // Shirt collar
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy + 72);
      ctx.lineTo(cx, cy + 82);
      ctx.lineTo(cx + 20, cy + 72);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Neck
      ctx.beginPath();
      ctx.roundRect(cx - 20, cy + 52, 40, 32, 4);
      ctx.fillStyle = profile.skin;
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(cx, cy, 88, 104, 0, 0, Math.PI * 2);
      ctx.fillStyle = profile.skin;
      ctx.fill();

      // Hair top
      ctx.beginPath();
      ctx.ellipse(cx, cy - 60, 90, 58, 0, Math.PI, 0);
      ctx.fillStyle = profile.hair;
      ctx.fill();

      // Side hair
      [-84, 84].forEach(ox => {
        ctx.beginPath();
        ctx.arc(cx + ox, cy - 15, 20, 0, Math.PI * 2);
        ctx.fillStyle = profile.hair;
        ctx.fill();
      });

      // Eyes - blink when speaking
      const eyeH = speaking && Math.sin(phase.current * 0.3) > 0.95 ? 1 : 12;
      [-28, 28].forEach(ox => {
        // Eye white
        ctx.beginPath();
        ctx.ellipse(cx + ox, cy - 10, 14, eyeH / 2 + 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#f8f8f8";
        ctx.fill();
        // Iris
        ctx.beginPath();
        ctx.ellipse(cx + ox, cy - 10, 8, eyeH / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#2a3a5a";
        ctx.fill();
        // Pupil
        ctx.beginPath();
        ctx.arc(cx + ox + 1, cy - 11, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#0a0a1a";
        ctx.fill();
        // Eye shine
        ctx.beginPath();
        ctx.arc(cx + ox + 3, cy - 13, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fill();
      });

      // Eyebrows
      [-28, 28].forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(cx + ox - 16, cy - 32);
        ctx.quadraticCurveTo(cx + ox, cy - 38, cx + ox + 16, cy - 32);
        ctx.strokeStyle = profile.hair;
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.stroke();
      });

      // Nose
      ctx.beginPath();
      ctx.moveTo(cx, cy + 8);
      ctx.quadraticCurveTo(cx + 10, cy + 24, cx + 2, cy + 28);
      ctx.strokeStyle = `rgba(0,0,0,0.15)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Mouth - animate when speaking
      const mouthOpen = speaking ? Math.abs(Math.sin(phase.current * 3.5)) * 14 : 3;
      const mouthWidth = 26;

      if (mouthOpen > 4) {
        // Open mouth
        ctx.beginPath();
        ctx.ellipse(cx, cy + 52, mouthWidth, mouthOpen, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#8B2020";
        ctx.fill();
        // Teeth
        ctx.beginPath();
        ctx.ellipse(cx, cy + 46, mouthWidth - 4, 5, 0, 0, Math.PI);
        ctx.fillStyle = "#f0f0f0";
        ctx.fill();
      } else {
        // Closed mouth / slight smile
        ctx.beginPath();
        ctx.moveTo(cx - mouthWidth, cy + 52);
        ctx.quadraticCurveTo(cx, cy + 60, cx + mouthWidth, cy + 52);
        ctx.strokeStyle = "#8B4a4a";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Ears
      [-88, 88].forEach(ox => {
        ctx.beginPath();
        ctx.ellipse(cx + ox, cy - 5, 12, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = profile.skin;
        ctx.fill();
      });

      // Name badge
      const badgeW = 220, badgeH = 48;
      const badgeX = 16, badgeY = H - badgeH - 16;
      ctx.fillStyle = "rgba(6,9,15,0.9)";
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
      ctx.fill();
      ctx.strokeStyle = profile.color + "88";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = profile.color;
      ctx.font = "bold 15px 'DM Mono', monospace";
      ctx.fillText(profile.title, badgeX + 14, badgeY + 20);
      ctx.fillStyle = "#64748b";
      ctx.font = "11px 'DM Mono', monospace";
      ctx.fillText(profile.label, badgeX + 14, badgeY + 36);

      // Live speaking indicator
      if (speaking) {
        const dotX = W - 24, dotY = 24;
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(34,197,94,${0.3 + Math.sin(phase.current * 5) * 0.15})`;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [speaking, icp]);

  return (
    <canvas
      ref={ref}
      width={600}
      height={480}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

// ── User Camera Feed ───────────────────────────────────────────
function UserCamera({ cameraOn, micOn, userName }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (cameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => {});
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [cameraOn]);

  return (
    <div style={{ width: "100%", height: "100%", background: "#0d1320", borderRadius: 16, overflow: "hidden", position: "relative", border: "1px solid #1e2d40" }}>
      {cameraOn ? (
        <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d1320" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#60a5fa", fontFamily: "monospace" }}>
            {userName?.split(" ").map(n => n[0]).join("") || "U"}
          </div>
          <div style={{ color: "#475569", fontSize: 13, marginTop: 12, fontFamily: "monospace" }}>Camera off</div>
        </div>
      )}
      {/* Name tag */}
      <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(6,9,15,0.88)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#cbd5e1", fontFamily: "monospace", border: "1px solid #1e2d40" }}>
        {userName} (You)
      </div>
      {/* Mic indicator */}
      {!micOn && (
        <div style={{ position: "absolute", top: 12, right: 12, background: "#7f1d1d", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔇</div>
      )}
    </div>
  );
}

// ── Main Video Call Component ──────────────────────────────────
export default function VideoCall({ stage, icps, companySize, onEndCall, userName = "Sales Rep" }) {
  const [callStarted, setCallStarted] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingICP, setSpeakingICP] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const convRef = useRef({});
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  const icp = icps?.[0] || "vp_sales";
  const profile = ICP_PROFILES[icp] || ICP_PROFILES.vp_sales;

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (!callStarted) return;
    timerRef.current = setInterval(() => setCallTime(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [callStarted]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const startCall = async () => {
    setCallStarted(true);
    setLoading(true);
    setSpeakingICP(icp);

    const opener = { role: "user", content: `Start the ${stage} call. Introduce yourself as ${profile.title} naturally and professionally. Keep it to 2-3 sentences.` };
    convRef.current[icp] = [opener];

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: `You are ${profile.title} at a company on a ${stage} sales call. You are realistic, busy, and skeptical but professional. Keep all responses to 2-3 sentences max. Ask one question at a time. React naturally to what the sales rep says.`,
          messages: convRef.current[icp]
        })
      });
      const data = await res.json();
      const reply = data.content.map(b => b.text || "").join("");
      convRef.current[icp].push({ role: "assistant", content: reply });
      setMessages([{ from: "prospect", icp, text: reply, ts: "00:00" }]);
    } catch {
      setMessages([{ from: "prospect", icp, text: `Hi, I'm ${profile.title}. Thanks for jumping on. What did you want to cover today?`, ts: "00:00" }]);
    }

    setSpeakingICP(null);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMessages(prev => [...prev, { from: "rep", text, ts: fmt(callTime) }]);
    setLoading(true);

    convRef.current[icp] = [...(convRef.current[icp] || []), { role: "user", content: text }];
    setSpeakingICP(icp);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: `You are ${profile.title} at a company on a ${stage} sales call. Be realistic, skeptical, and professional. 2-3 sentences max. Push back when appropriate. Ask follow-up questions.`,
          messages: convRef.current[icp]
        })
      });
      const data = await res.json();
      const reply = data.content.map(b => b.text || "").join("");
      convRef.current[icp].push({ role: "assistant", content: reply });
      setMessages(prev => [...prev, { from: "prospect", icp, text: reply, ts: fmt(callTime) }]);
    } catch {
      setMessages(prev => [...prev, { from: "prospect", icp, text: "Sorry, could you repeat that?", ts: fmt(callTime) }]);
    }

    setSpeakingICP(null);
    setLoading(false);
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleEndCall = () => {
    clearInterval(timerRef.current);
    const transcript = messages.map(m => `${m.from === "rep" ? "Rep" : profile.title}: ${m.text}`).join("\n");
    onEndCall(transcript, { stage, icps, companySize }, callTime);
  };

  // ── PRE-CALL LOBBY ──────────────────────────────────────────
  if (!callStarted) {
    return (
      <div style={{ height: "100vh", background: "#06090f", fontFamily: "monospace", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#e2e8f0" }}>
        <div style={{ width: 480, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>⬡ CALLFORGE</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", marginBottom: 6 }}>Ready to join?</div>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 40 }}>
            {stage?.charAt(0).toUpperCase() + stage?.slice(1)} call with {profile.title}
          </div>

          {/* Camera preview */}
          <div style={{ width: "100%", height: 280, borderRadius: 16, overflow: "hidden", marginBottom: 32, border: "1px solid #1e2d40" }}>
            <UserCamera cameraOn={cameraOn} micOn={micOn} userName={userName} />
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 36 }}>
            <button onClick={() => setMicOn(m => !m)} style={{ background: micOn ? "#0d1320" : "#7f1d1d", border: `1px solid ${micOn ? "#1e2d40" : "#ef4444"}`, color: micOn ? "#94a3b8" : "#f87171", borderRadius: 12, padding: "12px 20px", fontSize: 20, cursor: "pointer" }}>
              {micOn ? "🎙️" : "🔇"}
            </button>
            <button onClick={() => setCameraOn(c => !c)} style={{ background: cameraOn ? "#0d1320" : "#7f1d1d", border: `1px solid ${cameraOn ? "#1e2d40" : "#ef4444"}`, color: cameraOn ? "#94a3b8" : "#f87171", borderRadius: 12, padding: "12px 20px", fontSize: 20, cursor: "pointer" }}>
              {cameraOn ? "📹" : "📷"}
            </button>
          </div>

          <button onClick={startCall} style={{ width: "100%", background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 14, padding: "18px", fontSize: 16, fontWeight: 900, cursor: "pointer", fontFamily: "monospace" }}>
            Join Call →
          </button>
        </div>
      </div>
    );
  }

  // ── LIVE CALL ────────────────────────────────────────────────
  return (
    <div style={{ height: "100vh", background: "#06090f", fontFamily: "monospace", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{ height: 56, background: "#0a0f1e", borderBottom: "1px solid #1e2d40", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: "#38bdf8", letterSpacing: 2 }}>⬡ CALLFORGE</span>
          <div style={{ width: 1, height: 20, background: "#1e2d40" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
            <span style={{ fontSize: 13, color: "#64748b" }}>{stage?.charAt(0).toUpperCase() + stage?.slice(1)} Call</span>
          </div>
        </div>

        <div style={{ fontSize: 24, fontWeight: 900, color: "#f1f5f9", letterSpacing: 6, fontVariantNumeric: "tabular-nums" }}>{fmt(callTime)}</div>

        <button onClick={handleEndCall} style={{ background: "#7f1d1d", border: "none", color: "#fff", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "monospace" }}>
          End Call
        </button>
      </div>

      {/* Main call area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: 0 }}>

        {/* LEFT: Video feeds - 65% width */}
        <div style={{ width: "65%", display: "flex", flexDirection: "column", padding: 16, gap: 12 }}>

          {/* AI Avatar - takes up most space */}
          <div style={{ flex: 1, borderRadius: 16, overflow: "hidden", border: `2px solid ${speakingICP ? profile.color : "#1e2d40"}`, transition: "border-color .3s", position: "relative" }}>
            <AvatarCanvas icp={icp} speaking={speakingICP === icp} />
            {loading && (
              <div style={{ position: "absolute", bottom: 70, left: "50%", transform: "translateX(-50%)", background: "rgba(6,9,15,0.9)", borderRadius: 20, padding: "8px 20px", fontSize: 13, color: "#38bdf8", border: "1px solid #1e3a5f" }}>
                ● ● ●
              </div>
            )}
          </div>

          {/* User Camera - proper size at bottom */}
          <div style={{ height: 200, borderRadius: 16, overflow: "hidden" }}>
            <UserCamera cameraOn={cameraOn} micOn={micOn} userName={userName} />
          </div>

          {/* Call controls */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", paddingBottom: 4 }}>
            {[
              [micOn ? "🎙️" : "🔇", () => setMicOn(m => !m), micOn],
              [cameraOn ? "📹" : "📷", () => setCameraOn(c => !c), cameraOn],
            ].map(([icon, fn, on], i) => (
              <button key={i} onClick={fn} style={{ width: 48, height: 48, borderRadius: "50%", background: on ? "#0d1320" : "#7f1d1d", border: `1px solid ${on ? "#1e2d40" : "#ef4444"}`, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Transcript + Input - 35% width */}
        <div style={{ width: "35%", borderLeft: "1px solid #1e2d40", display: "flex", flexDirection: "column", background: "#08080f" }}>

          {/* ICP info */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e2d40", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: profile.color + "22", border: `1px solid ${profile.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: profile.color }}>
              {profile.title[0]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{profile.title}</div>
              <div style={{ fontSize: 11, color: "#475569" }}>{profile.label}</div>
            </div>
            {speakingICP && <div style={{ marginLeft: "auto", fontSize: 11, color: "#22c55e" }}>speaking...</div>}
          </div>

          {/* Transcript */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#334155", textTransform: "uppercase", marginBottom: 14 }}>Transcript</div>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: msg.from === "rep" ? "#60a5fa" : profile.color }}>
                    {msg.from === "rep" ? "You" : profile.title}
                  </span>
                  <span style={{ fontSize: 10, color: "#334155" }}>{msg.ts}</span>
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, background: "#0a0f1e", borderRadius: 10, padding: "10px 12px", borderLeft: `2px solid ${msg.from === "rep" ? "#1e3a5f" : profile.color + "55"}` }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: profile.color, marginBottom: 5 }}>{profile.title}</div>
                <div style={{ fontSize: 14, color: profile.color, background: "#0a0f1e", borderRadius: 10, padding: "10px 12px", letterSpacing: 6 }}>● ● ●</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid #1e2d40" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your response... (Enter to send)"
              rows={3}
              disabled={loading}
              style={{ width: "100%", background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#e2e8f0", fontFamily: "monospace", resize: "none", outline: "none", display: "block" }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ marginTop: 8, width: "100%", background: input.trim() && !loading ? "#0f2744" : "#0a0f1e", border: `1px solid ${input.trim() && !loading ? "#38bdf8" : "#1e2d40"}`, color: input.trim() && !loading ? "#38bdf8" : "#334155", borderRadius: 8, padding: "11px", fontSize: 13, cursor: input.trim() && !loading ? "pointer" : "default", fontFamily: "monospace", fontWeight: 700, transition: "all .2s" }}
            >
              Send →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
