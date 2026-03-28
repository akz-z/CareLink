const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export function getGroqApiKey() {
  return process.env.GROQ_API_KEY || '';
}

export async function runGroqChat({ messages, system = '', temperature = 0.7, maxTokens = 1200 }) {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set in .env.local');
  }

  const normalizedMessages = Array.isArray(messages)
    ? messages.map((m) => ({
        role: m?.role === 'assistant' ? 'assistant' : m?.role === 'system' ? 'system' : 'user',
        content: String(m?.content ?? ''),
      }))
    : [];

  const payload = {
    model: DEFAULT_MODEL,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...normalizedMessages,
    ],
    max_tokens: maxTokens,
    temperature,
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    const errorMessage = data?.error?.message || 'Groq request failed';
    throw new Error(errorMessage);
  }

  return data?.choices?.[0]?.message?.content || '';
}
