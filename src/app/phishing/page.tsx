import type { Metadata } from "next";
import { FeaturePage } from "@/components/FeaturePage";
import { LinkCheck } from "@/components/Tools";

export const metadata: Metadata = { title: "Scam & phishing protection" };

export default function PhishingPage() {
  return (
    <FeaturePage current="/phishing" n="01" fig="Scam & phishing protection"
      title={<>Spot the hook <em>before</em> you bite.</>}
      lead="Scammers reuse the same tactics: fake urgency, look-alike bank domains, KYC threats. TrustLens matches links and messages against known scam patterns and live OSINT phishing feeds."
      cia="Confidentiality" ciaNote="Keeps your OTPs, PINs and passwords out of phishers' hands."
      tool={<LinkCheck />}
      steps={[
        { t: "Pattern match", d: "Look-alike brands (paypa1, sbi-kyc), risky TLDs, raw IPs, punycode, @ tricks." },
        { t: "OSINT feeds", d: "Live OpenPhish feed, plus Google Safe Browsing and URLhaus when keys are set." },
        { t: "Plain verdict", d: "A 0–100 risk score with every reason named. For messages, use Check a message." },
      ]} />
  );
}
