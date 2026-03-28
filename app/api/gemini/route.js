import { NextResponse } from 'next/server';
import { runGroqChat } from '../_lib/groq';

export async function POST(req) {
  try {
    const { messages = [], system = '' } = await req.json();
    const text = await runGroqChat({ messages, system, temperature: 0.7, maxTokens: 1200 });
    return NextResponse.json({ text });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
