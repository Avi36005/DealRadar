import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/predict
 * Accepts: { priceHistory: [{date, price, source}], productName: string }
 * Calls Gemini to predict buy/wait/uncertain verdict.
 * Returns: { verdict, confidence, reasoning, predictedDropPercent, waitDays }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceHistory, productName } = body;

    if (!priceHistory || !Array.isArray(priceHistory) || !productName) {
      return NextResponse.json(
        { error: 'priceHistory array and productName are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Analyze this price history for "${productName}" and predict whether to buy now or wait.

Price history data:
${JSON.stringify(priceHistory, null, 2)}

Return ONLY valid JSON with this exact shape:
{
  "verdict": "BUY_NOW" | "WAIT" | "UNCERTAIN",
  "confidence": 85,
  "reasoning": "2-3 sentence explanation",
  "predictedDropPercent": 8.5,
  "waitDays": 48
}`;

    // Gemini 1.5 Flash endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 400,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini error: ${err}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ success: true, ...parsed });
  } catch (error) {
    console.error('Predict route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Prediction failed' },
      { status: 500 }
    );
  }
}
