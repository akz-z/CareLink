"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [symptom, setSymptom] = useState("Headache");
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("carelink_journal");
    if (saved) {
      setEntries(JSON.parse(saved));
    } else {
      setEntries([
        { id: 1, symptom: "Headache", severity: 4, date: "2026-03-26", time: "14:00", notes: "Felt dizzy." },
        { id: 2, symptom: "Headache", severity: 6, date: "2026-03-27", time: "09:30", notes: "Woke up with pain." }
      ]);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("carelink_journal", JSON.stringify(entries));
    }
  }, [entries, mounted]);
  
  if (!mounted) return null;

  const handleAddEntry = (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      symptom,
      severity: parseInt(severity),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes
    };
    setEntries(prev => [newEntry, ...prev]);
    setNotes("");
    setSeverity(5);
  };

  const generateSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journal/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries })
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setSummary("Error generating summary. Please try again.");
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
          <Link href="/journal" className="nav-link" data-active="true">Journal</Link>
          <Link href="/recovery" className="nav-link">Bot</Link>
        </div>
      </header>
      
      <main className="page-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <h1 className="heading-md" style={{ marginBottom: "0.25rem" }}>Symptom Journal</h1>
            <p className="text-soft" style={{ maxWidth: "500px" }}>Log daily symptoms to track patterns and automatically generate a doctor-ready brief.</p>
          </div>
          <button onClick={generateSummary} className="btn-primary" disabled={entries.length === 0 || loading}>
            {loading ? "Generating..." : "Generate Doctor Summary 🪄"}
          </button>
        </div>

        {summary && (
          <div className="card" style={{ marginBottom: "2rem", background: "var(--sage-pale)", borderColor: "var(--sage-light)" }}>
            <h3 style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.2rem", color: "var(--ink)", marginBottom: "0.5rem" }}>Clinical Summary</h3>
            <div style={{ fontSize: "0.9rem", lineHeight: "1.7", color: "var(--ink-mid)" }} dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, "<br/>") }} />
            <button className="btn-secondary" style={{ marginTop: "1.5rem" }} onClick={() => setSummary(null)}>Close Summary</button>
          </div>
        )}

        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div className="card" style={{ flex: "1", minWidth: "300px" }}>
             <h3 style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.2rem", marginBottom: "1.5rem" }}>Log a Symptom</h3>
             <form onSubmit={handleAddEntry} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>Symptom</label>
                  <select value={symptom} onChange={e => setSymptom(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "white" }}>
                    <option>Headache</option>
                    <option>Fever</option>
                    <option>Cough</option>
                    <option>Fatigue</option>
                    <option>Nausea</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                     <label style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>Severity: {severity}/10</label>
                     <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>1 = Mild, 10 = Unbearable</span>
                  </div>
                  <input type="range" min="1" max="10" value={severity} onChange={e => setSeverity(e.target.value)} style={{ width: "100%", accentColor: "var(--sage)" }}/>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>Additional Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit",  background: "white", resize: "none" }} placeholder="Any triggers, context, or remedies taken?"></textarea>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem" }}>Save Entry</button>
             </form>
          </div>

          <div style={{ flex: "2", minWidth: "350px", display: "flex", flexDirection: "column", gap: "1rem" }}>
             <h3 style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.2rem", paddingLeft: "10px" }}>History</h3>
             {entries.map(entry => (
               <div key={entry.id} className="card" style={{ padding: "1.25rem", background: "white" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: "600", fontSize: "1.05rem" }}>{entry.symptom}</span>
                      <span style={{ fontSize: "0.75rem", background: entry.severity > 7 ? "var(--red-light)" : entry.severity > 4 ? "var(--amber-light)" : "var(--sage-light)", color: entry.severity > 7 ? "var(--red)" : entry.severity > 4 ? "var(--amber)" : "var(--sage)", padding: "3px 8px", borderRadius: "20px", fontWeight: "600" }}>Severity: {entry.severity}/10</span>
                   </div>
                   <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                     {entry.date} at {entry.time}
                   </div>
                 </div>
                 {entry.notes && <p style={{ fontSize: "0.9rem", color: "var(--ink-mid)", marginTop: "0.5rem", fontStyle: "italic" }}>"{entry.notes}"</p>}
               </div>
             ))}
             {entries.length === 0 && <p className="text-soft">No entries logged yet. Record your first symptom to start tracking.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
