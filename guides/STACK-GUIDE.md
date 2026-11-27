# 🧭 Stack Guide — Which Setup for Which Project?

There is no single right way to build a web project. This guide shows a few setups that have
been used for real, running products, from free to paid, so you and Claude can pick a sensible
starting point.

**These are suggestions, not rules.** If you already know what you want, or your project
needs something else, tell Claude and use that instead.

> Prices and limits were checked in November 2026 and change over time. Always check the
> provider's own pricing page before you count on a number.

---

## The short version

| # | You want to build | Suggested setup | Rough cost per month | Kit project type |
|---|-------------------|-----------------|----------------------|------------------|
| 1 | A website: portfolio, landing page, blog, brochure site | Static files on Cloudflare | €0 (plus a domain name, roughly €10–15 per year) | `cloudflare-site`, `vue-only` or `nuxt-only` |
| 2 | A website with a contact form or text you can edit yourself | One Cloudflare Worker with a D1 database and an admin area | €0 for a small site | `cloudflare-app` |
| 3 | A small web app or SaaS | The same Worker setup, grown: API, database, file storage, logins, payments | €0 to start, about $5 once you outgrow the free plan | start from `cloudflare-app` |
| 4 | A web app with logins, user accounts and lots of related data, on a classic server | Express API + Vue or Nuxt frontend + Supabase | €0 on Supabase Free plus a server of about €5; $25 for Supabase Pro when you grow | `api-only`, `express-vue`, `express-nuxt` |
| 5 | A desktop or phone app | Tauri + Vue, data stored on the user's device | €0–5 for hosting; app store and code-signing fees are the real cost | no starter yet — ask Claude to plan it |
| 6 | A script that automates something | Python | €0 | `python-script` |

Not sure? Start at the lowest row that covers what you need **today**. Moving up later is
normal and much easier than starting too big.

---

## 1. A website (free)

**What it is:** plain files (HTML, CSS, images) that Cloudflare sends to visitors. There is no
server and no database, so there is almost nothing that can break or be hacked.

**Choose this when:** the content is the same for every visitor and you are fine changing text
by editing a file and deploying again.

**How:** the `cloudflare-site` starter is plain HTML. Prefer components and a build step? Use
`vue-only` or `nuxt-only` (static) and host the build output the same way.

**Cost:** free. Cloudflare's free plan covers 100,000 requests per day for Workers and 500
builds per month for Pages.

---

## 2. A website with a form or editable content (free)

**What it is:** one Cloudflare Worker: a small piece of server code that runs on Cloudflare's
network. It serves your site, saves contact form messages in a D1 database, and gives you an
admin area to edit text. The admin area sits behind Cloudflare Access, which shows a login
screen before anyone gets in.

**Choose this when:** you want visitors to send you something, or you want to change content
without touching code.

**How:** the `cloudflare-app` starter. Everything is in one small project and one deploy
command.

**Cost:** free for a small site. D1's free plan allows 5 million rows read and 100,000 rows
written per day, and 5 GB of storage.

---

## 3. A small web app or SaaS (free to about $5)

**What it is:** the same building blocks as option 2, used for a real application:

- **Worker** — your API and your frontend, on your own domain
- **D1** — the database
- **R2** — file storage (uploads, downloads); 10 GB free and no fee for downloads
- **Mail** — a mail service such as Resend, or Cloudflare's own email sending
- **Payments** — a payment provider that works in your country (Stripe, Mollie, Pay.nl, …)

**Choose this when:** you want low, predictable costs and no server to maintain, and your app
is mostly "requests in, answers out".

**Think twice when:** you need long-running background jobs, heavy data processing, or
software that needs a normal server.

**Cost:** free to start. The paid Workers plan is $5 per month and includes 10 million
requests.

**Ways to keep it cheap and safe, learned the hard way:**

- **Store as little as you can.** If data can stay on the user's own device, or be stored
  encrypted so you cannot read it, you have less to pay for, protect and be responsible for.
- **AI features: let users bring their own key.** Then you do not pay for every request.
- **One Worker can do a lot.** Site, API and admin area can live in one Worker. Split only
  when you have a reason.

---

## 4. A classic server app with Supabase

**What it is:** an Express server (your API), a Vue or Nuxt frontend, and Supabase for the
database and user logins. This is the setup the rest of this kit's guides describe in detail.

**Choose this when:**

- you need user accounts with ready-made login, password reset and social logins
- your data has many relations and you want the full power of PostgreSQL
- you want security rules in the database itself (Row Level Security)
- you need things a Worker is not good at: long jobs, WebSockets at scale, special software

**Cost:** Supabase Free is $0 for up to 2 projects, but **a free project pauses after 7 days
without activity**. Supabase Pro starts at $25 per month. The Express server needs a small
server (VPS) of about €5 per month. See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md).

---

## 5. A desktop or phone app

**What it is:** an app people install. A proven combination is Tauri (the app shell) with a
Vue frontend, and the user's data in a local database file on their own device. If you need
a server at all (for licences or updates), a small Cloudflare Worker is enough.

**Cost:** hosting is nearly free. The real costs are for publishing: an Apple Developer
account (about $99 per year), a Google Play account ($25 once) and a code-signing service for
Windows.

**Before you start, know this:**

- Signing and store rules take real time. Plan for them.
- Back up your signing keys. If you lose the key that signs updates, every user has to
  reinstall by hand.
- App stores have rules about showing prices and payment links inside an app. Read them
  before you build a payment screen.

This kit has no starter for this yet. Ask Claude to research and plan it with you.

---

## Lessons that apply to every setup

These come from real projects. They are worth following whatever you choose.

**Secrets**

- Keep secrets out of the code and out of Git. Use `.env` (or `.dev.vars` for Workers)
  locally and the provider's secret storage in production.
- Keep a backup of production secrets and encryption keys in a password manager. If you lose
  an encryption key, the data encrypted with it is gone for good.
- Never log request bodies or URLs that can contain passwords, tokens or personal data.

**Database changes**

- Test every change locally before it touches the real database.
- Add first, remove later. While you deploy, the old code is still running. Add new columns
  and tables in one change, and remove old ones in a later change.
- Know how to go back before you start (a backup, or D1 Time Travel).

**Payments and webhooks**

- A payment provider can send the same notification twice. Record which notifications you
  have handled, so a customer is never charged or served twice.

**Working with Claude**

- Write down what "done" means for your project in `CLAUDE.md`: which commands must pass
  (lint, tests, build) before a task counts as finished.
- Put rules that must never be broken in `.claude/settings.json` as denied commands, such as
  pushing straight to `main`. A rule in settings is enforced; a rule in a text file is only
  a request.
- Write down important decisions and why you made them, in a short note in the project. It
  saves you and Claude from having the same discussion twice.
- You merge and you deploy. Let Claude prepare the change; you approve it.

**Starting out**

- Buy your domain name on day one and use it from the start. Changing addresses later is
  painful, especially for installed apps.
- Start on free plans, but know what the next step costs **before** you hit a limit.
- Do not copy real customer data into tests, examples or documentation.

---

## Where the numbers come from

- Cloudflare Workers: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare D1: https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare R2: https://developers.cloudflare.com/r2/pricing/
- Supabase: https://supabase.com/pricing
