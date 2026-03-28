import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Combine all user messages into a single text block for analysis
    const userText = messages
      .filter(m => m.role === 'user')
      .map(m => m.text)
      .join(' ')
      .toLowerCase();

    // Simulate AI processing delay
    await new Promise(r => setTimeout(r, 1400));

    // --- Mock pathway logic based on keywords ---
    let pathway = 'gp';
    let urgencyLevel = 'moderate';
    let urgencyTitle = 'See Your GP';
    let urgencyReason = 'Your symptoms suggest a routine GP review is the right next step.';
    let urgencyColor = '#1e40af';
    let urgencyBg = '#dbeafe';
    let urgencyIcon = '👨‍⚕️';

    if (/chest pain|can't breathe|breathing|stroke|unconscious|collapse|heart/.test(userText)) {
      pathway = '999';
      urgencyLevel = 'critical';
      urgencyTitle = 'Call 999 Immediately';
      urgencyReason = 'Your symptoms may indicate a life-threatening emergency. Do not wait.';
      urgencyColor = '#b91c1c';
      urgencyBg = '#fde8e8';
      urgencyIcon = '🚨';
    } else if (/a&e|accident|severe|emergency|fracture|broken|head injury|loss of/.test(userText)) {
      pathway = 'ae';
      urgencyLevel = 'urgent';
      urgencyTitle = 'Go to A&E';
      urgencyReason = 'Your symptoms require urgent in-person assessment that cannot wait for a GP appointment.';
      urgencyColor = '#c2410c';
      urgencyBg = '#ffedd5';
      urgencyIcon = '🏥';
    } else if (/rash|minor|itch|cold|flu|cough|sore throat|earache|hay fever|allergy|pharmacy/.test(userText)) {
      pathway = 'pharmacy';
      urgencyLevel = 'low';
      urgencyTitle = 'Visit a Pharmacist';
      urgencyReason = 'A local pharmacist can assess and treat your condition without needing a GP appointment.';
      urgencyColor = '#6b21a8';
      urgencyBg = '#f3e8ff';
      urgencyIcon = '💊';
    } else if (/rest|mild|tired|fatigue|slight|minor/.test(userText)) {
      pathway = 'self-care';
      urgencyLevel = 'low';
      urgencyTitle = 'Self-Care at Home';
      urgencyReason = 'Your symptoms are likely manageable at home with rest, hydration, and over-the-counter remedies.';
      urgencyColor = '#2d6a4f';
      urgencyBg = '#d8f3dc';
      urgencyIcon = '🏠';
    }

    // --- Extract key details from conversation ---
    const allText = messages.map(m => m.text).join(' ');
    
    // Simple mock extraction
    const severityMatch = allText.match(/(\d+)\s*(?:\/\s*10|out of 10)/i);
    const severity = severityMatch ? `${severityMatch[1]}/10` : 'Not specified';

    const durationMatch = allText.match(/(\d+\s*(?:day|week|hour|month|year)s?)/i);
    const duration = durationMatch ? durationMatch[1] : 'Not specified';

    // Build the structured brief
    const brief = {
      generatedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      patientSummary: `Patient reports symptoms described in their conversation. They have provided ${messages.filter(m => m.role === 'user').length} responses covering the nature, duration, and severity of their condition.`,
      mainComplaint: messages.filter(m => m.role === 'user')[0]?.text?.slice(0, 120) + '...' || 'See full conversation',
      duration,
      severity,
      associatedSymptoms: ['As described in conversation'],
      relevantHistory: 'No significant history reported',
      medications: 'None reported',
      redFlags: pathway === '999' ? ['Possible life-threatening symptoms noted'] : [],
      patientGoal: 'Seeking assessment and appropriate care pathway',
      suggestedQuestions: [
        'How long exactly have these symptoms been occurring?',
        'Have you experienced this before?',
        'Are you currently taking any medications or supplements?'
      ]
    };

    return NextResponse.json({
      pathway,
      urgencyLevel,
      urgencyTitle,
      urgencyReason,
      urgencyColor,
      urgencyBg,
      urgencyIcon,
      brief
    });

  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate triage result' }, { status: 500 });
  }
}
