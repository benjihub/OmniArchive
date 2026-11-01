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

Copy `.env.example` to `.env.local` and add `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` before testing the waitlist endpoint. In Vercel, add those same variables under Project Settings → Environment Variables. Add the optional `NEXT_PUBLIC_X_URL` and `NEXT_PUBLIC_GITHUB_URL` values to show the corresponding footer links.
