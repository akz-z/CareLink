"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="app-shell">
      <header>
        <Link href="/" className="logo-wrap">
          <div className="logo-mark">
            <svg viewBox="0 0 24 24">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="logo-text">
            Care<span>Link</span>
          </div>
        </Link>
        <div />
      </header>

      <main className="page-container">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontFamily: "var(--font-fraunces)", fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: "500", letterSpacing: "-0.03em", marginBottom: "1rem" }}>
            Healthcare, <em style={{ fontStyle: "italic", color: "var(--sage)" }}>reimagined</em>
          </h1>
          <p className="text-soft" style={{ maxWidth: "500px", margin: "0 auto", fontSize: "1rem" }}>
            Select one of our specialized tools to start managing your health journey, booking appointments smarter, or tracking your recovery.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
          <Link href="/scheduler" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", height: "100%" }}
                 onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                 onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📅</div>
              <h2 className="heading-md" style={{ color: "var(--ink)" }}>Smart GP Scheduler</h2>
              <p className="text-soft">
                View a demand heatmap to book the optimal slot.
              </p>
            </div>
          </Link>

          <Link href="/journal" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", height: "100%" }}
                 onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                 onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📋</div>
              <h2 className="heading-md" style={{ color: "var(--ink)" }}>Symptom Journal</h2>
              <p className="text-soft">
                Track your symptoms and generate clinical summaries for your doctor.
              </p>
            </div>
          </Link>

          <Link href="/recovery" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", height: "100%" }}
                 onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                 onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🤖</div>
              <h2 className="heading-md" style={{ color: "var(--ink)" }}>Post-Discharge Bot</h2>
              <p className="text-soft">
                Personalized 24/7 recovery checklists and an AI chatbot.
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
