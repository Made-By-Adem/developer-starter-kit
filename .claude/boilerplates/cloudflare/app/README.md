# Site with a database and admin area on Cloudflare

One Cloudflare Worker that serves:

- your site (the files in `public/`)
- a small API: editable page text and a contact form
- an admin area at `/admin` to edit the text and read messages

It runs on Cloudflare's free plan for a small site. There is no server to maintain.

## Run it on your computer

```bash
npm install
cp .dev.vars.example .dev.vars     # lets you open /admin locally
npm run db:migrate:local           # creates the tables in a local test database
npm run dev
```

Open http://localhost:8787 for the site and http://localhost:8787/admin for the admin area.

## Put it online

1. Connect your Cloudflare account (one time):

   ```bash
   npx wrangler login
   ```

2. Create the database and copy the `database_id` it prints into `wrangler.jsonc`:

   ```bash
   npx wrangler d1 create my-app-db
   ```

3. Create the tables in the real database, then deploy:

   ```bash
   npm run db:migrate:remote
   npm run deploy
   ```

The site and the contact form now work. The admin area stays closed until you finish the next section.

## Open the admin area (Cloudflare Access)

The admin area is protected by Cloudflare Access: visitors get a login screen (for example a
code sent to their email) before they reach `/admin`. The Worker checks that login again on
every request.

1. Give the Worker your own domain in the Cloudflare dashboard (Worker → Settings → Domains & Routes).
   Access cannot protect a single path on a `*.workers.dev` address.
2. In the Cloudflare dashboard open **Zero Trust → Access → Applications** and add a
   self-hosted application for `yourdomain.com/admin`. Add a policy that allows only your
   own email address.
3. Copy two values into `vars` in `wrangler.jsonc`:
   - `ACCESS_TEAM_DOMAIN`: `https://<your-team-name>.cloudflareaccess.com`
   - `ACCESS_AUD`: the "Application Audience (AUD) tag" of the application
4. Run `npm run deploy` again.

Until both values are filled in, `/admin` answers "The admin area is not set up yet".

## Changing the database

Add a new file in `migrations/` (`0002_what_changes.sql`). Never edit a migration that has
already run.

- Test first: `npm run db:migrate:local`
- Then the real database: `npm run db:migrate:remote`
- The old code is still live while you deploy. Add new columns and tables first, and remove
  old ones in a later change, so both versions keep working.
- Made a mistake in the real database? D1 can go back in time:
  `npx wrangler d1 time-travel info my-app-db` shows how.

## Good to know

- `.dev.vars` is for your computer only and must never be committed. `ACCESS_DEV_BYPASS`
  only works on `localhost`.
- Real secrets (API keys for mail or payments) go in with `npx wrangler secret put NAME`,
  never in `wrangler.jsonc`.
- The contact form accepts at most 5 messages per minute per visitor (`ratelimits` in
  `wrangler.jsonc`).
- Contact messages are personal data. Delete them in the admin area once you have handled them.
