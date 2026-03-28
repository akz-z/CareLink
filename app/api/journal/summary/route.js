import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { entries } = await req.json();

    if (!entries || entries.length === 0) {
      return NextResponse.json({ summary: "No symptom data provided." }, { status: 400 });
    }

    // Mock an AI generating a summary based on the entries passed in.
    // In a real application, you would pass these entries to an LLM like Anthropic Claude or OpenAI GPT-4.
    
    // Sort entries by oldest first
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    
    const count = sortedEntries.length;
    const firstDate = sortedEntries[0].date;
    const lastDate = sortedEntries[count - 1].date;
    
    const symptomsSet = new Set(sortedEntries.map(e => e.symptom));
    const mainSymptoms = Array.from(symptomsSet).join(" and ");

    const avgSeverity = Math.round(sortedEntries.reduce((sum, e) => sum + e.severity, 0) / count);
    const maxSeverity = Math.max(...sortedEntries.map(e => e.severity));

    const allNotes = sortedEntries.filter(e => e.notes).map(e => e.notes).join(". ");

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const generatedSummary = `
**Patient Summary:**
The patient has reported experiencing ${mainSymptoms} over a tracking period from ${firstDate} to ${lastDate} (${count} total logs). 

**Severity Trend:**
The average severity reported is **${avgSeverity}/10**, with symptom severity peaking at **${maxSeverity}/10**. 

**Additional Context & Patient Notes:**
${allNotes ? allNotes : "No additional contextual notes provided by the patient."}

**Recommendation:**
Based on the symptom log frequency and severity patterns, a routine clinical review is recommended to discuss pain management and potential underlying causes for the reported ${mainSymptoms}.
    `;

    return NextResponse.json({ summary: generatedSummary.trim() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
