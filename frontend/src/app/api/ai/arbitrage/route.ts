import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/arbitrage
 * Accepts: { results: NormalizedResult[], productName: string }
 * Calls GPT-4o to identify the best arbitrage opportunity.
 * Returns: { bestSource, worstSource, savingsPercent, savingsAmount, recommendation, reasoning }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results, productName } = body;

    if (!results || !Array.isArray(results) || !productName) {
      return NextResponse.json(
        { error: 'results array and productName are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Filter to valid results only
    const valid = results.filter((r: any) => r.price != null && r.price > 0);
    if (valid.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 valid price results for arbitrage analysis' },
        { status: 400 }
      );
    }

    const prompt = `You are a procurement intelligence AI. Analyze these supplier prices for "${productName}" and identify the best arbitrage opportunity.

Supplier data:
${JSON.stringify(valid, null, 2)}

Return ONLY valid JSON with this exact shape:
{
  "bestSource": "source name with lowest price",
  "worstSource": "source name with highest price",
  "savingsPercent": 22.4,
  "savingsAmount": 214.00,
  "recommendation": "one sentence action recommendation",
  "reasoning": "2-3 sentence explanation of the opportunity"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a procurement intelligence AI. Analyze supplier prices and identify arbitrage opportunities. Return only JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from GPT-4o');

    const parsed = JSON.parse(content);

    return NextResponse.json({ success: true, ...parsed });
  } catch (error) {
    console.error('Arbitrage route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Arbitrage analysis failed' },
      { status: 500 }
    );
  }
}
