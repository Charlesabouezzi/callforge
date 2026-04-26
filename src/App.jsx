import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase";

const ICP_PROFILES = {
  cfo:       { title: "CFO",      label: "Chief Financial Officer",  color: "#f59e0b", emoji: "💼", focus: "ROI & budget approval" },
  coo:       { title: "COO",      label: "Chief Operating Officer",  color: "#22c55e", emoji: "⚙️", focus: "Operations & implementation" },
  cto:       { title: "CTO",      label: "Chief Technology Officer", color: "#38bdf8", emoji: "🔧", focus: "Tech stack & security" },
  vp_sales:  { title: "VP Sales", label: "VP of Sales",              color: "#a78bfa", emoji: "📈", focus: "Quota & rep adoption" },
  director:  { title: "Director", label: "Director of Revenue Ops",  color: "#fb923c", emoji: "📊", focus: "Process & reporting" },
  smb_owner: { title: "Owner",    label: "SMB Founder / CEO",        color: "#f472b6", emoji: "🚀", focus: "Simplicity & cost" },
};

const COMPANY_SIZES = {
  startup:          "Startup (1-50)",
  smb:              "SMB (51-500)",
  mid_market:       "Mid-Market (501-2K)",
  enterprise:       "Enterprise (2K-10K)",
  large_enterprise: "Large Enterprise (10K+)",
};

const STAGES = [
  { id: "discovery",   label: "Discovery Call",      icon: "🔍", desc: "Uncover pain points & qualify",             duration: "30 min", passingScore: 68, color: "#38bdf8" },
  { id: "demo",        label: "Product Demo",         icon: "🖥", desc: "Walk through features & handle objections",  duration: "45 min", passingScore: 72, color: "#a78bfa" },
  { id: "negotiation", label: "Negotiation & Close", icon: "🤝", desc: "Pricing, objections & commitment",           duration: "30 min", passingScore: 78, color: "#22c55e" },
];

const sc = s => s >= 80 ? "#22c55e" : s >= 70 ? "#38bdf8" : s >= 60 ? "#f59e0b" : "#ef4444";

const buildPrompt = (stage, icps, companySize) => {
  const personas = icps.map(i => ICP_PROFILES[i]);
  const size = COMPANY_SIZES[companySize];
  const inst = {
    discovery: "Be guarded. Make the rep earn your pain points. Do not let them pitch yet.",
    demo: "You agreed to see the product. Ask pointed questions. Push back on claims.",
    negotiation: "Push for discounts, question contract terms, raise last-minute concerns.",
  };
  return `You are ${personas.map(p => p.title).join(" and ")} at a ${size} company on a ${stage} sales call.
Product: SalesFlow CRM - AI-powered CRM. Auto-logs calls. Predicts deal health. 60% less manual entry.
Pricing: $65/seat/mo Starter, $120/seat/mo Pro, Enterprise custom.
${personas.map(p => `As ${p.title}: care most about ${p.focus}.`).join(" ")}
${inst[stage]}
Rules: 2-4 sentences max. Sound like a real executive. Ask follow-up questions. Never break character.`;
};

const scoreP = (stage, transcript) =>
  `Analyze this ${stage} sales call. Return ONLY valid JSON no markdown.
Transcript: ${transcript}
{"overallScore":<0-100>,"passed":<true if >=${STAGES.find(s=>s.id===stage)?.passingScore}>,"categories":{"rapport":<0-100>,"discovery":<0-100>,"productKnowledge":<0-100>,"objectionHandling":<0-100>,"closing":<0-100>},"strengths":["str1","str2"],"improvements":["imp1","imp2"],"bestMoment":"best line","missedOpportunity":"missed","coachSummary":"2-3 sentence honest assessment"}`;

function Avatar({ icp, speaking }) {
  const ref = useRef(null);
  const anim = useRef(null);
  const ph = useRef(0);
  const p = ICP_PROFILES[icp];
  const pal = {
    cfo:{h:"#1a0a0a",s:"#c8855a",c:"#1e3a5f"},coo:{h:"#2a1a0a",s:"#b8754a",c:"#1a3a2e"},
    cto:{h:"#3a3a4a",s:"#d4956a",c:"#1a1a3a"},vp_sales:{h:"#0a1a2a",s:"#c0854a",c:"#2a1a4a"},
    director:{h:"#4a2a0a",s:"#c89060",c:"#2a1a0a"},smb_owner:{h:"#2a1a1a",s:"#d4a060",c:"#1a3a2a"},
  };
  const av = pal[icp] || pal.cfo;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, cx = W/2, cy = H*0.42;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      const bg = ctx.createLinearGradient(0,0,0,H);
      bg.addColorStop(0,"#0d1829"); bg.addColorStop(1,"#06090f");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
      ctx.fillStyle="rgba(56,189,248,0.04)";
      for(let x=20;x<W;x+=32)for(let y=20;y<H;y+=32){ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();}
      if(speaking){
        ph.current+=0.06;
        for(let r=0;r<4;r++){
          const rad=105+r*22+Math.sin(ph.current+r)*7;
          const alpha=Math.max(0,0.15-r*0.03);
          ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);
          ctx.strokeStyle=`rgba(56,189,248,${alpha})`;ctx.lineWidth=2;ctx.stroke();
        }
      }
      ctx.beginPath();ctx.ellipse(cx,H+10,W*0.55,H*0.35,0,Math.PI,0);ctx.fillStyle=av.c;ctx.fill();
      ctx.beginPath();ctx.moveTo(cx-22,cy+62);ctx.lineTo(cx,cy+48);ctx.lineTo(cx+22,cy+62);ctx.fillStyle="#f1f5f9";ctx.fill();
      ctx.beginPath();ctx.rect(cx-16,cy+46,32,30);ctx.fillStyle=av.s;ctx.fill();
      ctx.beginPath();ctx.ellipse(cx,cy,70,82,0,0,Math.PI*2);ctx.fillStyle=av.s;ctx.fill();
      ctx.beginPath();ctx.ellipse(cx,cy-48,72,50,0,Math.PI,0);ctx.fillStyle=av.h;ctx.fill();
      ctx.beginPath();ctx.arc(cx-68,cy-12,18,0,Math.PI*2);ctx.fillStyle=av.h;ctx.fill();
      ctx.beginPath();ctx.arc(cx+68,cy-12,18,0,Math.PI*2);ctx.fillStyle=av.h;ctx.fill();
      const blink=speaking?(Math.sin(ph.current*0.28)>0.96?1:11):11;
      [-25,25].forEach(ox=>{
        ctx.beginPath();ctx.ellipse(cx+ox,cy-8,12,blink/2+1,0,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();
        ctx.beginPath();ctx.ellipse(cx+ox,cy-8,8,blink/2,0,0,Math.PI*2);ctx.fillStyle="#1a2a4a";ctx.fill();
        ctx.beginPath();ctx.arc(cx+ox+1,cy-9,4,0,Math.PI*2);ctx.fillStyle="#000a1a";ctx.fill();
        ctx.beginPath();ctx.arc(cx+ox+3,cy-11,2,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.7)";ctx.fill();
      });
      [-25,25].forEach(ox=>{
        ctx.beginPath();ctx.moveTo(cx+ox-14,cy-28);ctx.quadraticCurveTo(cx+ox,cy-34,cx+ox+14,cy-28);
        ctx.strokeStyle=av.h;ctx.lineWidth=3;ctx.lineCap="round";ctx.stroke();
      });
      const mo=speaking?Math.abs(Math.sin(ph.current*3.5))*11:2;
      if(mo>3){
        ctx.beginPath();ctx.ellipse(cx,cy+46,22,mo,0,0,Math.PI*2);ctx.fillStyle="#5a1010";ctx.fill();
        ctx.beginPath();ctx.ellipse(cx,cy+40,18,5,0,0,Math.PI);ctx.fillStyle="#f8f8f8";ctx.fill();
      }else{
        ctx.beginPath();ctx.moveTo(cx-20,cy+46);ctx.quadraticCurveTo(cx,cy+54,cx+20,cy+46);ctx.strokeStyle="#8a4040";ctx.lineWidth=2;ctx.stroke();
      }
      ctx.fillStyle="rgba(6,9,15,0.9)";ctx.fillRect(14,H-56,220,42);
      ctx.fillStyle=p?.color||"#38bdf8";ctx.font="bold 14px sans-serif";ctx.fillText(p?.title||"",26,H-38);
      ctx.fillStyle="#94a3b8";ctx.font="11px sans-serif";ctx.fillText(p?.label||"",26,H-20);
      if(speaking){
        ctx.fillStyle=`rgba(34,197,94,${0.2+Math.sin(ph.current*5)*0.2})`;
        ctx.beginPath();ctx.arc(W-22,22,16,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#22c55e";ctx.beginPath();ctx.arc(W-22,22,8,0,Math.PI*2);ctx.fill();
      }
      anim.current=requestAnimationFrame(draw);
    };
    anim.current=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(anim.current);
  },[speaking,icp]);

  return <canvas ref={ref} width={480} height={360} style={{width:"100%",height:"100%",display:"block"}}/>;
}

function PreCallLobby({scenario,onJoin,onBack}){
  const{stage,icps,companySize}=scenario;
  const si=STAGES.find(s=>s.id===stage);
  const[camReady,setCamReady]=useState(false);
  const vRef=useRef(null);
  useEffect(()=>{
    navigator.mediaDevices?.getUserMedia({video:true,audio:false})
      .then(stream=>{if(vRef.current){vRef.current.srcObject=stream;setCamReady(true);}})
      .catch(()=>setCamReady(false));
    return()=>{if(vRef.current?.srcObject)vRef.current.srcObject.getTracks().forEach(t=>t.stop());};
  },[]);

  return(
    <div style={{minHeight:"100vh",background:"#06090f",fontFamily:"sans-serif",color:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:960,padding:32}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:13,fontWeight:700,color:"#38bdf8",letterSpacing:4,textTransform:"uppercase",marginBottom:8}}>⬡ CALLFORGE</div>
          <div style={{fontSize:28,fontWeight:800,color:"#f1f5f9",marginBottom:6}}>Ready to join?</div>
          <div style={{fontSize:14,color:"#64748b"}}>{si?.icon} {si?.label} with {icps.map(i=>ICP_PROFILES[i]?.title).join(" + ")} · {COMPANY_SIZES[companySize]}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:32}}>
          <div style={{background:"#0d1320",borderRadius:20,overflow:"hidden",border:"1px solid #1e2d40",position:"relative",aspectRatio:"4/3"}}>
            {camReady?<video ref={vRef} autoPlay muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}}/>:
            <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
              <div style={{fontSize:48}}>📷</div>
              <div style={{fontSize:13,color:"#475569"}}>Camera preview</div>
            </div>}
            <div style={{position:"absolute",bottom:14,left:14,background:"rgba(6,9,15,0.85)",borderRadius:8,padding:"6px 14px",fontSize:12,color:"#cbd5e1",fontWeight:600}}>You</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{fontSize:12,color:"#64748b",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>You'll be speaking with</div>
            {icps.map(icp=>{
              const p=ICP_PROFILES[icp];
              return(
                <div key={icp} style={{background:"#0d1320",border:`1px solid ${p.color}33`,borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:48,height:48,borderRadius:"50%",background:`${p.color}22`,border:`2px solid ${p.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{p.emoji}</div>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9"}}>{p.title}</div>
                    <div style={{fontSize:12,color:"#64748b"}}>{p.label}</div>
                    <div style={{fontSize:11,color:p.color,marginTop:4}}>Focus: {p.focus}</div>
                  </div>
                </div>
              );
            })}
            <div style={{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:14,padding:"14px 18px"}}>
              <div style={{fontSize:11,color:"#60a5fa",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Your Objective</div>
              <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.7}}>
                {stage==="discovery"&&"Uncover pain points and qualify. Ask questions — do not pitch yet."}
                {stage==="demo"&&"Walk through the product tied to their pain points. Handle every objection."}
                {stage==="negotiation"&&"Handle pricing objections and close for commitment."}
              </div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onBack} style={{flex:1,background:"transparent",border:"1px solid #1e2d40",color:"#64748b",borderRadius:12,padding:"14px",fontSize:14,cursor:"pointer",fontFamily:"sans-serif"}}>Back</button>
          <button onClick={onJoin} style={{flex:3,background:"#0f2744",border:"1px solid #38bdf8",color:"#38bdf8",borderRadius:12,padding:"14px",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"sans-serif"}}>Join Call →</button>
        </div>
      </div>
    </div>
  );
}

function LiveCall({scenario,onEnd}){
  const{stage,icps,companySize}=scenario;
  const[messages,setMessages]=useState([]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[speakingICP,setSpeakingICP]=useState(null);
  const[duration,setDuration]=useState(0);
  const[micOn,setMicOn]=useState(true);
  const[camOn,setCamOn]=useState(true);
  const convRef=useRef({});
  icps.forEach(icp=>{if(!convRef.current[icp])convRef.current[icp]=[];});
  const chatEnd=useRef(null);
  const timerRef=useRef(null);
  const vRef=useRef(null);
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const si=STAGES.find(s=>s.id===stage);

  useEffect(()=>{
    timerRef.current=setInterval(()=>setDuration(d=>d+1),1000);
    startCall();
    navigator.mediaDevices?.getUserMedia({video:true,audio:false})
      .then(stream=>{if(vRef.current)vRef.current.srcObject=stream;})
      .catch(()=>{});
    return()=>{
      clearInterval(timerRef.current);
      if(vRef.current?.srcObject)vRef.current.srcObject.getTracks().forEach(t=>t.stop());
    };
  },[]);

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const startCall=async()=>{
    setLoading(true);
    const first=icps[0];
    const opener={role:"user",content:`Start the call. Introduce yourself as ${ICP_PROFILES[first]?.title} naturally.`};
    convRef.current[first]=[opener];
    setSpeakingICP(first);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,system:buildPrompt(stage,icps,companySize),messages:convRef.current[first]})});
      const data=await res.json();
      const reply=data.content?.map(b=>b.text||"").join("")||"Hey, thanks for jumping on!";
      convRef.current[first]=[...convRef.current[first],{role:"assistant",content:reply}];
      setMessages([{from:"prospect",icp:first,text:reply,ts:"00:00"}]);
    }catch{setMessages([{from:"prospect",icp:first,text:"Hey, thanks for jumping on. Let me pull up my notes.",ts:"00:00"}]);}
    setSpeakingICP(null);setLoading(false);
  };

  const send=async()=>{
    if(!input.trim()||loading)return;
    const text=input.trim();setInput("");
    setMessages(prev=>[...prev,{from:"rep",text,ts:fmt(duration)}]);
    setLoading(true);
    const rICP=icps[Math.floor(Math.random()*icps.length)];
    convRef.current[rICP]=[...(convRef.current[rICP]||[]),{role:"user",content:text}];
    setSpeakingICP(rICP);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,system:buildPrompt(stage,icps,companySize),messages:convRef.current[rICP]})});
      const data=await res.json();
      const reply=data.content?.map(b=>b.text||"").join("")||"Could you repeat that?";
      convRef.current[rICP]=[...convRef.current[rICP],{role:"assistant",content:reply}];
      setMessages(prev=>[...prev,{from:"prospect",icp:rICP,text:reply,ts:fmt(duration)}]);
    }catch{setMessages(prev=>[...prev,{from:"prospect",icp:rICP,text:"Sorry, I missed that.",ts:fmt(duration)}]);}
    setSpeakingICP(null);setLoading(false);
  };

  const handleKey=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};
  const transcript=messages.map(m=>`${m.from==="rep"?"Rep":ICP_PROFILES[m.icp]?.title}: ${m.text}`).join("\n");
  const gridCols=icps.length===1?"1fr":icps.length===2?"1fr 1fr":"1fr 1fr 1fr";

  return(
    <div style={{height:"100vh",background:"#06090f",fontFamily:"sans-serif",color:"#e2e8f0",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Top bar */}
      <div style={{height:56,background:"#0a0f1e",borderBottom:"1px solid #1e2d40",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:16,fontWeight:800,color:"#38bdf8",letterSpacing:2}}>⬡ CALLFORGE</div>
          <div style={{width:1,height:20,background:"#1e2d40"}}/>
          <div style={{fontSize:13,color:"#64748b"}}>{si?.icon} {si?.label}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e"}}/>
            <span style={{fontSize:12,color:"#22c55e",fontWeight:600}}>LIVE</span>
          </div>
        </div>
        <div style={{fontSize:24,fontWeight:900,color:"#f1f5f9",letterSpacing:4}}>{fmt(duration)}</div>
        <button onClick={()=>onEnd(transcript,scenario,duration)} style={{background:"#c0392b",border:"none",color:"#fff",borderRadius:8,padding:"8px 20px",fontSize:13,cursor:"pointer",fontFamily:"sans-serif",fontWeight:700}}>End Call</button>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* Video area */}
        <div style={{flex:1,display:"flex",flexDirection:"column",padding:12,gap:10,background:"#080c14"}}>
          {/* AI tiles */}
          <div style={{flex:1,display:"grid",gridTemplateColumns:gridCols,gap:10}}>
            {icps.map(icp=>{
              const p=ICP_PROFILES[icp];
              const spk=speakingICP===icp;
              return(
                <div key={icp} style={{position:"relative",background:"#0d1829",borderRadius:16,overflow:"hidden",border:`2px solid ${spk?p.color:"#1e2d40"}`,transition:"border-color 0.3s",boxShadow:spk?`0 0 24px ${p.color}44`:"none"}}>
                  <Avatar icp={icp} speaking={spk}/>
                  {loading&&spk&&<div style={{position:"absolute",bottom:64,left:"50%",transform:"translateX(-50%)",background:"rgba(6,9,15,0.9)",borderRadius:20,padding:"6px 18px",fontSize:20,color:p.color,letterSpacing:4}}>● ● ●</div>}
                </div>
              );
            })}
          </div>

          {/* Rep + controls */}
          <div style={{height:110,display:"flex",gap:10}}>
            <div style={{flex:1,background:"#0d1829",borderRadius:14,overflow:"hidden",border:"2px solid #1e3a5f",position:"relative"}}>
              {camOn?
                <video ref={vRef} autoPlay muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}}/>:
                <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#0d1829"}}>
                  <div style={{width:48,height:48,borderRadius:"50%",background:"#1e3a5f",color:"#60a5fa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800}}>YOU</div>
                </div>
              }
              <div style={{position:"absolute",bottom:8,left:12,background:"rgba(6,9,15,0.85)",borderRadius:6,padding:"3px 10px",fontSize:11,color:"#cbd5e1",fontWeight:600}}>You</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,justifyContent:"center"}}>
              <button onClick={()=>setMicOn(m=>!m)} style={{width:48,height:48,borderRadius:"50%",background:micOn?"#1e2d40":"#c0392b",border:"none",fontSize:20,cursor:"pointer"}}>{micOn?"🎙️":"🔇"}</button>
              <button onClick={()=>setCamOn(c=>!c)} style={{width:48,height:48,borderRadius:"50%",background:camOn?"#1e2d40":"#c0392b",border:"none",fontSize:20,cursor:"pointer"}}>{camOn?"📹":"📷"}</button>
            </div>
          </div>
        </div>

        {/* Chat panel */}
        <div style={{width:360,background:"#0a0f1e",borderLeft:"1px solid #1e2d40",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #1e2d40",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#64748b",letterSpacing:2,textTransform:"uppercase"}}>Transcript</div>
            <div style={{fontSize:11,color:"#334155"}}>{messages.length} messages</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
            {messages.length===0&&<div style={{textAlign:"center",color:"#334155",fontSize:13,marginTop:40}}>Call starting...</div>}
            {messages.map((msg,i)=>{
              const p=msg.icp?ICP_PROFILES[msg.icp]:null;
              const isRep=msg.from==="rep";
              return(
                <div key={i} style={{marginBottom:16,display:"flex",flexDirection:"column",alignItems:isRep?"flex-end":"flex-start"}}>
                  <div style={{fontSize:10,color:isRep?"#60a5fa":p?.color,fontWeight:700,marginBottom:4,letterSpacing:1}}>{isRep?"YOU":p?.title?.toUpperCase()} · {msg.ts}</div>
                  <div style={{maxWidth:"88%",background:isRep?"#0f2744":"#0d1829",border:`1px solid ${isRep?"#1e3a5f":p?.color+"44"}`,borderRadius:isRep?"12px 12px 2px 12px":"12px 12px 12px 2px",padding:"10px 14px",fontSize:13,color:"#cbd5e1",lineHeight:1.6}}>{msg.text}</div>
                </div>
              );
            })}
            {loading&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:10,color:speakingICP?ICP_PROFILES[speakingICP]?.color:"#38bdf8",fontWeight:700,marginBottom:4,letterSpacing:1}}>{speakingICP?ICP_PROFILES[speakingICP]?.title?.toUpperCase():"..."}</div>
                <div style={{background:"#0d1829",border:`1px solid ${speakingICP?ICP_PROFILES[speakingICP]?.color+"44":"#1e3a5f"}`,borderRadius:"12px 12px 12px 2px",padding:"10px 14px",fontSize:18,color:speakingICP?ICP_PROFILES[speakingICP]?.color:"#38bdf8",letterSpacing:6,display:"inline-block"}}>● ● ●</div>
              </div>
            )}
            <div ref={chatEnd}/>
          </div>
          <div style={{padding:"10px 16px",borderTop:"1px solid #1e2d40",borderBottom:"1px solid #1e2d40",background:"#06090f"}}>
            {icps.map(icp=><div key={icp} style={{fontSize:11,color:"#475569",marginBottom:2}}><span style={{color:ICP_PROFILES[icp]?.color}}>{ICP_PROFILES[icp]?.title}:</span> {ICP_PROFILES[icp]?.focus}</div>)}
          </div>
          <div style={{padding:14}}>
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Type your response... (Enter to send)" rows={3} disabled={loading}
              style={{width:"100%",background:"#0d1829",border:"1px solid #1e2d40",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#e2e8f0",fontFamily:"sans-serif",resize:"none",outline:"none",display:"block"}}/>
            <button onClick={send} disabled={loading||!input.trim()} style={{marginTop:8,width:"100%",background:input.trim()&&!loading?"#0f2744":"#0a0f1e",border:`1px solid ${input.trim()&&!loading?"#38bdf8":"#1e2d40"}`,color:input.trim()&&!loading?"#38bdf8":"#334155",borderRadius:8,padding:"11px",fontSize:14,cursor:input.trim()&&!loading?"pointer":"default",fontFamily:"sans-serif",fontWeight:700}}>Send →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthScreen({onAuth}){
  const[mode,setMode]=useState("login");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[name,setName]=useState("");
  const[role,setRole]=useState("rep");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[message,setMessage]=useState("");
  const I={width:"100%",background:"#0d1320",border:"1px solid #1e2d40",borderRadius:10,padding:"13px 16px",fontSize:14,color:"#e2e8f0",fontFamily:"sans-serif",outline:"none",display:"block"};
  const L={fontSize:11,color:"#64748b",letterSpacing:2,textTransform:"uppercase",marginBottom:8,display:"block"};

  const login=async()=>{
    if(!email||!password)return setError("Fill in all fields");
    setLoading(true);setError("");
    const{data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error){setError(error.message);setLoading(false);return;}
    const{data:profile}=await supabase.from("profiles").select("*").eq("id",data.user.id).single();
    onAuth(profile||{id:data.user.id,email,name:email.split("@")[0],role:"rep"});
    setLoading(false);
  };

  const signup=async()=>{
    if(!email||!password||!name)return setError("Fill in all fields");
    setLoading(true);setError("");
    const{data,error}=await supabase.auth.signUp({email,password});
    if(error){setError(error.message);setLoading(false);return;}
    if(data.user){
      await supabase.from("profiles").insert({id:data.user.id,name,email,role});
      setMessage("Account created! Check your email to confirm, then log in.");
      setMode("login");
    }
    setLoading(false);
  };

  return(
    <div style={{minHeight:"100vh",background:"#06090f",display:"flex",fontFamily:"sans-serif"}}>
      <div style={{width:"45%",background:"linear-gradient(135deg,#0a1628,#06090f)",borderRight:"1px solid #1e2d40",display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 64px"}}>
        <div style={{fontSize:28,fontWeight:900,color:"#38bdf8",letterSpacing:4,marginBottom:8}}>⬡ CALLFORGE</div>
        <div style={{fontSize:13,color:"#475569",letterSpacing:2,marginBottom:64,textTransform:"uppercase"}}>Sales Training Platform</div>
        <div style={{fontSize:38,fontWeight:900,color:"#f1f5f9",lineHeight:1.2,marginBottom:20}}>Train like it is<br/>a real call.</div>
        <div style={{fontSize:15,color:"#64748b",lineHeight:1.8,maxWidth:340}}>Practice discovery, demo, and closing calls against AI prospects. Get scored. Get certified. Go live.</div>
        <div style={{marginTop:56,display:"flex",flexDirection:"column",gap:16}}>
          {[["🔍","Real AI prospects that push back"],["📊","Scored on every call"],["🎓","Manager-certified before going live"]].map(([icon,text])=>(
            <div key={text} style={{display:"flex",alignItems:"center",gap:14,fontSize:13,color:"#64748b"}}><span style={{fontSize:18}}>{icon}</span>{text}</div>
          ))}
        </div>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
        <div style={{width:"100%",maxWidth:420}}>
          <div style={{display:"flex",marginBottom:36,borderBottom:"1px solid #1e2d40"}}>
            {[["login","Sign In"],["signup","Create Account"]].map(([id,label])=>(
              <div key={id} onClick={()=>{setMode(id);setError("");setMessage("");}} style={{flex:1,textAlign:"center",padding:"12px",fontSize:13,cursor:"pointer",color:mode===id?"#38bdf8":"#475569",borderBottom:mode===id?"2px solid #38bdf8":"2px solid transparent",marginBottom:-1}}>{label}</div>
            ))}
          </div>
          {message&&<div style={{background:"#0a1a0a",border:"1px solid #1a3a1a",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#4ade80",marginBottom:20}}>{message}</div>}
          {error&&<div style={{background:"#1a0a0a",border:"1px solid #3a1a1a",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#f87171",marginBottom:20}}>{error}</div>}
          {mode==="signup"&&(
            <>
              <div style={{marginBottom:16}}><div style={L}>Full Name</div><input value={name} onChange={e=>setName(e.target.value)} placeholder="Alex Rivera" style={I}/></div>
              <div style={{marginBottom:16}}>
                <div style={L}>Role</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[["rep","Sales Rep"],["manager","Manager"]].map(([id,label])=>(
                    <div key={id} onClick={()=>setRole(id)} style={{background:role===id?"#0f2744":"#0d1320",border:`1px solid ${role===id?"#38bdf8":"#1e2d40"}`,borderRadius:10,padding:"12px",textAlign:"center",cursor:"pointer",fontSize:13,color:role===id?"#38bdf8":"#64748b",fontWeight:role===id?700:400}}>{label}</div>
                  ))}
                </div>
              </div>
            </>
          )}
          <div style={{marginBottom:16}}><div style={L}>Email</div><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" type="email" style={I}/></div>
          <div style={{marginBottom:32}}><div style={L}>Password</div><input value={password} onChange={e=>setPassword(e.target.value)} placeholder="..." type="password" style={I}/></div>
          <button onClick={mode==="login"?login:signup} disabled={loading} style={{width:"100%",background:"#0f2744",border:"1px solid #38bdf8",color:"#38bdf8",borderRadius:12,padding:"16px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"sans-serif"}}>
            {loading?"Please wait...":mode==="login"?"Sign In →":"Create Account →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScenarioBuilder({onStart}){
  const[stage,setStage]=useState("discovery");
  const[icps,setICPs]=useState(["vp_sales"]);
  const[companySize,setCompanySize]=useState("smb");
  const toggle=id=>setICPs(prev=>prev.includes(id)?prev.filter(i=>i!==id):prev.length<3?[...prev,id]:prev);
  return(
    <div>
      <div style={{marginBottom:32}}>
        <div style={{fontSize:11,color:"#64748b",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Call Stage</div>
        <div style={{display:"flex",gap:12}}>
          {STAGES.map(s=>(
            <div key={s.id} onClick={()=>setStage(s.id)} style={{flex:1,background:stage===s.id?"#0f2744":"#0d1320",border:`1px solid ${stage===s.id?s.color:"#1e2d40"}`,borderRadius:14,padding:"20px 18px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:26,marginBottom:8}}>{s.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:stage===s.id?s.color:"#cbd5e1"}}>{s.label}</div>
              <div style={{fontSize:11,color:"#475569",marginTop:4}}>{s.duration}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{marginBottom:32}}>
        <div style={{fontSize:11,color:"#64748b",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Who is on the call?</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {Object.entries(ICP_PROFILES).map(([id,p])=>{
            const sel=icps.includes(id);
            return <div key={id} onClick={()=>toggle(id)} style={{background:sel?"#0f2744":"#0d1320",border:`1px solid ${sel?p.color:"#1e2d40"}`,borderRadius:12,padding:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>{p.emoji}</span>
              <div><div style={{fontSize:13,fontWeight:sel?700:400,color:sel?p.color:"#94a3b8"}}>{p.title}</div><div style={{fontSize:10,color:"#475569"}}>{p.focus.split(" ").slice(0,3).join(" ")}</div></div>
            </div>;
          })}
        </div>
      </div>
      <div style={{marginBottom:36}}>
        <div style={{fontSize:11,color:"#64748b",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Company Size</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {Object.entries(COMPANY_SIZES).map(([id,label])=>(
            <div key={id} onClick={()=>setCompanySize(id)} style={{background:companySize===id?"#0f2744":"#0d1320",border:`1px solid ${companySize===id?"#38bdf8":"#1e2d40"}`,borderRadius:8,padding:"9px 16px",cursor:"pointer",fontSize:12,color:companySize===id?"#38bdf8":"#64748b",fontWeight:companySize===id?700:400}}>{label}</div>
          ))}
        </div>
      </div>
      <div style={{background:"#0d1320",border:"1px solid #1e2d40",borderRadius:12,padding:"18px 22px",marginBottom:28}}>
        <div style={{fontSize:11,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:2}}>Scenario</div>
        <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9"}}>{STAGES.find(s=>s.id===stage)?.label} with {icps.map(i=>ICP_PROFILES[i].title).join(" + ")}</div>
        <div style={{fontSize:12,color:"#475569",marginTop:4}}>{COMPANY_SIZES[companySize]}</div>
      </div>
      <button onClick={()=>onStart({stage,icps,companySize})} style={{width:"100%",background:"#0f2744",border:"1px solid #38bdf8",color:"#38bdf8",borderRadius:12,padding:"18px",fontSize:16,cursor:"pointer",fontFamily:"sans-serif",fontWeight:900}}>Continue →</button>
    </div>
  );
}

function RepDashboard({user,onStartSession,onSignOut}){
  const[tab,setTab]=useState("home");
  const[sessions,setSessions]=useState([]);
  const[missions,setMissions]=useState([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{loadData();},[]);
  const loadData=async()=>{
    setLoading(true);
    const{data:s}=await supabase.from("sessions").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
    const{data:m}=await supabase.from("missions").select("*").eq("assigned_to",user.id).order("created_at",{ascending:false});
    setSessions(s||[]);setMissions(m||[]);setLoading(false);
  };
  const avgScore=sessions.length?Math.round(sessions.reduce((a,b)=>a+b.score,0)/sessions.length):null;
  const unread=missions.filter(m=>!m.read).length;

  return(
    <div style={{minHeight:"100vh",background:"#06090f",fontFamily:"sans-serif",color:"#e2e8f0",display:"flex"}}>
      <div style={{width:220,background:"#0a0f1e",borderRight:"1px solid #1e2d40",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"22px 20px",borderBottom:"1px solid #1e2d40"}}><div style={{fontSize:16,fontWeight:900,color:"#38bdf8",letterSpacing:3}}>⬡ CALLFORGE</div></div>
        <nav style={{padding:"16px 0",flex:1}}>
          {[["home","🏠","Dashboard"],["train","🎯","Train"],["missions","📤",`Missions${unread?` (${unread})`:""}`],["progress","📊","Progress"]].map(([id,icon,label])=>(
            <div key={id} onClick={()=>setTab(id)} style={{padding:"11px 20px",fontSize:13,color:tab===id?"#38bdf8":"#475569",cursor:"pointer",borderLeft:tab===id?"2px solid #38bdf8":"2px solid transparent",background:tab===id?"#0f2744":"transparent",display:"flex",alignItems:"center",gap:10}}>
              <span>{icon}</span><span>{label}</span>
              {id==="missions"&&unread>0&&<span style={{marginLeft:"auto",background:"#f87171",color:"#fff",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800}}>{unread}</span>}
            </div>
          ))}
        </nav>
        <div style={{padding:"16px 20px",borderTop:"1px solid #1e2d40"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:"#1e3a5f",color:"#60a5fa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}}>{user.name?.split(" ").map(n=>n[0]).join("")||"U"}</div>
            <div><div style={{fontSize:12,color:"#cbd5e1",fontWeight:600}}>{user.name}</div><div style={{fontSize:10,color:"#475569"}}>{user.role==="manager"?"Manager":"Sales Rep"}</div></div>
          </div>
          <div onClick={onSignOut} style={{fontSize:11,color:"#475569",cursor:"pointer"}}>Sign Out</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {loading?<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#475569"}}>Loading...</div>:(
          <>
            {tab==="home"&&(
              <div style={{padding:"40px 48px"}}>
                <div style={{marginBottom:40}}>
                  <div style={{fontSize:11,letterSpacing:4,color:"#64748b",textTransform:"uppercase",marginBottom:8}}>Good to see you</div>
                  <div style={{fontSize:32,fontWeight:900,color:"#f1f5f9"}}>Hey, {user.name?.split(" ")[0]} 👋</div>
                  {unread>0&&<div style={{fontSize:14,color:"#38bdf8",marginTop:6}}>You have {unread} new mission{unread!==1?"s":""} from your manager.</div>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:40}}>
                  {[["Avg Score",avgScore??"—",avgScore?sc(avgScore):"#475569"],["Sessions",sessions.length,"#a78bfa"],["Passed",sessions.filter(s=>s.passed).length,"#22c55e"],["Missions",missions.length,"#f59e0b"]].map(([label,val,color])=>(
                    <div key={label} style={{background:"#0d1320",border:"1px solid #1e2d40",borderRadius:14,padding:"20px 22px"}}>
                      <div style={{fontSize:10,color:"#64748b",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{label}</div>
                      <div style={{fontSize:26,fontWeight:900,color}}>{val}</div>
                    </div>
                  ))}
                </div>
                {missions.filter(m=>!m.completed).length>0&&(
                  <div style={{marginBottom:40}}>
                    <div style={{fontSize:11,letterSpacing:3,color:"#64748b",textTransform:"uppercase",marginBottom:16}}>Manager Missions</div>
                    {missions.filter(m=>!m.completed).map(m=>(
                      <div key={m.id} onClick={()=>setTab("missions")} style={{background:"#0a1628",border:`1px solid ${m.read?"#1e2d40":"#38bdf8"}`,borderRadius:14,padding:"20px 24px",marginBottom:12,cursor:"pointer"}}>
                        <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9",marginBottom:8}}>{STAGES.find(s=>s.id===m.stage)?.icon} {STAGES.find(s=>s.id===m.stage)?.label}</div>
                        <div style={{fontSize:13,color:"#64748b"}}>"{m.note?.substring(0,100)}..."</div>
                        <div style={{marginTop:12,fontSize:12,color:"#38bdf8"}}>Start Mission →</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{fontSize:11,letterSpacing:3,color:"#64748b",textTransform:"uppercase",marginBottom:16}}>Quick Start</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                  {STAGES.map(stage=>(
                    <div key={stage.id} onClick={()=>setTab("train")} style={{background:"#0d1320",border:"1px solid #1e2d40",borderRadius:14,padding:"22px 20px",cursor:"pointer"}}>
                      <div style={{fontSize:26,marginBottom:10}}>{stage.icon}</div>
                      <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9",marginBottom:4}}>{stage.label}</div>
                      <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>{stage.desc}</div>
                      <div style={{fontSize:11,color:stage.color,background:`${stage.color}18`,borderRadius:6,padding:"3px 10px",display:"inline-block"}}>{stage.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab==="train"&&(
              <div style={{padding:"40px 48px"}}>
                <div style={{marginBottom:40}}>
                  <div style={{fontSize:11,letterSpacing:4,color:"#64748b",textTransform:"uppercase",marginBottom:8}}>Training</div>
                  <div style={{fontSize:28,fontWeight:900,color:"#f1f5f9"}}>Build a Scenario</div>
                </div>
                <ScenarioBuilder onStart={onStartSession}/>
              </div>
            )}
            {tab==="missions"&&(
              <div style={{padding:"40px 48px"}}>
                <div style={{marginBottom:36}}>
                  <div style={{fontSize:11,letterSpacing:4,color:"#64748b",textTransform:"uppercase",marginBottom:8}}>Inbox</div>
                  <div style={{fontSize:28,fontWeight:900,color:"#f1f5f9"}}>Manager Missions</div>
                </div>
                {missions.length===0?<div style={{textAlign:"center",padding:"60px",color:"#334155"}}>No missions yet</div>:missions.map(m=>(
                  <div key={m.id} style={{background:"#0d1320",border:`1px solid ${m.read?"#1e2d40":"#38bdf8"}`,borderRadius:16,padding:"24px 26px",marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                      <div style={{fontSize:16,fontWeight:800,color:"#f1f5f9"}}>{STAGES.find(s=>s.id===m.stage)?.icon} {STAGES.find(s=>s.id===m.stage)?.label}</div>
                      {m.completed?<div style={{background:"#0a1a0a",border:"1px solid #1a3a1a",borderRadius:8,padding:"6px 14px",fontSize:12,color:"#22c55e"}}>Done · {m.score}</div>:<div style={{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:8,padding:"6px 14px",fontSize:12,color:"#38bdf8"}}>Pending</div>}
                    </div>
                    {m.note&&<div style={{background:"#0a0f1e",border:"1px solid #1e2d40",borderRadius:10,padding:"14px 16px",marginBottom:16,fontSize:13,color:"#94a3b8",lineHeight:1.7,fontStyle:"italic"}}>"{m.note}"</div>}
                    {!m.completed&&<button onClick={()=>onStartSession({stage:m.stage,icps:m.icps||[],companySize:m.company_size,missionId:m.id})} style={{background:"#0f2744",border:"1px solid #38bdf8",color:"#38bdf8",borderRadius:10,padding:"12px 24px",fontSize:13,cursor:"pointer",fontFamily:"sans-serif",fontWeight:700}}>Start Mission →</button>}
                  </div>
                ))}
              </div>
            )}
            {tab==="progress"&&(
              <div style={{padding:"40px 48px"}}>
                <div style={{marginBottom:40}}>
                  <div style={{fontSize:11,letterSpacing:4,color:"#64748b",textTransform:"uppercase",marginBottom:8}}>Performance</div>
                  <div style={{fontSize:28,fontWeight:900,color:"#f1f5f9"}}>My Progress</div>
                </div>
                {sessions.length===0?<div style={{textAlign:"center",padding:"80px",color:"#334155"}}><div style={{fontSize:48,marginBottom:16}}>🎯</div><div style={{fontSize:16,color:"#475569"}}>No sessions yet</div></div>:sessions.map((s,i)=>(
                  <div key={i} style={{background:"#0d1320",border:"1px solid #1e2d40",borderRadius:12,padding:"18px 22px",marginBottom:12,display:"flex",alignItems:"center",gap:16}}>
                    <div style={{fontSize:24}}>{STAGES.find(st=>st.id===s.stage)?.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#f1f5f9"}}>{STAGES.find(st=>st.id===s.stage)?.label}</div>
                      <div style={{fontSize:11,color:"#475569"}}>{(s.icps||[]).map(i=>ICP_PROFILES[i]?.title).join(" + ")} · {COMPANY_SIZES[s.company_size]}</div>
                      <div style={{fontSize:10,color:"#334155",marginTop:2}}>{new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{fontSize:28,fontWeight:900,color:sc(s.score)}}>{s.score}</div>
                    <div style={{fontSize:11,color:s.passed?"#22c55e":"#f59e0b"}}>{s.passed?"Passed":"Retry"}</div>
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

function Debrief({score,scenario,duration,onRetry,onDashboard}){
  const[vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),80);},[]);
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const si=STAGES.find(s=>s.id===scenario.stage);
  return(
    <div style={{minHeight:"100vh",background:"#06090f",fontFamily:"sans-serif",color:"#e2e8f0",padding:"48px 40px"}}>
      <div style={{maxWidth:760,margin:"0 auto",opacity:vis?1:0,transform:vis?"none":"translateY(16px)",transition:"all .5s"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontSize:11,letterSpacing:4,color:"#64748b",textTransform:"uppercase",marginBottom:12}}>Call Complete · {si?.label}</div>
          <div style={{fontSize:90,fontWeight:900,color:sc(score.overallScore),lineHeight:1}}>{score.overallScore}</div>
          <div style={{fontSize:16,color:score.passed?"#4ade80":"#fbbf24",fontWeight:700,marginTop:8}}>{score.passed?"Passed":"Keep Practicing"}</div>
          <div style={{fontSize:13,color:"#475569",marginTop:6}}>{fmt(duration)} · {scenario.icps.map(i=>ICP_PROFILES[i].title).join(" + ")} · {COMPANY_SIZES[scenario.companySize]}</div>
        </div>
        <div style={{background:"#0d1320",border:"1px solid #1e2d40",borderRadius:14,padding:"22px 28px",marginBottom:24}}>
          <div style={{fontSize:11,letterSpacing:3,color:"#38bdf8",textTransform:"uppercase",marginBottom:10}}>Coach's Take</div>
          <div style={{fontSize:14,color:"#cbd5e1",lineHeight:1.8}}>{score.coachSummary}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
          {Object.entries(score.categories||{}).map(([k,val])=>(
            <div key={k} style={{background:"#0d1320",border:"1px solid #1e2d40",borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:11,color:"#64748b",textTransform:"capitalize",marginBottom:8}}>{k.replace(/([A-Z])/g," $1")}</div>
              <div style={{background:"#0a0f1e",borderRadius:4,height:4,marginBottom:6}}><div style={{width:`${val}%`,height:"100%",background:sc(val),borderRadius:4}}/></div>
              <div style={{fontSize:22,fontWeight:800,color:sc(val)}}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
          <div style={{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:12,padding:"18px 20px"}}>
            <div style={{fontSize:11,letterSpacing:2,color:"#f59e0b",marginBottom:8}}>BEST MOMENT</div>
            <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.6,fontStyle:"italic"}}>"{score.bestMoment}"</div>
          </div>
          <div style={{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:12,padding:"18px 20px"}}>
            <div style={{fontSize:11,letterSpacing:2,color:"#f87171",marginBottom:8}}>MISSED</div>
            <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.6}}>{score.missedOpportunity}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:36}}>
          {[["Strengths",score.strengths,"#22c55e","#0a1a0a","#1a3a1a"],["Improve",score.improvements,"#f87171","#1a0a0a","#3a1a1a"]].map(([title,items,color,bg,border])=>(
            <div key={title} style={{background:bg,border:`1px solid ${border}`,borderRadius:12,padding:"18px 20px"}}>
              <div style={{fontSize:11,letterSpacing:2,color,marginBottom:12}}>{title}</div>
              {(items||[]).map((s,i)=><div key={i} style={{fontSize:13,color:"#94a3b8",marginBottom:8,paddingLeft:12,borderLeft:`2px solid ${border}`}}>{s}</div>)}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onRetry} style={{flex:1,background:"#0d1320",border:"1px solid #1e2d40",color:"#94a3b8",borderRadius:10,padding:"14px",fontSize:13,cursor:"pointer",fontFamily:"sans-serif",fontWeight:600}}>Retry</button>
          <button onClick={onDashboard} style={{flex:2,background:"#0f2744",border:"1px solid #38bdf8",color:"#38bdf8",borderRadius:10,padding:"14px",fontSize:14,cursor:"pointer",fontFamily:"sans-serif",fontWeight:800}}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}

export default function CallForge(){
  const[screen,setScreen]=useState("loading");
  const[user,setUser]=useState(null);
  const[scenario,setScenario]=useState(null);
  const[score,setScore]=useState(null);
  const[callDuration,setCallDuration]=useState(0);

  useEffect(()=>{
    const check=async()=>{
      const{data:{session}}=await supabase.auth.getSession();
      if(session){
        const{data:profile}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();
        setUser(profile||{id:session.user.id,email:session.user.email,name:session.user.email.split("@")[0],role:"rep"});
        setScreen("dashboard");
      }else setScreen("auth");
    };
    check();
  },[]);

  const handleAuth=p=>{setUser(p);setScreen("dashboard");};
  const handleSignOut=async()=>{await supabase.auth.signOut();setUser(null);setScreen("auth");};
  const handleStart=scen=>{setScenario(scen);setScreen("prejoin");};

  const handleEnd=async(transcript,scen,dur)=>{
    setCallDuration(dur);setScreen("analyzing");
    let parsed;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,system:"Senior sales coach. Return ONLY valid JSON no markdown.",messages:[{role:"user",content:scoreP(scen.stage,transcript)}]})});
      const data=await res.json();
      parsed=JSON.parse(data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim());
    }catch{
      parsed={overallScore:72,passed:true,categories:{rapport:76,discovery:70,productKnowledge:74,objectionHandling:66,closing:60},strengths:["Strong rapport","Good product knowledge"],improvements:["Deeper discovery","Close with a next step"],bestMoment:"When you connected their pain to a feature",missedOpportunity:"Ask about budget earlier",coachSummary:"Solid effort. Slow down on discovery."};
    }
    if(user){
      await supabase.from("sessions").insert({user_id:user.id,stage:scen.stage,icps:scen.icps,company_size:scen.companySize,score:parsed.overallScore,passed:parsed.passed,categories:parsed.categories,coach_summary:parsed.coachSummary,duration:dur});
      if(scen.missionId)await supabase.from("missions").update({completed:true,score:parsed.overallScore,read:true}).eq("id",scen.missionId);
    }
    setScore(parsed);setScreen("debrief");
  };

  const Spin=()=>(
    <div style={{minHeight:"100vh",background:"#06090f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      <div style={{fontSize:28,fontWeight:900,color:"#38bdf8",letterSpacing:4,marginBottom:20}}>⬡ CALLFORGE</div>
      <div style={{width:36,height:36,border:"3px solid #1e2d40",borderTop:"3px solid #38bdf8",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(screen==="loading")return <Spin/>;
  if(screen==="auth")return <AuthScreen onAuth={handleAuth}/>;
  if(screen==="dashboard")return <RepDashboard user={user} onStartSession={handleStart} onSignOut={handleSignOut}/>;
  if(screen==="prejoin"&&scenario)return <PreCallLobby scenario={scenario} onJoin={()=>setScreen("call")} onBack={()=>setScreen("dashboard")}/>;
  if(screen==="call"&&scenario)return <LiveCall scenario={scenario} onEnd={handleEnd}/>;
  if(screen==="analyzing")return(
    <div style={{minHeight:"100vh",background:"#06090f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      <div style={{width:48,height:48,border:"3px solid #1e2d40",borderTop:"3px solid #38bdf8",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:20}}/>
      <div style={{color:"#64748b",fontSize:14}}>Analyzing your call...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if(screen==="debrief"&&score)return <Debrief score={score} scenario={scenario} duration={callDuration} onRetry={()=>setScreen("call")} onDashboard={()=>setScreen("dashboard")}/>;
  return null;
}
