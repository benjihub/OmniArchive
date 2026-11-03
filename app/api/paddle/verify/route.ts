import { NextResponse } from "next/server";

const transactionIdPattern = /^txn_[a-z\d]{26}$/i;

export async function POST(request: Request) {
  const apiKey = process.env.PADDLE_API_KEY;
  const expectedPriceId = process.env.PADDLE_PRO_PRICE_ID;
  if (!apiKey || !expectedPriceId) {
    return NextResponse.json({ error: "License verification is not configured." }, { status: 503 });
  }

  let transactionId = "";
  try {
    const body = await request.json();
    transactionId = typeof body.transactionId === "string" ? body.transactionId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!transactionIdPattern.test(transactionId)) {
    return NextResponse.json({ error: "Enter a valid Paddle transaction ID." }, { status: 400 });
  }

  try {
    const apiBase = process.env.PADDLE_ENVIRONMENT === "sandbox"
      ? "https://sandbox-api.paddle.com"
      : "https://api.paddle.com";
    const paddleResponse = await fetch(`${apiBase}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!paddleResponse.ok) {
      return NextResponse.json({ valid: false, error: "Paddle could not verify this transaction." }, { status: 200 });
    }

    const payload = await paddleResponse.json();
    const transaction = payload?.data;
    const hasProPrice = Array.isArray(transaction?.details?.line_items)
      && transaction.details.line_items.some((item: { price_id?: string }) => item.price_id === expectedPriceId);
    const valid = transaction?.status === "completed" && hasProPrice;
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ error: "Paddle verification is temporarily unavailable." }, { status: 502 });
  }
}
