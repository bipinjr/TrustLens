import OpenAI from "openai";

// Created on first request, not at import time: `next build` loads route modules to collect
// page data, and the API key is only guaranteed to exist at runtime (e.g. on Vercel).
let client: OpenAI | null = null;

function getGroq(): OpenAI {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");
  client ??= new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" }); // Groq is OpenAI-compatible
  return client;
}

// Same call sites as before (groq.chat..., groq.audio...), resolved lazily per request.
export const groq = new Proxy({} as OpenAI, { get: (_t, prop) => Reflect.get(getGroq(), prop) });

export const CHAT_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
