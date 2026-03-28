"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthForm from "./components/AuthForm";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Check if user is already logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    await fetch("/api/auth/logout", { method: "POST" });
  };

  if (!mounted || loading) return null;

  // Show auth form if not authenticated
  if (!user) {
    return <AuthForm onLoginSuccess={handleLoginSuccess} />;
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", background: "var(--sage-pale)", color: "var(--sage)", padding: "4px 10px", borderRadius: "20px", fontWeight: "500", letterSpacing: "0.3px", textTransform: "uppercase" }}>
            3 Tools in 1 App
          </span>
          <div style={{ fontSize: "12px", color: "var(--text-soft)" }}>
            {user?.name && <span>{user.name}</span>}
            <button
              onClick={handleLogout}
              style={{
                marginLeft: "15px",
                padding: "6px 12px",
                background: "var(--sage-pale)",
                color: "var(--sage)",
                border: "1px solid var(--sage)",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "500",
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "var(--sage)";
                e.currentTarget.style.color = "white";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "var(--sage-pale)";
                e.currentTarget.style.color = "var(--sage)";
              }}
            >
              Logout
            </button>
          </div>
        </div>
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
