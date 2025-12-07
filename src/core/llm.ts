import "dotenv/config";

export type LlmOptions = {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
};

export async function callLlm(
  prompt: string,
  options: LlmOptions = {}
): Promise<string> {
  const { systemPrompt, temperature = 0.2, maxTokens = 512 } = options;

  if (process.env.GEMINI_API_KEY) {
    return callGemini(prompt, { systemPrompt, temperature, maxTokens });
  }

  if (process.env.OPENAI_API_KEY) {
    return callOpenAI(prompt, { systemPrompt, temperature, maxTokens });
  }

  throw new Error("No supported LLM API key set in environment.");
}

async function callGemini(
  prompt: string,
  options: LlmOptions
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" +
    apiKey;

  const body: any = {
    contents: [
      {
        parts: [
          ...(options.systemPrompt ? [{ text: options.systemPrompt }] : []),
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: options.maxTokens ?? 512,
      temperature: options.temperature ?? 0.2,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error: ${res.status} - ${text}`);
  }

  const json = await res.json();
  const text =
    json.candidates?.[0]?.content?.parts?.[0]?.text ??
    JSON.stringify(json);

  return text;
}

async function callOpenAI(
  prompt: string,
  options: LlmOptions
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const url = "https://api.openai.com/v1/chat/completions";

  const body: any = {
    model: "gpt-4o-mini",
    messages: [
      ...(options.systemPrompt
        ? [{ role: "system", content: options.systemPrompt }]
        : []),
      { role: "user", content: prompt },
    ],
    max_tokens: options.maxTokens ?? 512,
    temperature: options.temperature ?? 0.2,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} - ${text}`);
  }

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content ?? JSON.stringify(json);
  return text;
}
