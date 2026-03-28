# CareLink MVP

CareLink is a comprehensive, modern healthcare companion application designed to reduce GP surgery bottlenecks and improve patient post-discharge recovery.

## Features

1. **Smart GP Scheduler** - A heatmap-based demand management system allowing patients to find the optimal times to visit the clinic.
2. **Symptom Journal** - A tracker for recurring symptoms that generates ready-to-use clinical briefs for doctors.
3. **Post-Discharge Bot** - An automated recovery checklist paired with a 24/7 AI chatbot for basic post-procedure queries.

## Tech Stack
- Next.js 16 (React 19)
- Node.js (via Next API Routes)
- Pure Custom CSS (Design Tokens & Glassmorphism)
- Browser LocalStorage Persistence

## Getting Started

1. `npm install`
2. Create `.env.local` with: `GROQ_API_KEY=your_groq_api_key`
3. `npm run dev`
4. Click on the 3 Tools available on the main dashboard (`http://localhost:3000`).
