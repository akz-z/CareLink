"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// Mock Data
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
const REASONS = ["Routine check-up", "Follow-up", "Prescription review", "New symptom", "Vaccination", "Other"];

// Generate mock heatmap data (1 = low/green, 2 = medium/amber, 3 = high/red)
const HEATMAP_DATA = DAYS.map(day => TIMES.map(time => {
  // Mondays and early mornings are generally busier (red/3 or amber/2)
  if (day === "Monday" && parseInt(time) < 11) return 3;
  if (day === "Friday" && parseInt(time) > 15) return 3;
  // Randomness for the rest
  const val = Math.random();
  if (val > 0.7) return 3; // Red
  if (val > 0.4) return 2; // Amber
  return 1; // Green
}));

export default function Scheduler() {
  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [surgeryName, setSurgeryName] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("carelink_schedule");
    if (saved) {
      const parsed = JSON.parse(saved);
      setSelectedDay(parsed.selectedDay);
      setSelectedTime(parsed.selectedTime);
      if (parsed.surgeryName !== undefined) setSurgeryName(parsed.surgeryName);
      setReason(parsed.reason);
      setBooked(parsed.booked);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("carelink_schedule", JSON.stringify({
        selectedDay, selectedTime, surgeryName, reason, booked
      }));
    }
  }, [mounted, selectedDay, selectedTime, surgeryName, reason, booked]);

  if (!mounted) return null;

  const getSlotColor = (level) => {
    if (level === 1) return { bg: "var(--sage-light)", text: "var(--sage)", border: "var(--sage-mid)" };
    if (level === 2) return { bg: "var(--amber-light)", text: "var(--amber)", border: "#fcd9a0" };
    return { bg: "var(--red-light)", text: "var(--red)", border: "#f5c6c6" };
  };

  const handleBook = (e) => {
    e.preventDefault();
    if (selectedDay !== null && selectedTime !== null) {
      setBooked(true);
    }
  };

  if (booked) {
    return (
      <div className="app-shell">
        <header>
          <Link href="/" className="logo-wrap">
            <div className="logo-mark"><svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></div>
            <div className="logo-text">Care<span>Link</span></div>
          </Link>
        </header>
        <main className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div className="card" style={{ textAlign: "center", maxWidth: "450px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h2 className="heading-md">Appointment Requested</h2>
            <p className="text-soft" style={{ marginBottom: "1.5rem" }}>
              Your appointment request for {selectedDay} at {TIMES[selectedTime]} has been sent to {surgeryName || "your requested GP"}.
              <br/><br/>
              By choosing a lower demand slot, you are helping the surgery manage patient flow efficiently. Thank you!
            </p>
            <button className="btn-primary" onClick={() => setBooked(false)}>Book Another</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header>
        <Link href="/" className="logo-wrap">
          <div className="logo-mark"><svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></div>
          <div className="logo-text">Care<span>Link</span></div>
        </Link>
        <div className="nav-links">
          <Link href="/scheduler" className="nav-link" data-active="true">Scheduler</Link>
          <Link href="/journal" className="nav-link">Journal</Link>
          <Link href="/recovery" className="nav-link">Bot</Link>
        </div>
      </header>
      
      <main className="page-container">
        <h1 className="heading-md" style={{ marginBottom: "0.25rem" }}>Smart GP Scheduler</h1>
        <p className="text-soft" style={{ marginBottom: "2rem", maxWidth: "600px" }}>
          See exactly when the surgery is busy. Book during green slots to be seen quicker and help reduce the morning rush.
        </p>

        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Booking Form Sidebar */}
          <div className="card" style={{ flex: "1", minWidth: "300px" }}>
            <h3 style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.2rem", marginBottom: "1.5rem" }}>Visit Details</h3>
            <form onSubmit={handleBook} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>Reason for Visit</label>
                <select value={reason} onChange={e => setReason(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit", outline: "none", background: "white" }}>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>Postcode or GP Surgery Name</label>
                <input type="text" value={surgeryName} onChange={e => setSurgeryName(e.target.value)} placeholder="e.g. BA2 4BA or Widcombe Surgery" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit", outline: "none", background: "white" }} />
              </div>

              <div style={{ padding: "12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: "1.5" }}>
                {selectedDay !== null && selectedTime !== null ? (
                  <><strong>Selected Slot:</strong> {selectedDay} at {TIMES[selectedTime]}</>
                ) : (
                  <>Please select a time slot from the heatmap grid.</>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={selectedDay === null || selectedTime === null || !surgeryName.trim()} style={{ marginTop: "0.5rem", width: "100%" }}>
                Confirm Booking
              </button>
            </form>
          </div>

          {/* Heatmap Grid */}
          <div className="card" style={{ flex: "2", minWidth: "450px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
               <h3 style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.2rem" }}>Demand Heatmap</h3>
               <div style={{ display: "flex", gap: "10px", fontSize: "0.75rem", fontWeight: "600" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ display:"inline-block", width:"12px", height:"12px", background:"var(--sage-light)", border:"1px solid var(--sage-mid)", borderRadius:"3px" }}></span> Low</div>
                 <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ display:"inline-block", width:"12px", height:"12px", background:"var(--amber-light)", border:"1px solid #fcd9a0", borderRadius:"3px" }}></span> Moderate</div>
                 <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ display:"inline-block", width:"12px", height:"12px", background:"var(--red-light)", border:"1px solid #f5c6c6", borderRadius:"3px" }}></span> High</div>
               </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)`, gap: "8px", overflowX: "auto" }}>
               {/* Header Row */}
               <div></div>
               {DAYS.map(day => (
                 <div key={day} style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: "600", color: "var(--ink-soft)", paddingBottom: "10px" }}>{day.substring(0,3)}</div>
               ))}

               {/* Grid Body */}
               {TIMES.map((time, tIdx) => (
                 <div key={time} style={{ display: "contents" }}>
                   <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "10px", fontSize: "0.75rem", color: "var(--ink-faint)" }}>{time}</div>
                   {DAYS.map((day, dIdx) => {
                     const level = HEATMAP_DATA[dIdx][tIdx];
                     const colors = getSlotColor(level);
                     const isSelected = selectedDay === day && selectedTime === tIdx;
                     
                     return (
                       <button
                         key={`${day}-${time}`}
                         onClick={() => { setSelectedDay(day); setSelectedTime(tIdx); }}
                         style={{
                           background: colors.bg,
                           border: `1.5px solid ${isSelected ? "var(--ink)" : colors.border}`,
                           padding: "10px",
                           borderRadius: "6px",
                           cursor: "pointer",
                           transition: "transform 0.1s, box-shadow 0.15s",
                           opacity: level === 3 ? 0.7 : 1, // Red slots are discouraged
                           transform: isSelected ? "scale(1.05)" : "scale(1)",
                           boxShadow: isSelected ? "var(--shadow)" : "none",
                           zIndex: isSelected ? 10 : 1,
                           position: "relative"
                         }}
                         onMouseOver={(e) => { if(!isSelected) e.currentTarget.style.transform = "scale(1.03)"; }}
                         onMouseOut={(e) => { if(!isSelected) e.currentTarget.style.transform = "scale(1)"; }}
                       >
                       </button>
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
