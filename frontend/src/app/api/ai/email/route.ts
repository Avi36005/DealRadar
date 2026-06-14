import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/email
 * Accepts: {
 *   supplierName: string,
 *   theirPrice: number,
 *   bestCompetitorPrice: number,
 *   bestCompetitorSource: string,
 *   productName: string,
 *   quantity: number,
 *   customInstructions?: string
 * }
 * Calls GPT-4o to generate a professional negotiation email.
 * Returns: { emailBody: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      supplierName,
      theirPrice,
      bestCompetitorPrice,
      bestCompetitorSource,
      productName,
      quantity,
      customInstructions = '',
    } = body;

    if (!supplierName || !theirPrice || !bestCompetitorPrice || !productName || !quantity) {
      return NextResponse.json(
        {
          error:
            'supplierName, theirPrice, bestCompetitorPrice, bestCompetitorSource, productName, and quantity are required',
        },
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

    const userPrompt = `Write a negotiation email to ${supplierName} for ${productName}.
Their current price: $${theirPrice} per unit.
Best competitor price: $${bestCompetitorPrice} per unit from ${bestCompetitorSource}.
Order quantity: ${quantity} units.
${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

Return only the email body text (no subject line, no JSON wrapper).`;

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
              'You are a professional procurement negotiator. Write a concise professional supplier outreach email requesting a price match or volume discount based on a competing price. Be specific with numbers. Under 200 words. Return only the email body.',
          },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 350,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = await response.json();
    const emailBody = data.choices?.[0]?.message?.content?.trim();
    if (!emailBody) throw new Error('Empty response from GPT-4o');

    return NextResponse.json({ success: true, emailBody });
  } catch (error) {
    console.error('Email route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Email generation failed' },
      { status: 500 }
    );
  }
}
