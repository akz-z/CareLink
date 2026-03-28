import { NextResponse } from 'next/server';
import { runGroqChat } from '../_lib/groq';

const RECOVERY_SYSTEM_PROMPT = `You are CareLink Connect, a post-discharge recovery assistant for UK patients.

Rules:
- Keep responses warm, practical, and under 120 words.
- Give general guidance only, not diagnosis.
- If symptoms sound severe or urgent (chest pain, severe bleeding, breathing difficulty, fainting, confusion), instruct user to call NHS 111 or 999 immediately.
- If unsure, be cautious and advise medical review.
- Avoid markdown and avoid claims of certainty.`;

export async function POST(req) {
  try {
    const { message, condition } = await req.json();

    if (!message) {
      return NextResponse.json({ reply: "Please type a message." }, { status: 400 });
    }

    const contextLine = condition
      ? `Patient procedure/condition: ${condition}.`
      : 'Patient procedure/condition: not provided.';

    const reply = await runGroqChat({
      system: RECOVERY_SYSTEM_PROMPT,
      messages: [
        { role: 'assistant', content: contextLine },
        { role: 'user', content: message },
      ],
      temperature: 0.5,
      maxTokens: 450,
    });

    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}
