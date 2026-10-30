// "Share → TrustLens" lands here when the phone opens the app before its service worker is running.
// The shared text is handed to /share through sessionStorage (never in the URL, so it can't end up in logs).
export const runtime = "nodejs";

function handOff(text: string, image: boolean) {
  const payload = JSON.stringify(text).replace(/</g, "\\u003c");
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><body style="background:#07090a"><script>
try { sessionStorage.setItem("trustlens-share", ${payload}); } catch (e) {}
location.replace("/share?shared=2${image && !text ? "&image=1" : ""}");
</script></body>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

const pick = (get: (k: string) => FormDataEntryValue | string | null) =>
  ["title", "text", "url"].map(get).filter((v): v is string => typeof v === "string" && !!v.trim()).join(" ").trim().slice(0, 4000);

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const image = form?.get("image");
  return handOff(form ? pick((k) => form.get(k)) : "", !!image && typeof image !== "string");
}

// Some Android builds open share targets with GET; treat it the same way.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  return handOff(pick((k) => q.get(k)), false);
}
