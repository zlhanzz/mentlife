// AI Caller — Centralized Gemini API wrapper
// All AI calls in MentLife should go through this module.
// Enforces maxTokens, logs usage, centralizes error handling.

import { createClient } from "@/lib/supabase/server";

export interface AICallOptions {
  /** The user/system prompt to send */
  prompt: string;
  /** Optional system instruction (separate from prompt, Gemini caches it efficiently) */
  systemInstruction?: string;
  /** Force JSON output mode */
  responseFormat?: "json" | "text";
  /** REQUIRED: max output tokens to generate (cost control) */
  maxTokens: number;
  /** Sampling temperature (0.0 = deterministic, 1.0 = creative). Default: 0.7 */
  temperature?: number;
  /**
   * Model tier: "flash" for complex tasks (mentoring, recommendations),
   * "lite" for simple tasks (data extraction, classification).
   * Flash Lite has higher free-tier quota and lower cost.
   * Default: "flash"
   */
  model?: "flash" | "lite";
  /**
   * Conversation history for chat-style calls.
   * Each entry: { role: "user" | "assistant", text: string }
   * The current prompt is appended as the final user message.
   */
  chatHistory?: Array<{ role: "user" | "assistant"; text: string }>;
}

export interface AICallResult {
  /** The model's text response */
  text: string;
  /** Approximate tokens consumed (prompt + completion). 0 if unavailable. */
  tokensUsed: number;
}

// Gemini model tiers — Flash for quality, Flash Lite for economy
const MODELS = {
  flash: "gemini-2.5-flash",      // Complex tasks: mentoring, recommendations
  lite: "gemini-2.5-flash-lite",  // Simple tasks: data extraction, classification
};
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Call Gemini API with enforced output limits and unified error handling.
 * Logs usage to `ai_usage` table in Supabase when userId is provided.
 */
export async function callGemini(
  opts: AICallOptions,
  meta?: { userId?: string; callType?: string }
): Promise<AICallResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[callGemini] GEMINI_API_KEY is MISSING");
    throw new Error("GEMINI_API_KEY is not configured. Set it in .env.local");
  }

  // Select model tier
  const modelTier = opts.model ?? "flash";
  const modelName = MODELS[modelTier];
  console.log("[callGemini] API key present, calling:", modelName, "| callType:", meta?.callType);
  const apiUrl = `${GEMINI_API_BASE}/${modelName}:generateContent`;

  // Build contents array for Gemini API
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Add chat history if provided
  if (opts.chatHistory && opts.chatHistory.length > 0) {
    for (const msg of opts.chatHistory) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }],
      });
    }
  }

  // Add the current prompt as the final user message
  contents.push({ role: "user", parts: [{ text: opts.prompt }] });

  // Build generation config
  const generationConfig: Record<string, any> = {
    maxOutputTokens: opts.maxTokens,
    temperature: opts.temperature ?? 0.7,
  };
  if (opts.responseFormat === "json") {
    generationConfig.responseMimeType = "application/json";
  }

  // Build request body
  const requestBody: Record<string, any> = {
    contents,
    generationConfig,
  };

  // Add system instruction if provided (Gemini caches it separately = more efficient)
  if (opts.systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: opts.systemInstruction }],
    };
  }

  try {
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const json = await response.json();

    if (json.error) {
      console.error(`[AI] Gemini API error (${meta?.callType || "unknown"}, ${modelName}):`, json.error.message);
      await logUsage(meta?.userId, meta?.callType || "unknown", 0, 0, 0, false, modelName);
      throw new Error(`Gemini API error: ${json.error.message}`);
    }

    // Extract text from response
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract token usage metadata
    const usageMeta = json.usageMetadata || {};
    const promptTokens = usageMeta.promptTokenCount || 0;
    const completionTokens = usageMeta.candidatesTokenCount || 0;
    const totalTokens = usageMeta.totalTokenCount || (promptTokens + completionTokens);

    // Log usage to DB (fire-and-forget, don't block the response)
    logUsage(meta?.userId, meta?.callType || "unknown", promptTokens, completionTokens, totalTokens, false, modelName).catch(() => {});

    return { text, tokensUsed: totalTokens };
  } catch (err: any) {
    console.error(`[AI] callGemini failed (${meta?.callType || "unknown"}, ${modelName}):`, err.message);
    await logUsage(meta?.userId, meta?.callType || "unknown", 0, 0, 0, false, modelName).catch(() => {});
    throw err;
  }
}

/**
 * Log AI usage to Supabase ai_usage table.
 * Fails silently — never blocks the main flow.
 */
async function logUsage(
  userId: string | undefined,
  callType: string,
  promptTokens: number,
  completionTokens: number,
  totalTokens: number,
  cached: boolean,
  model: string = MODELS.flash
): Promise<void> {
  if (!userId) return;
  try {
    const supabase = await createClient();
    await supabase.from("ai_usage").insert({
      user_id: userId,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      call_type: callType,
      cached,
    });
  } catch {
    // Usage logging is best-effort, never block main flow
  }
}
