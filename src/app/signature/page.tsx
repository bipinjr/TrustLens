import type { Metadata } from "next";
import { FeaturePage } from "@/components/FeaturePage";
import { SignVerify } from "@/components/Tools";

export const metadata: Metadata = { title: "Digital signature verification" };

export default function SignaturePage() {
  return (
    <FeaturePage current="/signature" n="03" fig="Digital signature verification"
      title={<>Originality, <em>proven.</em></>}
      lead="Fake circulars, edited fee notices and forged offer letters spread fast. Sensitive documents are signed with a verified digital signature, and anyone can check they're original, down to a single changed comma."
      cia="Integrity" ciaNote="Proves who sent a document and that nobody edited it since."
      tool={<SignVerify />}
      steps={[
        { t: "Sign", d: "ECDSA P-256 key generated on your device. Signing produces a small .sig file." },
        { t: "Share", d: "Send the document and its .sig together, over any channel." },
        { t: "Verify", d: "Any edit, even one byte, breaks the signature and shows Tampered." },
      ]} />
  );
}
