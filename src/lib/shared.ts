import type { Signal } from "./signals";
import type { PrincipleId } from "./principles";

export const LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Bengali",
  "Marathi", "Kannada", "Malayalam", "Gujarati",
];

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
