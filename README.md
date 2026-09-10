Sales dashBoard IPM Online
# SuperGrads Online Sales Dashboard

Internal team dashboard for online sales insights, built from the 634 report.

- Phone number + password login (no self-signup — admins add team members)
- Roles: **Admin** (manage team members, promote/demote) and **Member**
- Upload the 634 report (.csv or .xlsx) — it's filtered and stored per month
- Filters: month, compare-to month, state, offering type, course
- KPI cards, revenue bar charts (by course / by offering type), India state-wise
  enrollment heatmap, and a month-on-month comparison table

Built with Next.js (App Router) + Postgres, so it runs on Vercel now and can move
to AWS (or anywhere else that runs Node + Postgres) later without a rewrite —
nothing here depends on Vercel-only services.

## Filtering logic (unchanged from what we agreed on)

A row counts as an **online sale** when:
- `POS` is `ONLINE` or `HO Support`, **and**
- `Centre Name` is `NA`, **and**
- `NET Amount` is greater than 0 (₹0 / fully-discounted rows are excluded)

Revenue uses `NET Amount` (after discount, before EMI split).

## 1. Local setup

```bash
npm install
cp .env.example .env.local
# then edit .env.local with your real DATABASE_URL, JWT_SECRET, SETUP_SECRET
```

Create the tables (run once against your database):

```bash
psql "$DATABASE_URL" -f schema.sql
```

(No `psql` handy? Paste the contents of `schema.sql` into your database provider's
SQL editor instead — Vercel Postgres, Neon, and Supabase all have one.)

Run it:

```bash
npm run dev
```

Visit `http://localhost:3000` — it will redirect to `/login`. You won't be able to
log in yet because there are no users. Create your first admin:

```bash
curl -X POST http://localhost:3000/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "the SETUP_SECRET you put in .env.local",
    "name": "Your Name",
    "phone": "9876543210",
    "password": "choose-a-strong-password"
  }'
```

Now log in with that phone number and password. From the **Admin** tab you can add
the rest of your team (up to 10, or more — there's no hard limit) and promote any
of them to Admin.

## 2. Deploying to Vercel

1. Push this project to a GitHub repo.
2. In Vercel: **Add New Project** → import that repo.
3. Add a database: in your Vercel project, go to **Storage → Create Database →
   Postgres** (or bring your own Neon/Supabase — either works). Vercel will add
   a `POSTGRES_URL`-style variable automatically; set `DATABASE_URL` in your
   project's Environment Variables to that same connection string.
4. Add `JWT_SECRET` and `SETUP_SECRET` as environment variables (generate them
   with `openssl rand -base64 32`).
5. Deploy.
6. Run `schema.sql` against the same database (open its SQL editor in Vercel's
   Storage tab, or connect with `psql`).
7. Call `POST https://your-app.vercel.app/api/setup` once (same as local, above)
   to create your first admin. After that, manage everyone else from the Admin
   tab in the app — you won't need `/api/setup` again.

## 3. Moving to AWS later

Since this is a standard Next.js app talking to Postgres over a normal
connection string, moving off Vercel later is a matter of:
- Pointing `DATABASE_URL` at your new Postgres instance (e.g. RDS) — or keep the
  same database and just re-point where the app runs from.
- Deploying the Next.js app itself via anything that runs Node (Amplify, ECS/Fargate,
  EC2 + PM2, Elastic Beanstalk, etc.) or exporting it as a Docker image.
- Copying over the same three environment variables.

Nothing in the codebase is Vercel-specific (no Vercel KV, no Vercel Postgres SDK —
just the `pg` driver), so this move is infrastructure work, not a rewrite.

## Project structure

```
app/
  login/              Login page
  dashboard/          Main dashboard (protected)
  admin/              Team management (protected, admin only)
  api/
    auth/             login, logout, session
    setup/            one-time first-admin bootstrap
    users/            admin: list/add/remove/promote team members
    upload/           parses + stores a month's 634 report
    analytics/        aggregates for a month (+ optional compare + filters)
    months/           list of months with uploaded data
components/           Shared UI: nav, upload panel, filters, KPI cards,
                       bar chart, India heatmap, comparison table
lib/                  db, auth (JWT sessions), password hashing,
                       sales filtering/aggregation logic, state-name normalization
public/maps/          Simplified India states topojson (for the heatmap)
public/brand/         Logo assets
schema.sql            Database schema — run this once
proxy.ts              Route protection (redirects unauthenticated/non-admin users) —
                       Next.js 16's replacement for the old middleware.ts
```
