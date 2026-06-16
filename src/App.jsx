import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase";

const ICP = {
  cfo:       { title:"CFO",      label:"Chief Financial Officer",  color:"#f59e0b", emoji:"💼", focus:"ROI & budget" },
  coo:       { title:"COO",      label:"Chief Operating Officer",  color:"#22c55e", emoji:"⚙️", focus:"Operations" },
  cto:       { title:"CTO",      label:"Chief Technology Officer", color:"#38bdf8", emoji:"🔧", focus:"Tech & security" },
  vp_sales:  { title:"VP Sales", label:"VP of Sales",              color:"#a78bfa", emoji:"📈", focus:"Quota & adoption" },
  director:  { title:"Director", label:"Director of Revenue Ops",  color:"#fb923c", emoji:"📊", focus:"Process & data" },
  smb_owner: { title:"Owner",    label:"SMB Founder / CEO",        color:"#f472b6", emoji:"🚀", focus:"Simplicity & cost" },
};

const SIZES = {
  startup:"Startup (1-50)", smb:"SMB (51-500)",
  mid_market:"Mid-Market (501-2K)", enterprise:"Enterprise (2K-10K)",
  large_enterprise:"Large Enterprise (10K+)",
};

const STAGES = [
  { id:"discovery",   label:"Discovery Call",      icon:"🔍", pass:68, dur:"30 min", color:"#38bdf8" },
  { id:"demo",        label:"Product Demo",         icon:"🖥",  pass:72, dur:"45 min", color:"#a78bfa" },
  { id:"negotiation", label:"Negotiation & Close", icon:"🤝", pass:78, dur:"30 min", color:"#22c55e" },
];

const sc = s => s>=80?"#22c55e":s>=70?"#38bdf8":s>=60?"#f59e0b":"#ef4444";

function buildPrompt(stage, icps, size) {
  const names = icps.map(i=>ICP[i]?.title).join(" and ");
  const instructions = {
    discovery:"Be guarded. Make the rep earn your pain points. Don't let them pitch yet. Ask what prompted their outreach.",
    demo:"You agreed to see the product. Ask pointed questions about your specific concerns. Push back on claims.",
    negotiation:"Push for discounts. Question contract terms. Raise last-minute concerns. Signal readiness only if handled well.",
  };
  return `You are ${names} at a ${SIZES[size]} company on a ${stage} sales call.
You are being sold SalesFlow CRM - an AI-powered CRM that auto-logs calls, reduces manual data entry by 60%, and predicts deal health.
Pricing: $65/seat/mo Starter, $120 Pro, Enterprise custom.
${instructions[stage]}
CRITICAL RULES:
- Respond in 2-4 sentences only. Sound like a real busy executive.
- Ask follow-up questions. React authentically - warm up when handled well, get harder when dodged.
- NEVER break character or say you are an AI.
- Reference real concerns a ${SIZES[size]} company would have.`;
}

function scorePrompt(stage, transcript) {
  return `Analyze this ${stage} sales call transcript. Return ONLY valid JSON, no markdown or extra text.
Transcript:
${transcript}
Return exactly this JSON structure:
{"overallScore":75,"passed":true,"categories":{"rapport":80,"discovery":70,"productKnowledge":75,"objectionHandling":65,"closing":60},"strengths":["strength one","strength two"],"improvements":["improvement one","improvement two"],"bestMoment":"describe their best moment","missedOpportunity":"describe what they missed","coachSummary":"2-3 sentence honest assessment"}`;
}

// ─── AVATAR ─────────────────────────────────────────────────
function Avatar({ icp, speaking, size=300 }) {
  const ref = useRef(null);
  const animRef = useRef(null);
  const phase = useRef(0);
  const p = ICP[icp];
  const skinTones = { cfo:"#c8855a", coo:"#b8754a", cto:"#d4956a", vp_sales:"#c0854a", director:"#c89060", smb_owner:"#d4a060" };
  const hairColors = { cfo:"#1a0a0a", coo:"#2a1a0a", cto:"#3a3a4a", vp_sales:"#0a1a2a", director:"#4a2a0a", smb_owner:"#2a1a1a" };
  const suitColors = { cfo:"#1e2d40", coo:"#1a2a1e", cto:"#1a1a3a", vp_sales:"#2a1a3a", director:"#2a1a0a", smb_owner:"#1a3a2a" };
  const skin = skinTones[icp]||"#c8855a";
  const hair = hairColors[icp]||"#1a0a0a";
  const suit = suitColors[icp]||"#1e2d40";

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2-10;

    const draw = () => {
      ctx.clearRect(0,0,W,H);
      const bg = ctx.createRadialGradient(cx,cy,10,cx,cy,W*.6);
      bg.addColorStop(0,"#0d1929"); bg.addColorStop(1,"#06090f");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      // grid
      ctx.strokeStyle="rgba(56,189,248,0.04)"; ctx.lineWidth=1;
      for(let x=0;x<W;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=0;y<H;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

      if(speaking){
        phase.current+=0.08;
        for(let r=0;r<4;r++){
          const rad=88+r*20+Math.sin(phase.current+r)*7;
          ctx.beginPath(); ctx.arc(cx,cy-8,rad,0,Math.PI*2);
          ctx.strokeStyle=`rgba(56,189,248,${.12-r*.025})`; ctx.lineWidth=1.5; ctx.stroke();
        }
      }

      // shoulders
      ctx.beginPath(); ctx.ellipse(cx,H-5,90,60,0,Math.PI,0); ctx.fillStyle=suit; ctx.fill();
      // neck
      ctx.beginPath(); ctx.roundRect(cx-16,cy+50,32,30,3); ctx.fillStyle=skin; ctx.fill();
      // face
      ctx.beginPath(); ctx.ellipse(cx,cy,64,76,0,0,Math.PI*2); ctx.fillStyle=skin; ctx.fill();
      // hair top
      ctx.beginPath(); ctx.ellipse(cx,cy-44,66,46,0,Math.PI,0); ctx.fillStyle=hair; ctx.fill();
      // hair sides
      [-62,62].forEach(ox=>{ctx.beginPath();ctx.arc(cx+ox,cy-8,16,0,Math.PI*2);ctx.fillStyle=hair;ctx.fill();});

      // eyes
      const blink = speaking?(Math.sin(phase.current*.3)>.97?1:10):10;
      [-23,23].forEach(ox=>{
        ctx.beginPath(); ctx.ellipse(cx+ox,cy-7,10,blink/2,0,0,Math.PI*2); ctx.fillStyle="#1a1a2e"; ctx.fill();
        ctx.beginPath(); ctx.arc(cx+ox+2,cy-8,3,0,Math.PI*2); ctx.fillStyle="rgba(255,255,255,.55)"; ctx.fill();
      });
      // brows
      [-23,23].forEach(ox=>{
        ctx.beginPath(); ctx.moveTo(cx+ox-12,cy-26); ctx.quadraticCurveTo(cx+ox,cy-30,cx+ox+12,cy-26);
        ctx.strokeStyle=hair; ctx.lineWidth=2.5; ctx.stroke();
      });
      // mouth
      const mOpen = speaking?Math.abs(Math.sin(phase.current*3.5))*10:2;
      ctx.beginPath(); ctx.ellipse(cx,cy+40,19,mOpen+2,0,0,Math.PI*2);
      ctx.fillStyle=speaking?"#8B1a1a":"#b06858"; ctx.fill();
      if(mOpen<3){
        ctx.beginPath(); ctx.moveTo(cx-19,cy+40); ctx.quadraticCurveTo(cx,cy+48,cx+19,cy+40);
        ctx.strokeStyle="#8B1a1a"; ctx.lineWidth=1.5; ctx.stroke();
      }

      // name badge
      ctx.fillStyle="rgba(6,9,15,.9)";
      ctx.beginPath(); ctx.roundRect(10,H-58,200,42,6); ctx.fill();
      ctx.fillStyle=p?.color||"#38bdf8"; ctx.font="bold 13px monospace"; ctx.fillText(p?.title||"",22,H-38);
      ctx.fillStyle="#64748b"; ctx.font="10px monospace"; ctx.fillText(p?.label||"",22,H-20);

      // speaking dot
      if(speaking){
        const pulse = .3+Math.sin(phase.current*4)*.15;
        ctx.fillStyle=`rgba(34,197,94,${pulse})`; ctx.beginPath(); ctx.arc(W-22,22,16,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#22c55e"; ctx.beginPath(); ctx.arc(W-22,22,8,0,Math.PI*2); ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [speaking, icp]);

  return <canvas ref={ref} width={size} height={Math.round(size*.78)} style={{width:"100%",height:"100%",display:"block",borderRadius:12}} />;
}

// ─── PRE-CALL LOBBY ──────────────────────────────────────────
function PreCallLobby({ scenario, onStart, onBack }) {
  const { stage, icps, companySize } = scenario;
  const stageInfo = STAGES.find(s=>s.id===stage);
  const [countdown, setCountdown] = useState(null);

  const handleJoin = () => {
    setCountdown(3);
    const t = setInterval(() => {
      setCountdown(c => {
        if(c <= 1){ clearInterval(t); onStart(); return null; }
        return c-1;
      });
    }, 1000);
  };

  return (
    <div style={{minHeight:"100vh",background:"#06090f",fontFamily:"monospace",color:"#e2e8f0",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{height:56,borderBottom:"1px solid #1e2d40",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px"}}>
        <div style={{fontSize:18,fontWeight:900,color:"#38bdf8",letterSpacing:3}}>⬡ CALLFORGE</div>
        <div style={{fontSize:13,color:"#64748b"}}>{stageInfo?.label} · {SIZES[companySize]}</div>
        <button onClick={onBack} style={{background:"transparent",border:"1px solid #1e2d40",color:"#64748b",borderRadius:8,padding:"6px 16px",fontSize:12,cursor:"pointer",fontFamily:"monospace"}}>← Back</button>
      </div>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
        <div style={{width:"100%",maxWidth:800}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontSize:11,letterSpacing:4,color:"#64748b",textTransform:"uppercase",marginBottom:12}}>Ready to join?</div>
            <div style={{fontSize:32,fontWeight:900,color:"#f1f5f9",marginBottom:8}}>{stageInfo?.icon} {stageInfo?.label}</div>
            <div style={{fontSize:15,color:"#64748b"}}>You'll be connected with {icps.map(i=>ICP[i]?.title).join(" and ")} from a {SIZES[companySize]} company</div>
          </div>

          {/* Avatar previews */}
          <div style={{display:"grid",gridTemplateColumns:icps.length===1?"1fr":icps.length===2?"1fr 1fr":"1fr 1fr 1fr",gap:16,marginBottom:40}}>
            {icps.map(icp=>(
              <div key={icp} style={{background:"#0d1320",border:`1px solid ${ICP[icp]?.color}44`,borderRadius:16,overflow:"hidden",position:"relative"}}>
                <Avatar icp={icp} speaking={false} size={280}/>
                <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(6,9,15,.9))",padding:"20px 16px 12px"}}>
                  <div style={{fontSize:14,fontWeight:700,color:ICP[icp]?.color}}>{ICP[icp]?.title}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{ICP[icp]?.focus}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Coaching tip */}
          <div style={{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:14,padding:"20px 24px",marginBottom:32,textAlign:"center"}}>
            <div style={{fontSize:11,color:"#60a5fa",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Objective</div>
            <div style={{fontSize:14,color:"#94a3b8",lineHeight:1.7}}>
              {stage==="discovery" && "Ask open-ended questions. Don't pitch. Uncover their pain points and qualify the opportunity. Listen 70% of the time."}
              {stage==="demo" && "Tailor every feature to their specific pain points. Handle objections directly. Ask 'does that resonate?' often."}
              {stage==="negotiation" && "Never discount first. Anchor on ROI. Close with a specific next step and date."}
            </div>
          </div>

          <button onClick={handleJoin} style={{width:"100%",background:countdown?"#0a0f1e":"#0f2744",border:`1px solid ${countdown?"#1e2d40":"#38bdf8"}`,color:countdown?"#64748b":"#38bdf8",borderRadius:14,padding:"20px",fontSize:18,fontWeight:900,cursor:"pointer",fontFamily:"monospace",transition:"all .2s"}}>
            {countdown?`Starting in ${countdown}...`:"Join Call →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TEAMS-STYLE CALL ────────────────────────────────────────
function TeamsCall({ scenario, onEnd }) {
  const { stage, icps, companySize } = scenario;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingICP, setSpeakingICP] = useState(null);
  const [duration, setDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [primaryICP, setPrimaryICP] = useState(icps[0]);
  const convRef = useRef({});
  icps.forEach(icp=>{ if(!convRef.current[icp]) convRef.current[icp]=[]; });
  const chatEnd = useRef(null);
  const timerRef = useRef(null);
  const fmt = s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  useEffect(()=>{
    timerRef.current=setInterval(()=>setDuration(d=>d+1),1000);
    startCall
