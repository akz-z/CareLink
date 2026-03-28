"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
const REASONS = ["Routine check-up", "Follow-up", "Prescription review", "New symptom", "Vaccination", "Other"];
const HEATMAP_DATA = DAYS.map(day => TIMES.map(time => {
  if (day === "Monday" && parseInt(time) < 11) return 3;
  if (day === "Friday" && parseInt(time) > 15) return 3;
  const val = Math.random();
  return val > 0.7 ? 3 : val > 0.4 ? 2 : 1;
}));

// ─── SYSTEM PROMPT (matches careroute.html) ──────────────────────────────────
const SYSTEM_PROMPT = `You are CareRoute, a warm, professional NHS-aligned AI health triage assistant in the UK. You speak like a knowledgeable friend — clear, reassuring, never alarmist.

YOUR GOAL: Gather enough clinical information to (a) triage the patient to the right care pathway, and (b) produce a structured pre-appointment brief.

WHAT TO GATHER (across 4–7 turns):
- Main symptom(s) and description
- Duration (how long?)
- Severity (1–10 scale — always ask this explicitly)
- Associated symptoms / red flags
- Any existing medical conditions or relevant history
- Current medications and allergies
- What the patient hopes to achieve from seeing a doctor

RED FLAGS TO PROBE: chest pain, shortness of breath, sudden severe headache, loss of consciousness, blood in stool/urine/vomit, new neurological symptoms, high fever in immunocompromised, unexplained rapid weight loss.

TRIAGE LEVELS:
- EMERGENCY: 999 now (chest pain + breathlessness, stroke signs, major bleeding, severe anaphylaxis, unconscious)
- URGENT: A&E or urgent care today
- GP: GP appointment within appropriate timeframe
- PHARMACY: Pharmacist first
- SELF_CARE: Home care

ALWAYS respond ONLY with a valid JSON object — no preamble, no markdown fences:

When still gathering info:
{"status":"gathering","message":"Your conversational response here","quickReplies":["Short option 1","Short option 2","Short option 3"],"progress":30}

When you have enough info (after at least 4 user turns):
{"status":"complete","message":"Warm closing message","quickReplies":[],"progress":100,"triage":{"level":"GP","title":"Book a GP Appointment","reason":"Your symptoms suggest X. A GP can properly assess this.","urgency":"Within the next few days"},"brief":{"chiefComplaint":"One clear sentence","symptoms":["Detail 1","Detail 2"],"duration":"e.g. 5 days","severity":"6/10","redFlags":[],"history":["Relevant condition or: No significant history mentioned"],"medications":["Drug name, dose or: None mentioned"],"allergies":"NKDA","patientGoal":"What the patient wants","suggestedQuestions":["Could this be caused by X?","What tests would help?","What are the treatment options?"],"selfCare":["Stay hydrated","Rest as much as possible"]}}

Keep each message under 80 words. Be warm and human. Never be robotic.`;

// ─── SHARED HEADER ───────────────────────────────────────────────────────────
function Header() {
  return (
    <header>
      <Link href="/" className="logo-wrap">
        <div className="logo-mark">
          <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
        </div>
        <div className="logo-text">Care<span>Link</span></div>
      </Link>
      <div className="nav-links">
        <Link href="/scheduler" className="nav-link" data-active="true">Scheduler</Link>
        <Link href="/journal" className="nav-link">Journal</Link>
        <Link href="/recovery" className="nav-link">Bot</Link>
      </div>
    </header>
  );
}

// ─── STEP PROGRESS BAR ───────────────────────────────────────────────────────
function StepsBar({ step }) {
  const labels = ["Describe", "Triage", "Brief"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px" }}>
      {labels.map((label, i) => (
        <div key={label} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              border: `2px solid ${i <= step ? "var(--sage)" : "var(--border)"}`,
              background: i < step ? "var(--sage-pale)" : i === step ? "var(--sage)" : "white",
              color: i === step ? "white" : i < step ? "var(--sage)" : "#999",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", fontWeight: "500", transition: "all 0.3s"
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: "11px", color: i <= step ? "var(--sage)" : "#999", fontWeight: i <= step ? "500" : "400" }}>{label}</span>
          </div>
          {i < 2 && <div style={{ width: "56px", height: "2px", background: i < step ? "var(--sage)" : "var(--border)", margin: "0 4px", marginBottom: "16px", transition: "background 0.3s" }} />}
        </div>
      ))}
    </div>
  );
}

// ─── PHASE 1: TRIAGE CHAT ────────────────────────────────────────────────────
function TriagePage({ onComplete }) {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(10);
  const [quickReplies, setQuickReplies] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Kick off with AI opening message
  useEffect(() => { init(); }, []);

  async function callAI(msgs) {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs, system: SYSTEM_PROMPT })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const raw = data.text || '';
    try {
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      return { status: 'gathering', message: raw.slice(0, 500), quickReplies: [], progress: 30 };
    }
  }

  async function init() {
    setLoading(true);
    try {
      const parsed = await callAI([{ role: 'user', content: 'Begin the triage with a warm, brief welcome and ask what brought the patient in today. Keep it under 50 words.' }]);
      const aiMsg = { role: 'assistant', content: JSON.stringify(parsed) };
      setHistory([aiMsg]);
      setMessages([{ role: 'ai', text: parsed.message }]);
      setQuickReplies(parsed.quickReplies || []);
    } catch {
      setMessages([{ role: 'ai', text: "Hi! I'm your CareLink triage assistant. What's been bothering you today? Please describe your symptoms, when they started, and how severe they feel (1–10)." }]);
    }
    setLoading(false);
  }

  const handleSend = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading || generating) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setQuickReplies([]);

    const userMsg = { role: 'user', content: userText };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const parsed = await callAI(newHistory);
      const aiMsg = { role: 'assistant', content: JSON.stringify(parsed) };
      setHistory([...newHistory, aiMsg]);
      setProgress(parsed.progress || Math.min(90, progress + 15));

      if (parsed.status === 'complete') {
        setStep(2);
        setMessages(prev => [...prev, { role: 'ai', text: parsed.message }]);
        setLoading(false);
        setGenerating(true);
        await new Promise(r => setTimeout(r, 1200));
        onComplete(parsed);
      } else {
        setStep(Math.min(1, step + (newHistory.filter(m => m.role === 'user').length >= 2 ? 1 : 0)));
        setMessages(prev => [...prev, { role: 'ai', text: parsed.message }]);
        setQuickReplies(parsed.quickReplies || []);
        setLoading(false);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `❌ Error: ${err.message}. Make sure GROQ_API_KEY is set in .env.local` }]);
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Header />
      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "0 20px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", padding: "36px 0 28px" }}>
          <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: "300", lineHeight: "1.15", letterSpacing: "-1px", marginBottom: "14px" }}>
            Know if you need a GP — <em style={{ fontStyle: "italic", color: "var(--sage)", fontWeight: "300" }}>before you call.</em>
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--ink-soft)", lineHeight: "1.65", maxWidth: "480px", margin: "0 auto", fontWeight: "300" }}>
            Describe your symptoms and our AI will triage your need and generate a structured brief for your appointment.
          </p>
        </div>

        <StepsBar step={step} />

        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "20px", padding: "2rem", boxShadow: "0 4px 24px rgba(26,26,46,0.06)", marginBottom: "20px" }}>
          {generating ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px", gap: "16px" }}>
              <div style={{ width: "44px", height: "44px", border: "3px solid var(--mist)", borderTopColor: "var(--sage)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontSize: "0.95rem", color: "var(--ink-soft)", fontStyle: "italic" }}>Generating your care assessment and GP brief…</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "1.5rem", fontWeight: "500", marginBottom: "6px" }}>Tell me what&apos;s going on</h2>
              <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)", marginBottom: "1.5rem", fontWeight: "300" }}>Chat naturally — I&apos;ll ask a few follow-up questions, then assess your situation.</p>

              {/* Progress bar */}
              {messages.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ flex: 1, height: "3px", background: "var(--border-soft)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "var(--sage)", borderRadius: "99px", width: `${progress}%`, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{progress < 50 ? "Gathering symptoms…" : progress < 80 ? "Assessing severity…" : "Finalising…"}</span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "12px", maxHeight: "360px", overflowY: "auto" }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", background: m.role === "ai" ? "var(--sage)" : "var(--ink)", color: "white", fontWeight: "600" }}>
                      {m.role === "ai" ? "✚" : "You"}
                    </div>
                    <div style={{ maxWidth: "82%", padding: "12px 16px", borderRadius: "16px", fontSize: "0.92rem", lineHeight: "1.65", background: m.role === "ai" ? "white" : "var(--ink)", border: m.role === "ai" ? "1px solid var(--border)" : "none", color: m.role === "ai" ? "var(--ink)" : "white", borderBottomLeftRadius: m.role === "ai" ? "4px" : "16px", borderBottomRightRadius: m.role === "user" ? "4px" : "16px" }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--sage)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✚</div>
                    <div style={{ padding: "14px 18px", borderRadius: "16px", borderBottomLeftRadius: "4px", background: "white", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", gap: "5px" }}>
                        {[0,1,2].map(n => <span key={n} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--mist)", display: "inline-block", animation: `bounce 1.2s infinite ${n * 0.2}s` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies */}
              {quickReplies.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                  {quickReplies.map((qr, i) => (
                    <button key={i} onClick={() => handleSend(qr)}
                      style={{ background: "white", border: "1.5px solid var(--sage)", color: "var(--sage)", padding: "5px 13px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "500", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "var(--sage)"; e.currentTarget.style.color = "white"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "var(--sage)"; }}>
                      {qr}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <textarea ref={textareaRef} value={input}
                  onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  rows={1} placeholder="Describe your symptoms…" disabled={loading || generating}
                  style={{ flex: 1, resize: "none", border: "1.5px solid var(--border)", borderRadius: "12px", padding: "12px 16px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.92rem", background: "white", color: "var(--ink)", outline: "none", lineHeight: "1.5", minHeight: "48px", maxHeight: "120px", transition: "border-color 0.2s" }}
                  onFocus={e => e.target.style.borderColor = "var(--sage)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"} />
                <button onClick={() => handleSend()} disabled={loading || !input.trim() || generating}
                  style={{ width: "48px", height: "48px", borderRadius: "12px", border: "none", background: input.trim() && !loading ? "var(--sage)" : "var(--mist)", color: "white", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: "14px 18px", background: "#FFF8E8", border: "1px solid #F0D080", borderRadius: "10px", fontSize: "0.82rem", color: "#7A6020", lineHeight: "1.55" }}>
          ⚠️ <strong>This is not medical advice.</strong> CareLink is an AI tool for guidance only. If you are experiencing a medical emergency, call <strong>999</strong>. For urgent non-emergency care, call <strong>NHS 111</strong>.
        </div>
      </main>
      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:0.4;}30%{transform:translateY(-6px);opacity:1;} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── PHASE 2: RESULTS (matches careroute.html format) ────────────────────────
function ResultsPage({ data, onBookGP }) {
  const [copied, setCopied] = useState(false);
  const t = data?.triage || {};
  const b = data?.brief || {};

  const lvlMap = {
    EMERGENCY: { cls: "emergency", icon: "🚨", eyebrow: "Emergency — Act Now", color: "#b91c1c", bg: "#fde8e8", border: "#f5c6c6" },
    URGENT:    { cls: "urgent",    icon: "⚡", eyebrow: "Urgent Care Needed",  color: "#c2410c", bg: "#ffedd5", border: "#fcd9a0" },
    GP:        { cls: "gp",        icon: "🏥", eyebrow: "GP Appointment Recommended", color: "#1e40af", bg: "#dbeafe", border: "#bfcfef" },
    PHARMACY:  { cls: "pharmacy",  icon: "💊", eyebrow: "See Your Pharmacist", color: "#6b21a8", bg: "#f3e8ff", border: "#ddc6f5" },
    SELF_CARE: { cls: "self-care", icon: "🏠", eyebrow: "Self-Care at Home",  color: "#2d6a4f", bg: "#d8f3dc", border: "#b7e4c7" },
  };
  const lc = lvlMap[t.level] || lvlMap.GP;

  const pathways = [
    { icon: "🚑", name: "999 / A&E",     desc: "Life-threatening emergency",   levels: ["EMERGENCY"] },
    { icon: "⚡", name: "Urgent Care",   desc: "Same-day treatment centre",    levels: ["URGENT"] },
    { icon: "🏥", name: "GP Surgery",    desc: "Book a GP appointment",         levels: ["GP"] },
    { icon: "💊", name: "Pharmacist",    desc: "Expert advice, no appointment", levels: ["PHARMACY"] },
    { icon: "🏠", name: "Self-Care",     desc: "Rest & home treatment",         levels: ["SELF_CARE"] },
  ];

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleCopy = () => {
    const lines = [
      `CARELINK PRE-APPOINTMENT BRIEF`, `Generated: ${new Date().toLocaleString('en-GB')}`,
      `Triage: ${t.title} (${t.level})`, `Urgency: ${t.urgency || '—'}`, '',
      `CHIEF COMPLAINT`, b.chiefComplaint || '—', '',
      `SYMPTOMS`, ...(b.symptoms || []).map(s => `• ${s}`), '',
      `DURATION: ${b.duration || '—'}    SEVERITY: ${b.severity || '—'}`, '',
      `RED FLAGS: ${b.redFlags?.length ? b.redFlags.join(', ') : 'None'}`, '',
      `MEDICAL HISTORY`, ...(b.history || ['None mentioned']).map(h => `• ${h}`), '',
      `MEDICATIONS`, ...(b.medications || ['None mentioned']).map(m => `• ${m}`),
      `ALLERGIES: ${b.allergies || 'Not stated'}`, '',
      `PATIENT GOAL`, b.patientGoal || '—', '',
      `QUESTIONS FOR GP`, ...(b.suggestedQuestions || []).map((q, i) => `${i+1}. ${q}`), '',
      `SELF-CARE WHILE WAITING`, ...(b.selfCare || []).map(s => `• ${s}`), '',
      `--- Generated by CareLink AI. Not a substitute for medical advice. ---`
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const s = (style) => style; // passthrough for readability
  const sectionStyle = { padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-soft)", borderRight: "1px solid var(--border-soft)" };
  const labelStyle = { fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-soft)", marginBottom: "8px" };

  return (
    <div className="app-shell">
      <Header />
      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "2rem 20px 80px", position: "relative", zIndex: 1 }}>

        <div style={{ textAlign: "center", marginBottom: "2rem", animation: "fadeUp 0.4s ease" }}>
          <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: "500", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>Your Care Assessment</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.95rem" }}>Based on your responses, here is your recommended pathway and GP brief.</p>
        </div>

        {/* Triage Banner */}
        <div style={{ borderRadius: "16px", padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start", background: lc.bg, border: `1.5px solid ${lc.border}`, marginBottom: "1.25rem", animation: "fadeUp 0.4s ease" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0, background: lc.bg }}>
            {lc.icon}
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: lc.color, opacity: 0.7, marginBottom: "4px" }}>{lc.eyebrow}</div>
            <div style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "1.55rem", fontWeight: "500", letterSpacing: "-0.02em", color: lc.color, marginBottom: "6px" }}>{t.title || "GP Appointment Recommended"}</div>
            <div style={{ fontSize: "0.88rem", lineHeight: "1.65", color: lc.color, opacity: 0.8 }}>
              {t.reason}{t.urgency && <><br /><strong>Timeframe:</strong> {t.urgency}</>}
            </div>
          </div>
        </div>

        {/* Pathway Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px", marginBottom: "1.25rem", animation: "fadeUp 0.4s 0.08s ease both" }}>
          {pathways.map(p => {
            const isSelected = p.levels.includes(t.level);
            return (
              <div key={p.name} style={{ background: isSelected ? "var(--sage-pale)" : "white", border: `1.5px solid ${isSelected ? "var(--sage)" : "var(--border)"}`, borderRadius: "14px", padding: "1rem", textAlign: "center", transition: "all 0.2s", boxShadow: isSelected ? "0 2px 8px rgba(45,106,79,0.15)" : "none" }}>
                <div style={{ fontSize: "1.75rem", marginBottom: "6px" }}>{p.icon}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: "600", color: isSelected ? "var(--sage)" : "var(--ink)", marginBottom: "3px" }}>{p.name}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--ink-soft)", lineHeight: "1.4" }}>{p.desc}</div>
                {isSelected && <div style={{ marginTop: "6px", fontSize: "0.62rem", background: "var(--sage)", color: "white", borderRadius: "99px", padding: "2px 7px", display: "inline-block" }}>✓ Recommended</div>}
              </div>
            );
          })}
        </div>

        {/* GP Brief */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "18px", boxShadow: "0 4px 16px rgba(13,17,23,0.1)", overflow: "hidden", marginBottom: "1.25rem", animation: "fadeUp 0.4s 0.12s ease both" }}>
          {/* Brief header */}
          <div style={{ background: "var(--ink)", color: "white", padding: "1.25rem 1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "1.2rem", fontWeight: "500", letterSpacing: "-0.02em", marginBottom: "3px" }}>Pre-Appointment Brief</h2>
              <p style={{ fontSize: "0.75rem", opacity: 0.5, fontWeight: "300" }}>{today}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: "0.68rem", fontWeight: "600", padding: "4px 10px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.title}</div>
              <button onClick={handleCopy} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "7px 14px", borderRadius: "8px", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px", transition: "background 0.2s" }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
                onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}>
                {copied ? "✓ Copied!" : "📋 Copy Brief"}
              </button>
            </div>
          </div>

          {/* Brief Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {/* Chief Complaint — full width */}
            <div style={{ ...sectionStyle, gridColumn: "1/-1", borderRight: "none" }}>
              <div style={labelStyle}>Chief Complaint</div>
              <p style={{ fontSize: "0.88rem", lineHeight: "1.65", color: "var(--ink-mid)" }}>{b.chiefComplaint || "—"}</p>
            </div>
            {/* Symptom Details — full width */}
            <div style={{ ...sectionStyle, gridColumn: "1/-1", borderRight: "none" }}>
              <div style={labelStyle}>Symptom Details</div>
              <ul style={{ paddingLeft: "1.1rem" }}>
                {(b.symptoms || ["As described in conversation"]).map((s, i) => (
                  <li key={i} style={{ fontSize: "0.88rem", lineHeight: "1.65", color: "var(--ink-mid)", marginBottom: "3px" }}>{s}</li>
                ))}
              </ul>
            </div>
            {/* Duration */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Duration</div>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-mid)" }}>{b.duration || "—"}</p>
            </div>
            {/* Severity */}
            <div style={{ ...sectionStyle, borderRight: "none" }}>
              <div style={labelStyle}>Severity (Self-Reported)</div>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-mid)" }}>{b.severity || "—"}</p>
            </div>
            {/* Red Flags — full width */}
            <div style={{ ...sectionStyle, gridColumn: "1/-1", borderRight: "none" }}>
              <div style={labelStyle}>Red Flags / Concerning Features</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {b.redFlags?.length
                  ? b.redFlags.map((f, i) => <span key={i} style={{ fontSize: "0.73rem", fontWeight: "500", padding: "3px 9px", borderRadius: "999px", background: "#fde8e8", color: "#c0392b" }}>⚠ {f}</span>)
                  : <span style={{ fontSize: "0.73rem", padding: "3px 9px", borderRadius: "999px", background: "var(--surface)", color: "var(--ink-soft)", border: "1px solid var(--border)" }}>None identified</span>
                }
              </div>
            </div>
            {/* Medical History */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Relevant Medical History</div>
              <ul style={{ paddingLeft: "1.1rem" }}>
                {(b.history || ["Not provided"]).map((h, i) => <li key={i} style={{ fontSize: "0.88rem", lineHeight: "1.65", color: "var(--ink-mid)", marginBottom: "3px" }}>{h}</li>)}
              </ul>
            </div>
            {/* Medications & Allergies */}
            <div style={{ ...sectionStyle, borderRight: "none" }}>
              <div style={labelStyle}>Medications & Allergies</div>
              <ul style={{ paddingLeft: "1.1rem" }}>
                {(b.medications || ["None mentioned"]).map((m, i) => <li key={i} style={{ fontSize: "0.88rem", lineHeight: "1.65", color: "var(--ink-mid)", marginBottom: "3px" }}>{m}</li>)}
              </ul>
              <p style={{ marginTop: "6px", fontSize: "0.8rem", color: "var(--ink-soft)" }}>Allergies: {b.allergies || "Not stated"}</p>
            </div>
            {/* Patient Goal — full width */}
            <div style={{ ...sectionStyle, gridColumn: "1/-1", borderRight: "none" }}>
              <div style={labelStyle}>Patient&apos;s Goal for This Appointment</div>
              <p style={{ fontSize: "0.88rem", lineHeight: "1.65", color: "var(--ink-mid)" }}>{b.patientGoal || "—"}</p>
            </div>
            {/* Suggested Questions — full width */}
            <div style={{ ...sectionStyle, gridColumn: "1/-1", borderRight: "none" }}>
              <div style={labelStyle}>Suggested Questions to Ask Your GP</div>
              {(b.suggestedQuestions || []).map((q, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", padding: "7px 0", borderBottom: i < (b.suggestedQuestions?.length || 0) - 1 ? "1px solid var(--border-soft)" : "none", fontSize: "0.86rem", color: "var(--ink-mid)", lineHeight: "1.5" }}>
                  <span style={{ width: "20px", height: "20px", background: "var(--sage-light)", color: "var(--sage)", borderRadius: "50%", fontSize: "0.65rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>{i+1}</span>
                  {q}
                </div>
              ))}
            </div>
            {/* Self-Care — full width */}
            {b.selfCare?.length > 0 && (
              <div style={{ ...sectionStyle, gridColumn: "1/-1", borderRight: "none", borderBottom: "none" }}>
                <div style={labelStyle}>Immediate Self-Care While Waiting</div>
                <ul style={{ paddingLeft: "1.1rem" }}>
                  {b.selfCare.map((s, i) => <li key={i} style={{ fontSize: "0.88rem", lineHeight: "1.65", color: "var(--ink-mid)", marginBottom: "3px" }}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", animation: "fadeUp 0.4s 0.16s ease both" }}>
          {(t.level === "GP" || t.level === "PHARMACY" || t.level === "URGENT") && (
            <button className="btn-primary" onClick={onBookGP} style={{ flex: 1, minWidth: "200px" }}>📅 Book GP Appointment</button>
          )}
          <button onClick={() => window.print()} style={{ flex: 1, minWidth: "140px", padding: "12px 20px", background: "white", border: "1.5px solid var(--border)", borderRadius: "10px", fontSize: "0.84rem", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>🖨️ Print / PDF</button>
          <button onClick={() => window.location.reload()} style={{ flex: 1, minWidth: "140px", padding: "12px 20px", background: "transparent", border: "none", borderRadius: "10px", fontSize: "0.84rem", fontWeight: "500", cursor: "pointer", color: "var(--ink-soft)", fontFamily: "inherit" }}>↩ Start Over</button>
        </div>

        <div style={{ marginTop: "1.5rem", padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", fontSize: "0.77rem", color: "#78350f", lineHeight: "1.55", animation: "fadeUp 0.4s 0.2s ease both" }}>
          ⚠️ <strong>Medical disclaimer:</strong> CareLink is an AI-powered guide. It does not constitute medical advice or diagnosis. Always consult a qualified healthcare professional. In a life-threatening emergency, call 999 immediately.
        </div>
      </main>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
        @media print { header, .nav-links { display: none !important; } }
      `}</style>
    </div>
  );
}

// ─── PHASE 3: BOOKING / HEATMAP ──────────────────────────────────────────────
function BookingPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [surgeryName, setSurgeryName] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("carelink_schedule");
    if (saved) {
      const p = JSON.parse(saved);
      setSelectedDay(p.selectedDay); setSelectedTime(p.selectedTime);
      if (p.surgeryName !== undefined) setSurgeryName(p.surgeryName);
      setReason(p.reason); setBooked(p.booked);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("carelink_schedule", JSON.stringify({ selectedDay, selectedTime, surgeryName, reason, booked }));
  }, [mounted, selectedDay, selectedTime, surgeryName, reason, booked]);

  if (!mounted) return null;

  const getSlotColor = (level) => {
    if (level === 1) return { bg: "var(--sage-light)", border: "var(--sage-mid)" };
    if (level === 2) return { bg: "var(--amber-light)", border: "#fcd9a0" };
    return { bg: "var(--red-light)", border: "#f5c6c6" };
  };

  if (booked) {
    return (
      <div className="app-shell"><Header />
        <main className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div className="card" style={{ textAlign: "center", maxWidth: "480px" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>✅</div>
            <h2 className="heading-md" style={{ marginBottom: "0.75rem" }}>Appointment Requested</h2>
            <p className="text-soft" style={{ marginBottom: "1.5rem", lineHeight: "1.7" }}>
              Your appointment for <strong>{selectedDay}</strong> at <strong>{TIMES[selectedTime]}</strong> has been sent to <strong>{surgeryName}</strong>.
            </p>
            <button className="btn-primary" onClick={() => { setBooked(false); setSelectedDay(null); setSelectedTime(null); }}>Book Another</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell"><Header />
      <main className="page-container">
        <div style={{ marginBottom: "2rem" }}>
          <h1 className="heading-md" style={{ marginBottom: "0.25rem" }}>Smart GP Scheduler</h1>
          <p className="text-soft">Choose a green slot to be seen quicker and help reduce peak-hour pressure.</p>
        </div>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div className="card" style={{ flex: "1", minWidth: "280px" }}>
            <h3 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "1.2rem", marginBottom: "1.5rem" }}>Visit Details</h3>
            <form onSubmit={e => { e.preventDefault(); if (selectedDay !== null && selectedTime !== null && surgeryName.trim()) setBooked(true); }} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>Postcode or GP Surgery Name</label>
                <input type="text" value={surgeryName} onChange={e => setSurgeryName(e.target.value)} placeholder="e.g. BA2 4BA or Widcombe Surgery" required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit", outline: "none", background: "white" }}
                  onFocus={e => e.target.style.borderColor = "var(--sage)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>Reason for Visit</label>
                <select value={reason} onChange={e => setReason(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit", background: "white" }}>
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ padding: "12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                {selectedDay !== null && selectedTime !== null ? <><strong>Selected:</strong> {selectedDay} at {TIMES[selectedTime]}</> : <>👆 Click a time slot on the heatmap.</>}
              </div>
              <button type="submit" className="btn-primary" disabled={!selectedDay || selectedTime === null || !surgeryName.trim()} style={{ width: "100%" }}>Confirm Booking</button>
            </form>
          </div>
          <div className="card" style={{ flex: "2", minWidth: "420px", overflowX: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "1.2rem" }}>Demand Heatmap</h3>
              <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", fontWeight: "600" }}>
                {[["var(--sage-light)", "var(--sage-mid)", "Low"], ["var(--amber-light)", "#fcd9a0", "Moderate"], ["var(--red-light)", "#f5c6c6", "High"]].map(([bg, border, label]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ display: "inline-block", width: "12px", height: "12px", background: bg, border: `1px solid ${border}`, borderRadius: "3px" }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `72px repeat(${DAYS.length}, 1fr)`, gap: "6px" }}>
              <div />
              {DAYS.map(day => <div key={day} style={{ textAlign: "center", fontSize: "0.78rem", fontWeight: "600", color: "var(--ink-soft)", paddingBottom: "8px" }}>{day.substring(0, 3)}</div>)}
              {TIMES.map((time, tIdx) => (
                <div key={time} style={{ display: "contents" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "10px", fontSize: "0.72rem", color: "var(--ink-faint)" }}>{time}</div>
                  {DAYS.map((day, dIdx) => {
                    const level = HEATMAP_DATA[dIdx][tIdx];
                    const colors = getSlotColor(level);
                    const isSelected = selectedDay === day && selectedTime === tIdx;
                    return (
                      <button key={`${day}-${time}`} onClick={() => { setSelectedDay(day); setSelectedTime(tIdx); }}
                        style={{ background: isSelected ? "var(--sage)" : colors.bg, border: `1.5px solid ${isSelected ? "var(--sage)" : colors.border}`, padding: "10px 6px", borderRadius: "6px", cursor: "pointer", transition: "transform 0.1s", opacity: level === 3 && !isSelected ? 0.65 : 1, transform: isSelected ? "scale(1.06)" : "scale(1)", boxShadow: isSelected ? "0 4px 12px rgba(45,106,79,0.3)" : "none" }}
                        onMouseOver={e => { if (!isSelected) e.currentTarget.style.transform = "scale(1.04)"; }}
                        onMouseOut={e => { if (!isSelected) e.currentTarget.style.transform = "scale(1)"; }} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── ROOT ORCHESTRATOR ────────────────────────────────────────────────────────
export default function Scheduler() {
  const [phase, setPhase] = useState("triage");
  const [triageData, setTriageData] = useState(null);

  return (
    <>
      {phase === "triage" && <TriagePage onComplete={(data) => { setTriageData(data); setPhase("results"); }} />}
      {phase === "results" && <ResultsPage data={triageData} onBookGP={() => setPhase("booking")} />}
      {phase === "booking" && <BookingPage />}
    </>
  );
}
