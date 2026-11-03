# OmniArchive

OmniArchive is a local-first vault for searching, organizing, and exporting AI conversations.

## Development

Install dependencies and start the Next.js development server:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Project structure

- `app/page.tsx` — landing page composition
- `app/api/subscribe/route.ts` — waitlist email endpoint
- `components/marketing/` — reusable landing-page components
- `lib/faq.ts` — FAQ content
- `app/globals.css` — global styles and Tailwind entry point
- `omniarchive-extension/` — separate Manifest V3 Chrome extension workspace

Copy `.env.example` to `.env.local` and add `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` before testing the waitlist endpoint. In Vercel, add those same variables under Project Settings → Environment Variables. Add the optional `NEXT_PUBLIC_X_URL` and `NEXT_PUBLIC_GITHUB_URL` values to show the corresponding footer links.

### Paddle Pro licensing

Create a $19 one-time OmniArchive Pro price in Paddle. Set `PADDLE_API_KEY`, `PADDLE_PRO_PRICE_ID`, and `PADDLE_ENVIRONMENT` in the Next.js deployment environment. The `/api/paddle/verify` endpoint checks the transaction with Paddle and only accepts completed purchases containing that configured price. Keep the Paddle API key on the server.

Before building the extension, copy `omniarchive-extension/.env.example` to `omniarchive-extension/.env.local`. Set `VITE_LICENSE_API_URL` to the deployed `/api/paddle/verify` endpoint and `VITE_PADDLE_CHECKOUT_URL` to the Paddle hosted checkout link for the same price. Then build the extension; the values are embedded in its UI bundle, so do not put secrets in these `VITE_` variables. The extension requests permission to contact the license endpoint when a user activates Pro.

Purchasers activate with the Paddle transaction ID from their receipt. The extension rechecks that transaction with the server when it opens. The archive database remains local; only the transaction ID is sent for verification.

## Chrome extension

The extension has its own dependencies and scripts:

```bash
cd omniarchive-extension
npm install
npm run dev
```

Load the built extension from Chrome's extensions page with Developer mode enabled. The extension stores captured threads and prompts locally in IndexedDB.
