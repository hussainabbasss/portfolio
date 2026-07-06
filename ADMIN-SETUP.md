# Admin panel setup

The site reads its content from Supabase and falls back to the
placeholders in `app/content.ts` until Supabase is connected. The
admin panel lives at **`/admin`** and lets you edit everything:
identity, tagline, projects (with metrics, stack, links), experience,
and the about section.

## One-time setup (~5 minutes)

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
   (free tier is plenty).

2. **Add the credentials.** Copy `.env.example` to `.env.local` and fill
   in both values from *Dashboard → Project Settings → API*:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

   The anon key is safe to expose publicly — writes are blocked by
   row-level security unless you're signed in.

3. **Create the table.** Open *Dashboard → SQL Editor → New query*,
   paste the contents of [`supabase/schema.sql`](supabase/schema.sql),
   and run it.

4. **Create your admin login.** *Dashboard → Authentication → Users →
   Add user → Create new user.* Use your email and a strong password
   (check "Auto confirm user").

5. **Restart the dev server**, then open [`/admin`](http://localhost:3001/admin),
   sign in, edit, and hit **Save & publish** (or press Ctrl/Cmd+S).

## How publishing works

- Saving upserts one `jsonb` row (`site_content`, id 1) and calls
  `/api/revalidate`, which verifies your Supabase session and refreshes
  the public page's cache instantly.
- Without a manual refresh, the page also revalidates on its own every
  5 minutes (ISR).
- If Supabase is ever unreachable, the site silently serves the last
  cached version (or the `app/content.ts` placeholders) — it never
  breaks.

## Security model

- Reads: public (`select` policy for everyone) — same data the site shows.
- Writes: `authenticated` role only, i.e. someone signed in through
  Supabase Auth. Don't create users you don't trust.
- The service-role key is never used or needed by this app.
