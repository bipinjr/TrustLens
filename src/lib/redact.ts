// Strip personal data before anything is stored: phone numbers, OTPs, account/card numbers,
// emails and UPI IDs. Scam domains are kept on purpose: they are the useful warning signal.
export function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)*/g, "[id hidden]")
    .replace(/(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g, "[phone hidden]")
    .replace(/\b\d[\d\s-]{5,}\d\b/g, "[number hidden]")
    .replace(/\b\d{4,}\b/g, "[number hidden]") // OTPs, PINs, short account refs
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}
