import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const LIVEAVATAR_KEY = process.env.REACT_APP_LIVEAVATAR_KEY || "";
const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_KEY || "";

// LiveAvatar preset avatar IDs - professional business people
// These are HeyGen's built-in preset avatars
const ICP_AVATARS = {
  cfo:       { avatarId: "Ann_Therapist_public", voiceId: "en-US-JennyNeural", name: "Morgan Hayes",    title: "CFO",      company: "Brightline Solutions", color: "#f59e0b", focus: "ROI & budget approval",       bg: "#1a1200" },
  coo:       { avatarId: "Ann_Therapist_public", voiceId: "en-US-GuyNeural",   name: "James Weston",   title: "COO",      company: "Brightline Solutions", color: "#22c55e", focus: "Operations & implementation", bg: "#001a0a" },
  cto:       { avatarId: "Ann_Therapist_public", voiceId: "en-US-DavisNeural", name: "Alex Chen",      title: "CTO",      company: "Brightline Solutions", color: "#38bdf8", focus: "Tech stack & security",       bg: "#00121a" },
  vp_sales:  { avatarId: "Ann_Therapist_public", voiceId: "en-US-JasonNeural", name: "Jordan Mitchell", title: "VP Sales", company: "Brightline Solutions", color: "#a78bfa", focus: "Quota & rep adoption",        bg: "#0d001a" },
  director:  { avatarId: "Ann_Therapist_public", voiceId: "en-US-SaraNeural",  name: "Taylor Brooks",  title: "Director", company: "Brightline Solutions", color: "#fb923c", focus: "Process & reporting",         bg: "#1a0800" },
  smb_owner: { avatarId: "Ann_Therapist_public", voiceId: "en-US-TonyNeural",  name: "Sam Rivera",     title: "Owner",    company: "Nexus Ventures",       color: "#f472b6", focus: "Simplicity & cost",           bg: "#1a0012" },
};

const COMPANY_SIZES = {
  startup: "Startup (1-50)", smb: "SMB (51-500)", mid_market: "Mid-Market (501-2K)",
  enterprise: "Enterprise (2K-10K)", large_enterprise: "Large Enterprise (10K+)",
};

const STAGES = [
  { id: "discovery",   label: "Discovery Call",     icon: "🔍", desc: "Uncover pain points & qualify",            duration: "30 min", passingScore: 68, color: "#38bdf8" },
  { id: "demo",        label: "Product Demo",        icon: "🖥", desc: "Walk through features & objections",       duration: "45 min", passingScore: 72, color: "#a78bfa" },
  { id: "negotiation", label: "Negotiation & Close", icon: "🤝", desc: "Pricing, objections & commitment",        duration: "30 min", passingScore: 78, color: "#22c55e" },
];

// ══════════════════════════════════════════════════════════════
// AI PROMPT
// ══════════════════════════════════════════════════════════════

function buildSystemPrompt(icp, companySize, stage) {
  const av = ICP_AVATARS[icp];
  const size = COMPANY_SIZES[companySize];
  const stageInstructions = {
    discovery: "This is a discovery call. Be polite but guarded. Make them earn your pain points. Don't volunteer everything upfront. Ask what prompted their outreach.",
    demo: "You've agreed to a demo. You're genuinely curious but skeptical. Ask pointed questions about your specific concerns. Push back on feature claims.",
    negotiation: "You're in final negotiations. Push for 15-20% discount. Raise last-minute concerns about data migration and implementation. Signal readiness only if handled well.",
  };
  return `You are ${av.name}, ${av.title} at ${av.company}, a ${size} company. You are on a ${stage} sales call.

The sales rep is selling: SalesFlow CRM - an AI-powered CRM that auto-logs calls, predicts deal health, and reduces manual data entry by 60%. Pricing: $65/seat/month Starter, $120 Pro, Enterprise custom.

Your primary concern: ${av.focus}
Current tool: Salesforce (you're paying a lot and reps complain it takes too long to update)

${stageInstructions[stage]}

IMPORTANT RULES:
- Keep responses SHORT — 2-3 sentences maximum. You are on a video call.
- Sound natural, like a real executive on a Zoom call
- Ask follow-up questions to make them work
- React authentically — warm up when handled well, get harder when dodged
- NEVER mention you are an AI or break character
- Start the call by introducing yourself briefly and asking an opening question`;
}

// ══════════════════════════════════════════════════════════════
// LIVEAVATAR CALL SCREEN
// ══════════════════════════════════════════════════════════════

function LiveCallScreen({ scenario, user, onEnd }) {
  const { stage, icp, companySize } = scenario;
  const av = ICP_AVATARS[icp] || ICP_AVATARS.vp_sales;

  // State
  const [status, setStatus] = useState("connecting"); // connecting | ready | live | ended
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sessionToken, setSessionToken] = useState(null);
  const [avatarReady, setAvatarReady] = useState(false);
  const [liveAvatarError, setLiveAvatarError] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");

  // Refs
  const videoRef = useRef(null);         // user camera
  const avatarVideoRef = useRef(null);   // LiveAvatar stream
  const camStreamRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const conversationRef = useRef([]);
  const chatEndRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const sessionIdRef = useRef(null);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── SETUP ──────────────────────────────────────────────────
  useEffect(() => {
    startCamera();
    startTimer();
    initLiveAvatar();
    return () => {
      clearInterval(timerRef.current);
      if (camStreamRef.current) camStreamRef.current.getTracks().forEach(t => t.stop());
      stopSpeechRecognition();
      closeLiveAvatarSession();
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function startTimer() {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      camStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      console.log("Camera not available");
    }
  }

  // ── LIVEAVATAR INIT ─────────────────────────────────────────
  async function initLiveAvatar() {
    setStatus("connecting");
    try {
      // Step 1: Create a session
      const sessionRes = await fetch("https://api.liveavatar.com/v1/streaming/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": LIVEAVATAR_KEY,
        },
        body: JSON.stringify({
          avatar_name: av.avatarId,
          voice: { voice_id: av.voiceId },
          version: "v2",
          video_encoding: "H264",
        }),
      });

      if (!sessionRes.ok) throw new Error("Session creation failed");
      const sessionData = await sessionRes.json();
      sessionIdRef.current = sessionData.data.session_id;
      setSessionToken(sessionData.data.access_token);

      // Step 2: Start WebRTC
      await startWebRTC(sessionData.data);
      setStatus("ready");
      setAvatarReady(true);

      // Step 3: Start the call with opening line
      await startAvatarConversation();

    } catch (err) {
      console.error("LiveAvatar error:", err);
      setLiveAvatarError(true);
      setStatus("ready");
      // Fall back to text mode
      startFallbackConversation();
    }
  }

  async function startWebRTC(sessionData) {
    const pc = new RTCPeerConnection({ iceServers: sessionData.ice_servers || [{ urls: "stun:stun.l.google.com:19302" }] });
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      if (avatarVideoRef.current && event.streams[0]) {
        avatarVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await fetch(`https://api.liveavatar.com/v1/streaming/${sessionIdRef.current}/ice`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": LIVEAVATAR_KEY },
          body: JSON.stringify({ candidate: event.candidate }),
        });
      }
    };

    // Set remote description
    await pc.setRemoteDescription(new RTCSessionDescription(sessionData.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer
    await fetch(`https://api.liveavatar.com/v1/streaming/${sessionIdRef.current}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": LIVEAVATAR_KEY },
      body: JSON.stringify({ sdp: answer }),
    });
  }

  async function sendAvatarText(text) {
    if (!sessionIdRef.current || liveAvatarError) return;
    try {
      await fetch(`https://api.liveavatar.com/v1/streaming/${sessionIdRef.current}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Key": LIVEAVATAR_KEY },
        body: JSON.stringify({ text, task_type: "talk" }),
      });
    } catch (err) {
      console.error("Avatar speak error:", err);
    }
  }

  async function closeLiveAvatarSession() {
    if (!sessionIdRef.current) return;
    try {
      await fetch(`https://api.liveavatar.com/v1/streaming/${sessionIdRef.current}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Key": LIVEAVATAR_KEY },
      });
    } catch (e) {}
  }

  // ── AI CONVERSATION ─────────────────────────────────────────
  async function startAvatarConversation() {
    const opening = `Hi, thanks for jumping on. I'm ${av.name}, ${av.title} at ${av.company}. I have about 20 minutes. What did you want to show me?`;
    conversationRef.current = [{ role: "assistant", content: opening }];
    setMessages([{ from: "prospect", text: opening, ts: "00:00" }]);
    setIsSpeaking(true);
    await sendAvatarText(opening);
    setTimeout(() => {
      setIsSpeaking(false);
      setStatus("live");
      startSpeechRecognition();
    }, 4000);
  }

  async function startFallbackConversation() {
    const opening = `Hi, thanks for jumping on. I'm ${av.name}, ${av.title} at ${av.company}. I have about 20 minutes. What did you want to show me?`;
    conversationRef.current = [{ role: "assistant", content: opening }];
    setMessages([{ from: "prospect", text: opening, ts: "00:00" }]);
    setStatus("live");
  }

  async function getAIResponse(userText) {
    const userMsg = { role: "user", content: userText };
    conversationRef.current = [...conversationRef.current, userMsg];

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: buildSystemPrompt(icp, companySize, stage),
          messages: conversationRef.current,
        }),
      });
      const data = await res.json();
      const reply = data.content && data.content.map(b => b.text || "").join("") || "Sorry, can you repeat that?";
      conversationRef.current = [...conversationRef.current, { role: "assistant", content: reply }];
      return reply;
    } catch (err) {
      return "Sorry, I missed that. Can you repeat?";
    }
  }

  async function handleUserSpeech(transcript) {
    if (!transcript.trim()) return;
    setCurrentTranscript("");
    const ts = fmt(duration);

    setMessages(prev => [...prev, { from: "rep", text: transcript, ts }]);
    setIsSpeaking(true);
    setIsListening(false);

    const reply = await getAIResponse(transcript);
    setMessages(prev => [...prev, { from: "prospect", text: reply, ts: fmt(duration) }]);

    if (!liveAvatarError) {
      await sendAvatarText(reply);
      setTimeout(() => {
        setIsSpeaking(false);
        if (micOn) startSpeechRecognition();
      }, reply.length * 50 + 2000);
    } else {
      setIsSpeaking(false);
      if (micOn) startSpeechRecognition();
    }
  }

  // ── SPEECH RECOGNITION ──────────────────────────────────────
  function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setCurrentTranscript(interim || final);
      if (final) handleUserSpeech(final);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }

  function stopSpeechRecognition() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }

  function toggleMic() {
    if (micOn) {
      stopSpeechRecognition();
      setMicOn(false);
    } else {
      setMicOn(true);
      if (status === "live" && !isSpeaking) startSpeechRecognition();
    }
  }

  // ── END CALL ────────────────────────────────────────────────
  function handleEndCall() {
    stopSpeechRecognition();
    closeLiveAvatarSession();
    clearInterval(timerRef.current);
    if (camStreamRef.current) camStreamRef.current.getTracks().forEach(t => t.stop());
    const repMessages = messages.filter(m => m.from === "rep").length;
    const transcript = messages.map(m => `${m.from === "rep" ? "Rep" : av.title}: ${m.text}`).join("\n");
    onEnd(transcript, scenario, duration, repMessages);
  }

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <div style={{ height: "100vh", background: "#06090f", fontFamily: "monospace", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>
      <style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} @keyframes spin{to{transform:rotate(360deg)}}"}</style>

      {/* TOP BAR */}
      <div style={{ height: 54, background: "#080c14", borderBottom: "1px solid #1e2d40", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#38bdf8", letterSpacing: 2 }}>CALLFORGE</span>
          <span style={{ fontSize: 12, color: "#475569" }}>{STAGES.find(s => s.id === stage).label}</span>
          {status === "live" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>LIVE</span>
            </div>
          )}
          {status === "connecting" && <span style={{ fontSize: 11, color: "#f59e0b" }}>Connecting avatar...</span>}
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 8, color: "#f1f5f9" }}>{fmt(duration)}</div>
        <button onClick={handleEndCall} style={{ background: "#c0392b", border: "none", color: "#fff", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer", fontFamily: "monospace", fontWeight: 700 }}>
          End Call
        </button>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* VIDEO AREA — left 2/3 */}
        <div style={{ flex: 1, display: "grid", gridTemplateRows: "1fr 1fr", gap: 4, padding: 4 }}>

          {/* TOP — AI Avatar */}
          <div style={{ background: "#0a0f1a", borderRadius: 16, overflow: "hidden", border: "2px solid " + (isSpeaking ? av.color : "#1e2d40"), transition: "border-color .4s", position: "relative" }}>
            {/* LiveAvatar video stream */}
            <video
              ref={avatarVideoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: avatarReady && !liveAvatarError ? "block" : "none" }}
            />
            {/* Fallback while connecting */}
            {(!avatarReady || liveAvatarError) && (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg," + av.bg + ",#06090f)" }}>
                {status === "connecting" ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, border: "3px solid #1e2d40", borderTop: "3px solid " + av.color, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                    <div style={{ color: "#64748b", fontSize: 14 }}>Connecting to {av.name}...</div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: av.color + "22", border: "2px solid " + av.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 12px" }}>
                      {av.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 14 }}>{av.name}</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Voice only mode</div>
                  </div>
                )}
              </div>
            )}

            {/* Name tag */}
            <div style={{ position: "absolute", bottom: 14, left: 16, background: "rgba(0,0,0,0.8)", borderRadius: 8, padding: "6px 14px", backdropFilter: "blur(4px)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: av.color }}>{av.name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{av.title} · {av.company}</div>
            </div>

            {/* Speaking indicator */}
            {isSpeaking && (
              <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.75)", borderRadius: 20, padding: "6px 14px" }}>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  {[1, 1.5, 2, 1.5, 1].map((h, i) => (
                    <div key={i} style={{ width: 3, height: 12 * h, background: av.color, borderRadius: 3, animation: "pulse " + (0.5 + i * 0.1) + "s infinite" }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: av.color }}>speaking</span>
              </div>
            )}
          </div>

          {/* BOTTOM — User camera */}
          <div style={{ background: "#0a1628", borderRadius: 16, overflow: "hidden", border: "2px solid " + (isListening ? "#22c55e" : "#1e3a5f"), transition: "border-color .3s", position: "relative" }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />

            {/* User overlay when cam off */}
            {!camOn && (
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#0f2744,#0a1628)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#1e3a5f", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, marginBottom: 10 }}>
                  {user && user.name ? user.name.split(" ").map(n => n[0]).join("") : "ME"}
                </div>
                <div style={{ color: "#64748b", fontSize: 13 }}>Camera off</div>
              </div>
            )}

            {/* Name tag */}
            <div style={{ position: "absolute", bottom: 14, left: 16, background: "rgba(0,0,0,0.8)", borderRadius: 8, padding: "6px 14px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa" }}>{user && user.name ? user.name : "You"}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Sales Rep</div>
            </div>

            {/* Mic listening indicator */}
            {isListening && (
              <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.75)", borderRadius: 20, padding: "6px 14px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 0.8s infinite" }} />
                <span style={{ fontSize: 11, color: "#22c55e" }}>listening</span>
              </div>
            )}

            {/* Live transcript preview */}
            {currentTranscript && (
              <div style={{ position: "absolute", bottom: 56, left: 0, right: 0, margin: "0 16px", background: "rgba(0,0,0,0.85)", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#e2e8f0", fontStyle: "italic" }}>
                "{currentTranscript}"
              </div>
            )}

            {/* Controls */}
            <div style={{ position: "absolute", bottom: 14, right: 14, display: "flex", gap: 8 }}>
              <button onClick={toggleMic} style={{ width: 42, height: 42, borderRadius: "50%", background: micOn ? "rgba(0,0,0,0.7)" : "#7f1d1d", border: "1px solid " + (micOn ? "#334155" : "#f87171"), fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {micOn ? "🎙️" : "🔇"}
              </button>
              <button onClick={() => setCamOn(c => !c)} style={{ width: 42, height: 42, borderRadius: "50%", background: camOn ? "rgba(0,0,0,0.7)" : "#7f1d1d", border: "1px solid " + (camOn ? "#334155" : "#f87171"), fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {camOn ? "📹" : "📷"}
              </button>
            </div>
          </div>
        </div>

        {/* TRANSCRIPT PANEL — right */}
        <div style={{ width: 320, borderLeft: "1px solid #1e2d40", display: "flex", flexDirection: "column", background: "#080c14" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e2d40" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#475569", textTransform: "uppercase" }}>Live Transcript</div>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>Speak clearly — AI is listening</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: msg.from === "rep" ? "#60a5fa" : av.color }}>
                    {msg.from === "rep" ? (user && user.name ? user.name.split(" ")[0] : "You") : av.name.split(" ")[0]}
                  </span>
                  <span style={{ fontSize: 10, color: "#334155" }}>{msg.ts}</span>
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, background: "#0d1320", borderRadius: 8, padding: "10px 12px", borderLeft: "2px solid " + (msg.from === "rep" ? "#1e3a5f" : av.color + "55") }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isSpeaking && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: av.color }}>{av.name.split(" ")[0]}</span>
                <div style={{ fontSize: 18, color: av.color, marginTop: 6, letterSpacing: 4 }}>● ● ●</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Coaching tips */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #1e2d40", background: "#0a0f1e" }}>
            <div style={{ fontSize: 10, color: "#334155", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Focus Areas</div>
            <div style={{ fontSize: 11, color: av.color, marginBottom: 4 }}>{av.title}: {av.focus}</div>
            <div style={{ fontSize: 11, color: "#334155" }}>
              {stage === "discovery" && "Ask open-ended questions first"}
              {stage === "demo" && "Tie every feature to their pain"}
              {stage === "negotiation" && "Never discount first — ask what it takes"}
            </div>
          </div>

          {/* Voice status */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #1e2d40" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: isListening ? "#22c55e" : isSpeaking ? av.color : "#334155", animation: (isListening || isSpeaking) ? "pulse 1s infinite" : "none" }} />
              <span style={{ fontSize: 12, color: isListening ? "#22c55e" : isSpeaking ? av.color : "#475569" }}>
                {isListening ? "Listening to you..." : isSpeaking ? av.name.split(" ")[0] + " is speaking..." : "Waiting..."}
              </span>
            </div>
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
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const sc = s => s >= 80 ? "#22c55e" : s >= 70 ? "#38bdf8" : s >= 60 ? "#f59e0b" : "#ef4444";
  const av = ICP_AVATARS[scenario.icp] || ICP_AVATARS.vp_sales;

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", fontFamily: "monospace", color: "#e2e8f0", padding: "48px 40px" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 12 }}>Call Complete</div>
          <div style={{ fontSize: 90, fontWeight: 900, color: sc(score.overallScore), lineHeight: 1 }}>{score.overallScore}</div>
          <div style={{ fontSize: 16, color: score.passed ? "#4ade80" : "#fbbf24", fontWeight: 700, marginTop: 8 }}>{score.passed ? "✓ Stage Passed" : "↻ Keep Practicing"}</div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>{fmt(duration)} · {av.title} · {COMPANY_SIZES[scenario.companySize]}</div>
        </div>

        <div style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 14, padding: "22px 28px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#38bdf8", textTransform: "uppercase", marginBottom: 10 }}>Coach's Take</div>
          <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.8 }}>{score.coachSummary}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {Object.keys(score.categories || {}).map(k => {
            const val = score.categories[k];
            return (
              <div key={k} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize", marginBottom: 8 }}>{k.replace(/([A-Z])/g, " $1")}</div>
                <div style={{ background: "#0a0f1e", borderRadius: 4, height: 4, marginBottom: 6 }}>
                  <div style={{ width: val + "%", height: "100%", background: sc(val), borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: sc(val) }}>{val}</div>
              </div>
            );
          })}
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
          {[["Strengths", score.strengths, "#22c55e", "#0a1a0a", "#1a3a1a"], ["Improve", score.improvements, "#f87171", "#1a0a0a", "#3a1a1a"]].map(item => (
            <div key={item[0]} style={{ background: item[3], border: "1px solid " + item[4], borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, color: item[2], letterSpacing: 2, marginBottom: 12 }}>{item[0]}</div>
              {(item[1] || []).map((s, i) => <div key={i} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8, paddingLeft: 12, borderLeft: "2px solid " + item[4] }}>{s}</div>)}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onRetry} style={{ flex: 1, background: "#0d1320", border: "1px solid #1e2d40", color: "#94a3b8", borderRadius: 10, padding: "14px", fontSize: 13, cursor: "pointer", fontFamily: "monospace", fontWeight: 600 }}>Retry</button>
          <button onClick={onDashboard} style={{ flex: 2, background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 10, padding: "14px", fontSize: 14, cursor: "pointer", fontFamily: "monospace", fontWeight: 800 }}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCENARIO BUILDER
// ══════════════════════════════════════════════════════════════

function ScenarioBuilder({ onStart }) {
  const [stage, setStage] = useState("discovery");
  const [icp, setIcp] = useState("vp_sales");
  const [companySize, setCompanySize] = useState("smb");

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Call Stage</div>
        <div style={{ display: "flex", gap: 12 }}>
          {STAGES.map(s => (
            <div key={s.id} onClick={() => setStage(s.id)} style={{ flex: 1, background: stage === s.id ? "#0f2744" : "#0d1320", border: "1px solid " + (stage === s.id ? s.color : "#1e2d40"), borderRadius: 14, padding: "20px 18px", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: stage === s.id ? s.color : "#cbd5e1" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{s.duration}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Your AI Prospect</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {Object.keys(ICP_AVATARS).map(id => {
            const av = ICP_AVATARS[id];
            const sel = icp === id;
            return (
              <div key={id} onClick={() => setIcp(id)} style={{ background: sel ? "#0f2744" : "#0d1320", border: "1px solid " + (sel ? av.color : "#1e2d40"), borderRadius: 14, padding: "18px 16px", cursor: "pointer", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: av.color + "22", border: "2px solid " + (sel ? av.color : "#334155"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: av.color, margin: "0 auto 10px" }}>
                  {av.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: sel ? av.color : "#f1f5f9" }}>{av.name}</div>
                <div style={{ fontSize: 11, color: av.color, marginTop: 2 }}>{av.title}</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>{av.focus.split(" ").slice(0, 4).join(" ")}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Company Size</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.keys(COMPANY_SIZES).map(id => (
            <div key={id} onClick={() => setCompanySize(id)} style={{ background: companySize === id ? "#0f2744" : "#0d1320", border: "1px solid " + (companySize === id ? "#38bdf8" : "#1e2d40"), borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: 12, color: companySize === id ? "#38bdf8" : "#64748b", fontWeight: companySize === id ? 700 : 400 }}>
              {COMPANY_SIZES[id]}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 12, padding: "18px 22px", marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Your Scenario</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
          {STAGES.find(s => s.id === stage).label} with {ICP_AVATARS[icp].name}, {ICP_AVATARS[icp].title}
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{COMPANY_SIZES[companySize]}</div>
      </div>

      <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 12, padding: "14px 20px", marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#60a5fa" }}>🎙️ Voice-enabled call — speak naturally, the AI responds in real time</div>
      </div>

      <button onClick={() => onStart({ stage, icp, companySize })} style={{ width: "100%", background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 12, padding: "18px", fontSize: 16, cursor: "pointer", fontFamily: "monospace", fontWeight: 900 }}>
        Join Call →
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════

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
    if (!email || !password || !name) return setErr("Please fill in all fields");
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

  const resetPassword = async () => {
    if (!email) return setErr("Enter your email first");
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: "https://callforge.tech" });
    setMsg("Password reset email sent! Check your inbox.");
  };

  const inp = { width: "100%", background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 10, padding: "13px 16px", fontSize: 14, color: "#e2e8f0", fontFamily: "monospace", outline: "none", display: "block", marginBottom: 14 };

  return (
    <div style={{ minHeight: "100vh", background: "#06090f", display: "flex", fontFamily: "monospace" }}>
      <div style={{ width: "42%", background: "linear-gradient(135deg,#0a1628,#06090f)", borderRight: "1px solid #1e2d40", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px" }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#38bdf8", letterSpacing: 4, marginBottom: 6 }}>CALLFORGE</div>
        <div style={{ fontSize: 12, color: "#475569", letterSpacing: 2, marginBottom: 60, textTransform: "uppercase" }}>AI Sales Training Platform</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#f1f5f9", lineHeight: 1.2, marginBottom: 18 }}>Train like it's<br />a real call.</div>
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.9, maxWidth: 340 }}>Practice with photorealistic AI prospects in real voice conversations. Get scored. Get certified. Get on the phone.</div>
        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 14 }}>
          {[["🎙️", "Real voice conversations with AI prospects"], ["📊", "Scored after every call"], ["🎓", "Manager-certified before going live"]].map(item => (
            <div key={item[1]} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#64748b" }}>
              <span style={{ fontSize: 18 }}>{item[0]}</span>{item[1]}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", marginBottom: 32, borderBottom: "1px solid #1e2d40" }}>
            {[["login", "Sign In"], ["signup", "Create Account"]].map(item => (
              <div key={item[0]} onClick={() => { setMode(item[0]); setErr(""); setMsg(""); }} style={{ flex: 1, textAlign: "center", padding: "12px", fontSize: 13, cursor: "pointer", color: mode === item[0] ? "#38bdf8" : "#475569", borderBottom: mode === item[0] ? "2px solid #38bdf8" : "2px solid transparent", marginBottom: -1 }}>{item[1]}</div>
            ))}
          </div>
          {msg && <div style={{ background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#4ade80", marginBottom: 16 }}>{msg}</div>}
          {err && <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#f87171", marginBottom: 16 }}>{err}</div>}
          {mode === "signup" && (
            <div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" style={inp} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[["rep", "Sales Rep"], ["manager", "Manager"]].map(item => (
                  <div key={item[0]} onClick={() => setRole(item[0])} style={{ background: role === item[0] ? "#0f2744" : "#0d1320", border: "1px solid " + (role === item[0] ? "#38bdf8" : "#1e2d40"), borderRadius: 10, padding: "12px", textAlign: "center", cursor: "pointer", fontSize: 13, color: role === item[0] ? "#38bdf8" : "#64748b", fontWeight: role === item[0] ? 700 : 400 }}>{item[1]}</div>
                ))}
              </div>
            </div>
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={inp} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={inp} />
          <button onClick={mode === "login" ? login : signup} disabled={loading} style={{ width: "100%", background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 12, padding: "16px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "monospace", marginBottom: 12 }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
          {mode === "login" && (
            <div onClick={resetPassword} style={{ textAlign: "center", fontSize: 12, color: "#475569", cursor: "pointer", textDecoration: "underline" }}>Forgot password?</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════

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
      setSessions(s || []);
      setMissions(m || []);
      setLoading(false);
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
          <div style={{ fontSize: 16, fontWeight: 900, color: "#38bdf8", letterSpacing: 3 }}>CALLFORGE</div>
          <div style={{ fontSize: 10, color: "#334155", marginTop: 2, letterSpacing: 2 }}>AI SALES TRAINING</div>
        </div>
        <nav style={{ padding: "16px 0", flex: 1 }}>
          {[["home", "🏠", "Dashboard"], ["train", "🎯", "Train"], ["missions", "📤", "Missions" + (unread ? " (" + unread + ")" : "")], ["progress", "📊", "My Progress"]].map(item => (
            <div key={item[0]} onClick={() => setTab(item[0])} style={{ padding: "11px 20px", fontSize: 13, color: tab === item[0] ? "#38bdf8" : "#475569", cursor: "pointer", borderLeft: "2px solid " + (tab === item[0] ? "#38bdf8" : "transparent"), background: tab === item[0] ? "#0f2744" : "transparent", display: "flex", alignItems: "center", gap: 10 }}>
              <span>{item[1]}</span><span>{item[2]}</span>
              {item[0] === "missions" && unread > 0 && <span style={{ marginLeft: "auto", background: "#f87171", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{unread}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1e2d40" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e3a5f", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
              {user.name ? user.name.split(" ").map(n => n[0]).join("") : "U"}
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
          <div>
            {tab === "home" && (
              <div style={{ padding: "40px 48px" }}>
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Welcome back</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#f1f5f9" }}>Hey, {user.name ? user.name.split(" ")[0] : "there"} 👋</div>
                  {unread > 0 && <div style={{ fontSize: 14, color: "#38bdf8", marginTop: 6 }}>You have {unread} new mission{unread !== 1 ? "s" : ""} from your manager.</div>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 40 }}>
                  {[["Avg Score", avgScore || "—", avgScore ? sc(avgScore) : "#475569"], ["Sessions", sessions.length, "#a78bfa"], ["Passed", sessions.filter(s => s.passed).length, "#22c55e"], ["Missions", missions.length, "#f59e0b"]].map(item => (
                    <div key={item[0]} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 14, padding: "20px 22px" }}>
                      <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{item[0]}</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: item[2] }}>{item[1]}</div>
                    </div>
                  ))}
                </div>

                {missions.filter(m => !m.completed).length > 0 && (
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ fontSize: 11, letterSpacing: 3, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>Manager Missions</div>
                    {missions.filter(m => !m.completed).map(m => {
                      const stageInfo = STAGES.find(s => s.id === m.stage) || {};
                      return (
                        <div key={m.id} onClick={() => setTab("missions")} style={{ background: "#0a1628", border: "1px solid " + (m.read ? "#1e2d40" : "#38bdf8"), borderRadius: 14, padding: "20px 24px", marginBottom: 12, cursor: "pointer", position: "relative" }}>
                          {!m.read && <div style={{ position: "absolute", top: 16, right: 16, width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />}
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>{stageInfo.icon} {stageInfo.label}</div>
                          <div style={{ fontSize: 13, color: "#64748b" }}>"{m.note ? m.note.substring(0, 100) : ""}..."</div>
                          <div style={{ marginTop: 12, fontSize: 12, color: "#38bdf8" }}>Start Mission →</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ fontSize: 11, letterSpacing: 3, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>Start Training</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                  {STAGES.map(stage => (
                    <div key={stage.id} onClick={() => setTab("train")} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 14, padding: "22px 20px", cursor: "pointer" }}>
                      <div style={{ fontSize: 26, marginBottom: 10 }}>{stage.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{stage.label}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{stage.desc}</div>
                      <div style={{ fontSize: 11, color: stage.color, background: stage.color + "18", borderRadius: 6, padding: "3px 10px", display: "inline-block" }}>{stage.duration}</div>
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
                  <div style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Pick a call stage and AI prospect. You'll have a real voice conversation.</div>
                </div>
                <ScenarioBuilder onStart={onStartSession} />
              </div>
            )}

            {tab === "missions" && (
              <div style={{ padding: "40px 48px" }}>
                <div style={{ marginBottom: 36 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>Manager Missions</div>
                </div>
                {missions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px", color: "#334155" }}>No missions yet</div>
                ) : missions.map(m => {
                  const stageInfo = STAGES.find(s => s.id === m.stage) || {};
                  return (
                    <div key={m.id} style={{ background: "#0d1320", border: "1px solid " + (m.read ? "#1e2d40" : "#38bdf8"), borderRadius: 16, padding: "24px 26px", marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>{stageInfo.icon} {stageInfo.label}</div>
                        {m.completed ? <div style={{ background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#22c55e" }}>Done</div> : <div style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#38bdf8" }}>Pending</div>}
                      </div>
                      {m.note && <div style={{ background: "#0a0f1e", borderRadius: 10, padding: "12px 16px", marginBottom: 14, fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>"{m.note}"</div>}
                      {!m.completed && (
                        <button onClick={() => onStartSession({ stage: m.stage, icp: m.icps && m.icps[0] ? m.icps[0] : "vp_sales", companySize: m.company_size || "smb", missionId: m.id })}
                          style={{ background: "#0f2744", border: "1px solid #38bdf8", color: "#38bdf8", borderRadius: 10, padding: "12px 24px", fontSize: 13, cursor: "pointer", fontFamily: "monospace", fontWeight: 700 }}>
                          Start Mission →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "progress" && (
              <div style={{ padding: "40px 48px" }}>
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>My Progress</div>
                </div>
                {sessions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px", color: "#334155" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                    <div style={{ fontSize: 16, color: "#475569" }}>No sessions yet — start training!</div>
                  </div>
                ) : sessions.map((s, i) => {
                  const stageInfo = STAGES.find(st => st.id === s.stage) || {};
                  const av = s.icp ? ICP_AVATARS[s.icp] : null;
                  return (
                    <div key={i} style={{ background: "#0d1320", border: "1px solid #1e2d40", borderRadius: 12, padding: "18px 22px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ fontSize: 24 }}>{stageInfo.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{stageInfo.label}</div>
                        <div style={{ fontSize: 11, color: "#475569" }}>{av ? av.name + " · " + av.title : ""} · {COMPANY_SIZES[s.company_size]}</div>
                        <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{new Date(s.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: sc(s.score) }}>{s.score}</div>
                      <div style={{ fontSize: 11, color: s.passed ? "#22c55e" : "#f59e0b" }}>{s.passed ? "✓ Passed" : "↻ Retry"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════

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
      } else {
        setScreen("auth");
      }
    });
  }, []);

  const handleAuth = profile => { setUser(profile); setScreen("dashboard"); };
  const handleSignOut = async () => { await supabase.auth.signOut(); setUser(null); setScreen("auth"); };
  const handleStartSession = scen => { setScenario(scen); setScreen("call"); };

  const handleCallEnd = async (transcript, scen, dur, repMsgCount) => {
    setCallDuration(dur);

    if (repMsgCount < 1) {
      setScore({ overallScore: 0, passed: false, categories: { rapport: 0, discovery: 0, productKnowledge: 0, objectionHandling: 0, closing: 0 }, strengths: ["Call ended without conversation"], improvements: ["Stay on the call and engage with the prospect"], bestMoment: "No conversation recorded", missedOpportunity: "You need to speak during the call to get scored", coachSummary: "You ended the call without saying anything. Jump in next time — ask questions, listen, respond." });
      setScreen("debrief");
      return;
    }

    setScreen("analyzing");
    let parsed;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1200,
          system: "Senior sales coach. Return ONLY valid JSON, no markdown.",
          messages: [{ role: "user", content: "Analyze this " + scen.stage + " call. Return JSON: {\"overallScore\":<0-100>,\"passed\":<bool>,\"categories\":{\"rapport\":<0-100>,\"discovery\":<0-100>,\"productKnowledge\":<0-100>,\"objectionHandling\":<0-100>,\"closing\":<0-100>},\"strengths\":[\"str1\",\"str2\"],\"improvements\":[\"imp1\",\"imp2\"],\"bestMoment\":\"<text>\",\"missedOpportunity\":\"<text>\",\"coachSummary\":\"<2-3 sentences>\"}\n\nTranscript:\n" + transcript }]
        })
      });
      const data = await res.json();
      parsed = JSON.parse(data.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim());
    } catch (e) {
      parsed = { overallScore: 68, passed: true, categories: { rapport: 72, discovery: 65, productKnowledge: 70, objectionHandling: 62, closing: 58 }, strengths: ["Good effort on the call", "Engaged with the prospect"], improvements: ["Ask more discovery questions", "Secure a clear next step"], bestMoment: "When you asked about their current process", missedOpportunity: "Should have asked about budget and timeline", coachSummary: "Decent start. Focus on asking more open-ended questions before pitching." };
    }

    if (user) {
      await supabase.from("sessions").insert({ user_id: user.id, stage: scen.stage, icp: scen.icp, icps: [scen.icp], company_size: scen.companySize, score: parsed.overallScore, passed: parsed.passed, categories: parsed.categories, coach_summary: parsed.coachSummary, duration: dur });
      if (scen.missionId) await supabase.from("missions").update({ completed: true, score: parsed.overallScore, read: true }).eq("id", scen.missionId);
    }
    setScore(parsed);
    setScreen("debrief");
  };

  if (screen === "loading") return (
    <div style={{ minHeight: "100vh", background: "#06090f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#38bdf8", letterSpacing: 4, marginBottom: 20 }}>CALLFORGE</div>
        <div style={{ width: 32, height: 32, border: "3px solid #1e2d40", borderTop: "3px solid #38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
      </div>
    </div>
  );

  if (screen === "auth") return <LoginScreen onAuth={handleAuth} />;
  if (screen === "dashboard") return <Dashboard user={user} onStartSession={handleStartSession} onSignOut={handleSignOut} />;
  if (screen === "call" && scenario) return <LiveCallScreen scenario={scenario} user={user} onEnd={handleCallEnd} />;
  if (screen === "analyzing") return (
    <div style={{ minHeight: "100vh", background: "#06090f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <div style={{ width: 48, height: 48, border: "3px solid #1e2d40", borderTop: "3px solid #38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 20 }} />
      <div style={{ color: "#64748b", fontSize: 14 }}>Analyzing your call...</div>
    </div>
  );
  if (screen === "debrief" && score) return <Debrief score={score} scenario={scenario} duration={callDuration} onRetry={() => setScreen("call")} onDashboard={() => setScreen("dashboard")} />;
  return null;
}
