import { NextResponse } from "next/server";

// Resend: add the email to an Audience.
// Env vars (Vercel -> Settings -> Environment Variables):
//   RESEND_API_KEY, RESEND_AUDIENCE_ID
export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not save email" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
