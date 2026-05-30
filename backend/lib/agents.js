/**
 * Multi-Agent AI Orchestration Layer for DealRadar.
 *
 * Architecture (GCP Gemini-first, OpenAI fallback):
 *   OrchestratorAgent  ← coordinates the 3 specialist agents
 *     ArbitrageAgent   ← Gemini 1.5 Flash: "who has the best deal and why?"
 *     NegotiationAgent ← Gemini 1.5 Flash: "write the procurement email"
 *     PredictionAgent  ← Gemini 1.5 Pro: "should I buy now or wait?"
 *
 * Each agent has a clear prompt contract and falls back to deterministic
 * mock data if the API key is missing — the UI always gets a valid response.
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const OPENAI_BASE = 'https://api.openai.com/v1/chat/completions';
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function callGemini(modelId, prompt, geminiKey, jsonMode = true) {
  if (!geminiKey) throw new Error('No GEMINI_API_KEY');
  const url = `${GEMINI_BASE}/${modelId}:generateContent?key=${geminiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    ...(jsonMode && { generationConfig: { responseMimeType: 'application/json' } }),
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

async function callOpenAICompat(baseUrl, apiKey, model, prompt, systemPrompt, jsonMode = true) {
  if (!apiKey) throw new Error('No API key');
  const body = {
    model,
    ...(jsonMode && { response_format: { type: 'json_object' } }),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  };
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

const callGroq = (prompt, groqKey, systemPrompt, jsonMode) =>
  callOpenAICompat(GROQ_BASE, groqKey, GROQ_MODEL, prompt, systemPrompt, jsonMode);

const callOpenAI = (prompt, openAIKey, systemPrompt, jsonMode) =>
  callOpenAICompat(OPENAI_BASE, openAIKey, 'gpt-4o', prompt, systemPrompt, jsonMode);

function parseJSON(text) {
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(clean);
}

// ─── ArbitrageAgent ───────────────────────────────────────────────────────────
// Given 7 supplier prices, identify the best buy, worst price, and savings.

async function ArbitrageAgent(results, productName, { geminiKey, openAIKey, groqKey }) {
  const systemPrompt = `You are a procurement intelligence AI. Analyze supplier prices and
identify the best arbitrage opportunity. Return ONLY valid JSON:
{ "bestSource": string, "worstSource": string, "savingsPercent": number,
  "savingsAmount": number, "recommendation": string, "reasoning": string }`;

  const userPrompt = `Product: ${productName}
Supplier price data (source, price, stock, eta, aiScore):
${JSON.stringify(results.filter((r) => r.price).map((r) => ({
  source: r.source, price: r.price, stock: r.stock, eta: r.eta, aiScore: r.aiScore,
})), null, 2)}

Identify the single best deal accounting for price, stock availability, and shipping time.
Calculate savings vs. the most expensive listed option.`;

  // Try Gemini first, OpenAI as fallback
  const tryGroq = async () => {
    const text = await callGroq(userPrompt, groqKey, systemPrompt);
    return parseJSON(text);
  };

  const tryGemini = async () => {
    const text = await callGemini('gemini-1.5-flash', `${systemPrompt}\n\n${userPrompt}`, geminiKey);
    return parseJSON(text);
  };

  const tryOpenAI = async () => {
    const text = await callOpenAI(userPrompt, openAIKey, systemPrompt);
    return parseJSON(text);
  };

  // Priority: Groq (fastest) → Gemini → OpenAI → deterministic fallback
  try {
    return groqKey ? await tryGroq() : (geminiKey ? await tryGemini() : await tryOpenAI());
  } catch (e1) {
    try {
      return geminiKey ? await tryGemini() : await tryOpenAI();
    } catch (e2) {
      try { return await tryOpenAI(); } catch {}
      // Deterministic fallback
      const sorted = [...results].filter((r) => r.price).sort((a, b) => a.price - b.price);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      if (!best || !worst) return null;
      const savingsAmount = worst.price - best.price;
      const savingsPercent = (savingsAmount / worst.price) * 100;
      return {
        bestSource: best.source,
        worstSource: worst.source,
        savingsPercent: parseFloat(savingsPercent.toFixed(1)),
        savingsAmount: parseFloat(savingsAmount.toFixed(2)),
        recommendation: 'Buy on ' + best.source,
        reasoning: `${best.source} is ${savingsPercent.toFixed(1)}% cheaper than ${worst.source} for ${productName}.`,
      };
    }
  }
}


// ─── NegotiationAgent ─────────────────────────────────────────────────────────
// Writes a professional procurement email to a supplier citing a competing price.

async function NegotiationAgent(
  { supplierName, theirPrice, bestCompetitorPrice, bestCompetitorSource, productName, quantity, customInstructions },
  { geminiKey, openAIKey, groqKey }
) {
  const systemPrompt = `You are a professional procurement negotiator. Write a concise
professional supplier outreach email requesting a price match or volume discount.
Be specific with numbers. Under 200 words. Return only the email body text.`;

  const userPrompt = `Supplier: ${supplierName} (their price: ${theirPrice})
Competing quote: ${bestCompetitorSource} at ${bestCompetitorPrice}
Product: ${productName}
Order quantity: ${quantity || 50} units
${customInstructions ? `Additional instructions: ${customInstructions}` : ''}`;

  const tryGroq = async () => callGroq(userPrompt, groqKey, systemPrompt, false);
  const tryGemini = async () => callGemini('gemini-1.5-flash', `${systemPrompt}\n\n${userPrompt}`, geminiKey, false);
  const tryOpenAI = async () => callOpenAI(userPrompt, openAIKey, systemPrompt, false);

  const fallbackEmail = `Dear ${supplierName} Account Manager,

I am writing to discuss procurement of ${quantity || 50} units of ${productName}.

We have received a quote from ${bestCompetitorSource} at ${bestCompetitorPrice} per unit. Given our order volume, would you be able to match or beat this price from your listed ${theirPrice}?

We are ready to place the order immediately upon confirmation.

Best regards,
Procurement Team`;

  try {
    return groqKey ? await tryGroq() : (geminiKey ? await tryGemini() : await tryOpenAI());
  } catch {
    try {
      return geminiKey ? await tryGemini() : await tryOpenAI();
    } catch {
      try {
        return await tryOpenAI();
      } catch {
        return fallbackEmail;
      }
    }
  }
}

// ─── PredictionAgent ──────────────────────────────────────────────────────────
// Analyzes price history and forecasts whether to buy now or wait.

async function PredictionAgent(priceHistory, productName, { geminiKey, openAIKey, groqKey }) {
  const systemPrompt = `You are a price trend analyst. Analyze the price history and return
ONLY valid JSON: { "verdict": "BUY_NOW"|"WAIT"|"UNCERTAIN", "confidence": number 0-100,
"reasoning": string, "predictedDropPercent": number, "waitDays": number }`;

  const userPrompt = `Product: ${productName}
Price history (date, price): ${JSON.stringify(priceHistory)}
Based on this trend, should the user buy now or wait for a better price?`;

  const tryGroq = async () => {
    const text = await callGroq(userPrompt, groqKey, systemPrompt);
    return parseJSON(text);
  };
  const tryGemini = async () => {
    const text = await callGemini('gemini-1.5-flash', `${systemPrompt}\n\n${userPrompt}`, geminiKey);
    return parseJSON(text);
  };
  const tryOpenAI = async () => {
    const text = await callOpenAI(userPrompt, openAIKey, systemPrompt);
    return parseJSON(text);
  };

  const predictionFallback = () => {
    if (priceHistory.length < 2) {
      return { verdict: 'UNCERTAIN', confidence: 50, reasoning: 'Insufficient data.', predictedDropPercent: 0, waitDays: 0 };
    }
    const first = priceHistory[0].price;
    const last = priceHistory[priceHistory.length - 1].price;
    const trend = last < first ? 'down' : 'up';
    return {
      verdict: trend === 'down' ? 'WAIT' : 'BUY_NOW',
      confidence: 72,
      reasoning: trend === 'down'
        ? 'Price has been declining. Waiting may yield further savings.'
        : 'Price trend is upward. Buying now is advisable.',
      predictedDropPercent: trend === 'down' ? 3.5 : 0,
      waitDays: trend === 'down' ? 3 : 0,
    };
  };

  // Prediction: Gemini first (better at trend analysis), then Groq, then OpenAI
  try {
    return geminiKey ? await tryGemini() : (groqKey ? await tryGroq() : await tryOpenAI());
  } catch {
    try {
      return groqKey ? await tryGroq() : await tryOpenAI();
    } catch {
      try {
        return await tryOpenAI();
      } catch {
        return predictionFallback();
      }
    }
  }
}

// ─── OrchestratorAgent ────────────────────────────────────────────────────────
// Coordinates all agents and returns a unified intelligence report.

async function OrchestratorAgent(results, productName, { geminiKey, openAIKey }) {
  const [arbitrage] = await Promise.allSettled([
    ArbitrageAgent(results, productName, { geminiKey, openAIKey }),
  ]);

  return {
    arbitrage: arbitrage.status === 'fulfilled' ? arbitrage.value : null,
    agentsUsed: geminiKey ? 'gemini-1.5-flash' : (openAIKey ? 'gpt-4o' : 'fallback'),
    timestamp: Date.now(),
  };
}

module.exports = {
  ArbitrageAgent,
  NegotiationAgent,
  PredictionAgent,
  OrchestratorAgent,
};
