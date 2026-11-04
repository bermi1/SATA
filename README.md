# SATA website and member platform

The public website, member portal and secretariat console for the **Society of Anaesthesiologists of Tanzania**.

- **Public site:** home, about, leadership, membership and online application, events and registration, calendar, news, resources library, gallery, contact, member-card verification.
- **Member portal:** digital membership card with QR, payments and receipts, event registration and tickets, CPD record, notifications, help desk.
- **Admin console:** applications, members, events and QR check-in, payments and reconciliation, departments, bulk SMS and email, newsletter subscribers, website editor, reports, audit log. Access is role-based (secretariat, treasurer, leadership).

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase (Postgres + Storage), deployed on Vercel.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

With no Supabase variables set, the app uses a local sample database in `.data/` and shows a development-only sign-in panel. The panel and the sample database are refused in production.

```bash
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm test             # Vitest: business rules, sign-in codes, rate limiting
npm run build        # production build
```

## Production setup

1. **Database.** Run `supabase/migrations/0001_init.sql` then `0002_storage.sql` in the Supabase SQL editor (or `supabase db push`).
   Every table has row-level security enabled with no policies: the public key can read nothing. The app talks to the database only from the server with the service-role key.
2. **Environment.** Copy `.env.example` to your host (Vercel → Settings → Environment Variables) and fill it in. Production will not start without `SATA_SESSION_SECRET`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. **Seed.** `npm run db:seed` loads SATA's real content (events, news, resources, leadership, gallery, calendar, site settings) into empty tables and creates the first administrator from `SATA_ADMIN_EMAIL`. It never creates sample members or payments. Use `-- --demo` only for a staging copy.
4. **Email.** Sign-in is by one-time code sent by email (Resend). Verify the sending domain in Resend and set `RESEND_API_KEY` and `EMAIL_FROM`.
5. **Deploy.** Push to GitHub and import the repo in Vercel. `vercel.json` registers the daily reminder cron (`/api/cron/reminders`), authenticated by `CRON_SECRET`.
6. **Optional SMS.** Set `SMS_PROVIDER` and its keys (Africa's Talking or Beem). Without them, bulk messages are logged in the console but not sent.

## How it is put together

| Area | Where |
| --- | --- |
| Pages and API routes | `app/` (`(site)` public, `portal`, `admin`, `api`) |
| Business rules (memberships, payments, events, attendance, audiences) | `lib/store.ts` |
| Database access, two interchangeable backends | `lib/db/` (`supabase.ts` production, `file.ts` local development) |
| Sign-in, sessions, roles | `lib/auth.ts`, `lib/otp.ts`, `lib/request.ts` |
| SMS and email providers | `lib/sms.ts`, `lib/messaging.ts` |
| Uploads (Supabase Storage / local folder) | `lib/uploads.ts` |
| Schema and seed | `supabase/migrations/`, `supabase/seed.sql`, `scripts/seed.ts` |

## Security notes

- Sign-in needs a one-time code (6 digits, hashed at rest, 10-minute expiry, five attempts) with per-email and per-IP rate limits. Responses do not reveal whether an email is registered.
- Sessions are HMAC-signed, `HttpOnly`, `SameSite=Lax`, and `Secure` in production. Suspended members cannot sign in.
- Every admin write checks the caller's role for that area and rejects cross-site requests.
- Uploads are validated by file signature (PNG, JPG, WebP, PDF), size-limited and stored in a private bucket.
- Security headers (HSTS, `nosniff`, frame denial, referrer and permissions policies) are set in `next.config.ts`.

## Known follow-ups

- Online payment collection (M-Pesa, Airtel Money, Mixx, GePG) is recorded manually or by reconciliation; live gateway integration needs each provider's merchant credentials.
- Event capacity is checked at registration time without a database lock; for very large events, add a transactional reservation.
