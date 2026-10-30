// Demo lab for the hurdle: a 3-hop redirect chain ending on a cloaked fake login.
// Harmless: nothing is submitted anywhere, and the page says it is a TrustLens demo.
export const runtime = "nodejs";

const BOT = /bot|crawler|spider|headless|curl|wget|python|scanner|preview/i;
const html = (body: string) => new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${body}`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

export async function GET(req: Request, { params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  const ua = req.headers.get("user-agent") || "";
  switch (step) {
    case "to-phish": return new Response(null, { status: 302, headers: { location: "http://paypa1-secure-login.com/signin", "cache-control": "no-store" } });
    case "go": return new Response(null, { status: 302, headers: { location: "/lab/hop", "cache-control": "no-store" } });
    case "hop": return html(`<meta http-equiv="refresh" content="0; url=/lab/track"><title>Loading</title></head><body>Loading…</body></html>`);
    case "track": return html(`<title>Redirecting</title></head><body><script>window.location.href = "/lab/login"</script></body></html>`);
    case "login":
      if (BOT.test(ua)) return html(`<title>Mom's Kitchen – easy dal tadka</title></head><body style="font-family:system-ui;max-width:640px;margin:40px auto"><h1>Easy dal tadka in 20 minutes</h1><p>${"Rinse the dal, pressure cook with turmeric and salt, then temper with ghee, cumin, garlic and red chilli. ".repeat(6)}</p></body></html>`);
      return html(`<title>SBI NetBanking – KYC update</title></head><body style="font-family:system-ui;max-width:420px;margin:40px auto;padding:0 16px">
        <p style="background:#fde68a;padding:8px 12px;border-radius:8px;font-size:13px"><b>TrustLens demo lab.</b> This is a fake page used to show cloaking. Not a real bank.</p>
        <h1 style="color:#1e3a8a">SBI NetBanking</h1><p>Your KYC expires today. Log in to avoid account suspension.</p>
        <form onsubmit="return false"><p><input placeholder="Username" style="width:100%;padding:10px"></p><p><input type="password" placeholder="Password" style="width:100%;padding:10px"></p><p><input placeholder="Enter OTP sent to your mobile" style="width:100%;padding:10px"></p><button disabled>Login</button></form></body></html>`);
    default: return new Response("Not found", { status: 404 });
  }
}
