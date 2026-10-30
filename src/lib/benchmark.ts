// Headline numbers come from the HELD-OUT set (eval/heldout/RESULTS.md): 40 messages written after
// prompt tuning and never used for tuning. Tuning-set numbers (eval/RESULTS.md) are shown for context only.
export const BENCHMARK = {
  detection: "91%",
  falseAlarms: "5.6%",
  medianSec: 3,
  heldout: { cases: 40, scams: 22, genuine: 18, detection: 90.9, falseAlarms: 5.6, precision: 95.2, f1: 93.0, accuracy: 92.5, rulesDetection: 27.3, medianMs: 2979 },
  tuning: { cases: 67, scams: 46, genuine: 21, detection: 100, falseAlarms: 0, accuracy: 100, v1FalseAlarms: 23.8, rulesDetection: 52.2, medianMs: 2001 },
};
