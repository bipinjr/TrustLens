import { redirect } from "next/navigation";

// The hurdle lives inline on the home page; keep old links working.
export default function HurdlePage() {
  redirect("/#hurdle");
}
