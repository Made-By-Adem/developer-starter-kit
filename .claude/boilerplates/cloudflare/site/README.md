# Static site on Cloudflare

A website made of plain files, hosted for free on Cloudflare. No server, no database.

## Run it on your computer

```bash
npm install
npm run dev
```

Open the address that appears in the terminal (usually http://localhost:8787).

## Put it online

```bash
npx wrangler login     # one time: connects your Cloudflare account
npm run deploy
```

You get a free `*.workers.dev` address. To use your own domain, add it in the
Cloudflare dashboard under your Worker → Settings → Domains & Routes.

## Good to know

- Everything in `public/` is visible to the whole world. Never put secrets there.
- Built your site with Vue, Nuxt or another tool? Point `assets.directory` in
  `wrangler.jsonc` at the build output folder (for example `./dist`) and run the
  build before `npm run deploy`.
- Need a contact form or editable content later? Move to the `cloudflare/app`
  starter, which adds a small server and a database.
