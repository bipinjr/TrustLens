import type { Signal } from "./signals";
import type { PrincipleId } from "./principles";

export const LANGUAGES = [
  "English", "Hindi", "Hinglish", "Tamil", "Telugu", "Bengali", "Marathi", "Kannada",
  "Malayalam", "Gujarati", "Punjabi", "Odia", "Urdu", "Assamese",
];
// What each language is called by the people who read it (shown in the picker).
export const LANGUAGE_NATIVE: Record<string, string> = {
  English: "English", Hindi: "हिन्दी", Hinglish: "Hinglish (Hindi in English letters)", Tamil: "தமிழ்", Telugu: "తెలుగు",
  Bengali: "বাংলা", Marathi: "मराठी", Kannada: "ಕನ್ನಡ", Malayalam: "മലയാളം", Gujarati: "ગુજરાતી",
  Punjabi: "ਪੰਜਾਬੀ", Odia: "ଓଡ଼ିଆ", Urdu: "اردو", Assamese: "অসমীয়া",
};
// Tesseract OCR packs: screenshots are read as English + Hindi + the chosen language.
export const OCR_LANG: Record<string, string> = {
  Tamil: "tam", Telugu: "tel", Bengali: "ben", Marathi: "mar", Kannada: "kan", Malayalam: "mal",
  Gujarati: "guj", Punjabi: "pan", Odia: "ori", Urdu: "urd", Assamese: "asm",
};

export type Tactic = { name: string; quote: string; explanation: string; principle?: PrincipleId };
export type Analysis = {
  verdict: "scam" | "suspicious" | "likely_safe";
  risk: number;
  scamType: string;
  summary: string;
  whatTheyWant: string;
  tactics: Tactic[];
  safeActions: string[];
  lesson: string;
  signals: Signal[];
  ruleScore: number;
  aiScore: number | null;
  model: string | null;
};
