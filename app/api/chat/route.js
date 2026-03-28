import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, condition } = await req.json();

    if (!message) {
      return NextResponse.json({ reply: "Please type a message." }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();

    // Escalation logic for red flag symptoms
    const redFlags = ["pain", "blood", "bleeding", "severe", "fever", "heart", "chest", "breath", "dizzy", "faint", "10/10"];
    
    const hasRedFlag = redFlags.some(flag => lowerMessage.includes(flag));

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (hasRedFlag) {
      return NextResponse.json({ 
        reply: `⚠️ **Warning:** Based on your mention of severe symptoms (like pain, bleeding, or breathing issues), this could be a complication related to your ${condition}. 
        
Please **call 111 immediately** for medical advice, or go to A&E if it is life-threatening.` 
      });
    }

    // Gentle recovery responses using generic mock AI logic
    let reply = `That's a very common question regarding ${condition ? condition : 'surgery'} recovery. Try to rest and follow your doctor's instructions. Keep staying hydrated and avoid strenuous activities for now.`;
    
    if (lowerMessage.includes("diet") || lowerMessage.includes("eat")) {
      reply = "For your diet, it's best to stick to light, easily digestible meals. Drink plenty of water. Avoid spicy or overly greasy foods until your stomach feels completely settled.";
    } else if (lowerMessage.includes("sleep") || lowerMessage.includes("tired")) {
      reply = "Fatigue is perfectly normal during the healing process. Your body is doing a lot of work right now! Ensure you are getting at least 8 hours of sleep, and don't hesitate to take naps during the day.";
    } else if (lowerMessage.includes("when") || lowerMessage.includes("how long")) {
      reply = `Recovery timelines can vary from person to person. It is extremely important that you attend your scheduled follow-up appointments so your GP can evaluate your healing progress safely.`;
    }

    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
