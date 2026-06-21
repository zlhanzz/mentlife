// AI Cache — Supabase-backed persistent cache for AI-generated content
// Replaces the in-memory Map cache that was useless on Vercel serverless (cold starts wipe memory).
// Cache survives across serverless invocations because it lives in Supabase PostgreSQL.

import { createClient } from "@/lib/supabase/server";

/** Cache TTL per content type */
const CACHE_TTL_MS: Record<string, number> = {
  recommendations: 60 * 60 * 1000,        // 1 hour
  decision_projection: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Create a deterministic cache key from input data.
 * Two calls with identical input produce the same key → cache hit.
 */
export function createCacheKey(data: Record<string, any>): string {
  const str = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32-bit integer
  }
  return `v1_${Math.abs(hash).toString(36)}`;
}

/**
 * Try to retrieve cached AI data from Supabase.
 * Returns null if cache miss, expired, or table doesn't exist yet.
 */
export async function getCachedAI<T = any>(
  userId: string,
  cacheKey: string,
  _cacheType: string
): Promise<T | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ai_cache")
      .select("cached_data, expires_at")
      .eq("user_id", userId)
      .eq("cache_key", cacheKey)
      .single();

    if (error || !data) return null;

    // Check if still valid (DB-side check, belt-and-suspenders with expires_at query)
    if (new Date(data.expires_at) < new Date()) return null;

    // Log cache hit to usage table
    logCacheHit(userId, _cacheType).catch(() => {});

    return data.cached_data as T;
  } catch {
    // Cache read is best-effort, never block main flow
    return null;
  }
}

/**
 * Store AI-generated data in the cache.
 * Uses upsert to handle duplicate keys gracefully.
 */
export async function setCachedAI(
  userId: string,
  cacheKey: string,
  cacheType: string,
  data: any
): Promise<void> {
  try {
    const supabase = await createClient();
    const ttlMs = CACHE_TTL_MS[cacheType] || 60 * 60 * 1000; // default 1h
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();

    await supabase.from("ai_cache").upsert(
      {
        user_id: userId,
        cache_key: cacheKey,
        cache_type: cacheType,
        cached_data: data,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,cache_key" }
    );
  } catch (err: any) {
    console.warn("[AI Cache] Failed to store cache:", err.message);
    // Non-fatal: cache miss just means next call will regenerate
  }
}

/**
 * Invalidate all cache entries for a user (e.g., when their profile data changes).
 * Optionally filter by cache_type.
 */
export async function invalidateAICache(
  userId: string,
  cacheType?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const query = supabase.from("ai_cache").delete().eq("user_id", userId);
    if (cacheType) {
      await query.eq("cache_type", cacheType);
    } else {
      await query;
    }
  } catch (err: any) {
    console.warn("[AI Cache] Failed to invalidate cache:", err.message);
  }
}

/**
 * Get cached recommendations for a user (convenience wrapper).
 * Returns null if not cached. Use this in chat actions to avoid redundant AI calls.
 */
export async function getCachedRecommendations<T = any>(
  userId: string
): Promise<T | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ai_cache")
      .select("cached_data, expires_at")
      .eq("user_id", userId)
      .eq("cache_type", "recommendations")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    if (new Date(data.expires_at) < new Date()) return null;

    return data.cached_data as T;
  } catch {
    return null;
  }
}

/** Log cache hit to ai_usage for monitoring */
async function logCacheHit(userId: string, callType: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("ai_usage").insert({
      user_id: userId,
      model: "cache",
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      call_type: callType,
      cached: true,
    });
  } catch {
    // best-effort
  }
}
