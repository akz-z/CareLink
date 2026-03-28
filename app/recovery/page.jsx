"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function Recovery() {
  const [mounted, setMounted] = useState(false);
  const [profileSet, setProfileSet] = useState(false);
  const [condition, setCondition] = useState("");
  const [date, setDate] = useState("");
  const [meds, setMeds] = useState("");

  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi there! I'm your recovery coach. How are you feeling today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("carelink_recovery");
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfileSet(parsed.profileSet);
      setCondition(parsed.condition);
      setDate(parsed.date);
      setMeds(parsed.meds);
      setMessages(parsed.messages);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("carelink_recovery", JSON.stringify({
        profileSet, condition, date, meds, messages
      }));
    }
  }, [mounted, profileSet, condition, date, meds, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSetup = (e) => {
    e.preventDefault();
    if(condition && date) {
      setProfileSet(true);
      setMessages([{ role: 'assistant', content: `Hello! I see you had a procedure for ${condition} recently. I'm here to support your recovery. What's on your mind today?` }]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, condition })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please call 111 if you need urgent help." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header>
        <Link href="/" className="logo-wrap">
          <div className="logo-mark"><svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></div>
          <div className="logo-text">Care<span>Link</span></div>
        </Link>
        <div className="nav-links">
          <Link href="/scheduler" className="nav-link">Scheduler</Link>
          <Link href="/journal" className="nav-link">Journal</Link>
          <Link href="/recovery" className="nav-link" data-active="true">Bot</Link>
        </div>
      </header>
      
      <main className="page-container">
        {!profileSet ? (
          <div className="card" style={{ maxWidth: "500px", margin: "0 auto", marginTop: "2rem" }}>
            <h1 className="heading-md" style={{ marginBottom: "0.25rem", textAlign: "center" }}>Discharge Profile</h1>
            <p className="text-soft" style={{ textAlign: "center", marginBottom: "2rem" }}>Set up your recovery timeline and instructions.</p>

            <form onSubmit={handleSetup} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>Condition / Procedure</label>
                <input required type="text" value={condition} onChange={e => setCondition(e.target.value)} placeholder="e.g. Broken Arm, Appendectomy" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit", background: "white" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>Date of Discharge</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit", background: "white" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>Prescribed Medications (Optional)</label>
                <input type="text" value={meds} onChange={e => setMeds(e.target.value)} placeholder="e.g. Ibuprofen, Amoxicillin" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit", background: "white" }} />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: "1rem" }}>Generate Recovery Plan</button>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
              <div>
                <h1 className="heading-md" style={{ marginBottom: "0.25rem" }}>Recovery Dashboard</h1>
                <p className="text-soft">Tracking progress for: <strong>{condition}</strong></p>
              </div>
              <button className="btn-secondary" onClick={() => setProfileSet(false)} style={{ padding: "8px 16px", fontSize: "0.8rem" }}>Reset Profile</button>
            </div>

            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {/* Checklist & Progess */}
              <div className="card" style={{ flex: "1", minWidth: "300px", height: "fit-content" }}>
                <h3 style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.2rem", marginBottom: "1.5rem" }}>Recovery Progress</h3>
                
                <div style={{ background: "var(--surface)", height: "8px", borderRadius: "10px", overflow: "hidden", marginBottom: "1.5rem", border: "1px solid var(--border)" }}>
                   <div style={{ width: "65%", background: "var(--sage)", height: "100%", borderRadius: "10px", transition: "width 1s ease-in-out" }}></div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "var(--ink-mid)" }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: "var(--sage)", width: "18px", height: "18px" }} /> Rest for 48 hours post-discharge
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "var(--ink-mid)" }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: "var(--sage)", width: "18px", height: "18px" }} /> Take prescribed medications
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "var(--ink-mid)" }}>
                    <input type="checkbox" style={{ accentColor: "var(--sage)", width: "18px", height: "18px" }} /> Start gentle physical therapy exercises
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "var(--ink-mid)" }}>
                    <input type="checkbox" style={{ accentColor: "var(--sage)", width: "18px", height: "18px" }} /> Schedule follow up in 2 weeks
                  </label>
                </div>

                {meds && (
                  <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--border-soft)" }}>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--ink)", marginBottom: "0.5rem" }}>Medication Reminder</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Make sure to take: <strong>{meds}</strong></p>
                  </div>
                )}
              </div>

              {/* Chatbot */}
              <div className="card" style={{ flex: "1", minWidth: "350px", padding: "0", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid var(--border)", height: "500px" }}>
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-soft)", background: "#fafbfc", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", background: "var(--sage)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🤖</div>
                  <div>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--ink)" }}>CareLink Connect</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "var(--sage)", fontWeight: "500" }}>
                      <span style={{ display:"inline-block", width:"6px", height:"6px", background:"var(--sage-mid)", borderRadius:"50%" }}></span> 24/7 AI Available
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", flexDirection: m.role === 'user' ? "row-reverse" : "row" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: m.role === 'user' ? "var(--ink)" : "var(--sage-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: m.role === 'user' ? "white" : "var(--sage)", flexShrink: 0 }}>
                        {m.role === 'user' ? "You" : "✚"}
                      </div>
                      <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: "16px", fontSize: "0.88rem", lineHeight: "1.5", background: m.role === 'user' ? "var(--sage)" : "var(--surface)", color: m.role === 'user' ? "white" : "var(--ink)", border: m.role === 'user' ? "none" : "1px solid var(--border-soft)", borderBottomLeftRadius: m.role === 'user' ? "16px" : "4px", borderBottomRightRadius: m.role === 'user' ? "4px" : "16px" }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--sage-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✚</div>
                      <div style={{ padding: "12px 16px", borderRadius: "16px", background: "var(--surface)", border: "1px solid var(--border-soft)", borderBottomLeftRadius: "4px" }}>...</div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} style={{ borderTop: "1px solid var(--border-soft)", padding: "1rem", display: "flex", gap: "8px", background: "#fafbfc" }}>
                  <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about pain, diet, activities..." style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.88rem", outline: "none", fontFamily: "inherit" }} />
                  <button type="submit" disabled={loading} style={{ background: "var(--sage)", color: "white", padding: "0 18px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "600", transition: "0.2s" }}>
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
