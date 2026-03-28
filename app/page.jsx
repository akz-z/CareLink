"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LoginForm from "./components/LoginForm";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Error loading user session:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // Clear session
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setIsLoggedIn(false);
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="app-shell">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontSize: "1.1rem", color: "var(--ink-soft)" }}>
          Loading...
        </div>
      </div>
    );
  }

  // Show login form if not logged in
  if (!isLoggedIn) {
    return (
      <div className="app-shell">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Show dashboard if logged in
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
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ fontSize: "0.95rem", color: "var(--ink-soft)" }}>
            Welcome, <strong>{user?.name || user?.email}</strong>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#f0e6e6",
              border: "1px solid #e0cccc",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem",
              color: "#8b4444",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#e8d5d5";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#f0e6e6";
            }}
          >
            Logout
          </button>
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
