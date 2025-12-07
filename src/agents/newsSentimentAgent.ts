import { TradingAgent, AgentRunResult } from "../core/agentBase";
import { callLlm } from "../core/llm";

async function fetchCryptoNewsHeadlines(): Promise<string[]> {
  const url = process.env.CRYPTO_NEWS_API_URL;
  if (!url) {
    console.warn("CRYPTO_NEWS_API_URL not set; returning empty headlines.");
    return [];
  }

  const res = await fetch(url);
  if (!res.ok) {
    console.warn("Failed to fetch crypto news:", res.status);
    return [];
  }

  const json = await res.json();
  const headlines: string[] = (json.articles ?? []).map(
    (a: any) => a.title ?? ""
  );
  return headlines.slice(0, 10);
}

export class NewsSentimentAgent extends TradingAgent {
  constructor() {
    super("news-sentiment", 10 * 60_000, "BTCUSDT", "1h");
  }

  async run(): Promise<AgentRunResult | void> {
    const headlines = await fetchCryptoNewsHeadlines();

    if (!headlines.length) {
      return {
        agent: this.name,
        symbol: this.defaultSymbol,
        timeframe: this.defaultTimeframe,
        score: 0,
        confidence: 30,
        payload: { reason: "No headlines" },
      };
    }

    const prompt = `
You are a professional crypto sentiment analyst.

You will receive recent crypto news headlines.
Return ONLY JSON like:
{
  "sentiment": number between -1 and 1,
  "confidence": number between 0 and 100,
  "summary": "short explanation"
}

Headlines:
${headlines.map(h => "- " + h).join("\n")}
`;

    const raw = await callLlm(prompt, {
      systemPrompt:
        "You are an accurate, concise crypto sentiment analyzer for trading.",
      temperature: 0.1,
      maxTokens: 256,
    });

    let sentiment = 0;
    let confidence = 50;
    let summary = "";

    try {
      const jsonString = raw
        .trim()
        .replace(/^```json/i, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      const data = JSON.parse(jsonString);
      sentiment = Number(data.sentiment ?? 0);
      confidence = Number(data.confidence ?? 50);
      summary = String(data.summary ?? "").slice(0, 300);
    } catch (err) {
      console.warn("Failed to parse sentiment JSON:", err, "raw:", raw);
    }

    const score = Math.max(-1, Math.min(1, sentiment));

    return {
      agent: this.name,
      symbol: this.defaultSymbol,
      timeframe: this.defaultTimeframe,
      score,
      confidence: Math.max(0, Math.min(100, confidence)),
      payload: { summary, headlines },
    };
  }
}
