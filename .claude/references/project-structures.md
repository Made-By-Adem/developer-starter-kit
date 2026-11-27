# Project Structures by Type

Reference file for the `project-starter` agent and for understanding project layout.

## api-only
```
project/
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── DOCUMENTATION/
│   ├── project.md
│   └── api.md
├── IMPLEMENTATION-PLANS/
├── routes/
│   └── [domain]Routes.js
├── controllers/
│   └── [domain]Controller.js
├── services/
│   └── [domain]Service.js
├── repositories/
│   ├── baseRepository.js
│   └── [domain]Repository.js
├── middleware/
│   ├── authMiddleware.js
│   ├── validationMiddleware.js
│   └── errorHandler.js
├── utils/
│   └── errors.js
├── config/
│   ├── supabase.js
│   └── logger.js
├── logs/                    ← Created by Winston logger (gitignored)
└── database/
    └── migrations/
        └── YYYYMMDDHHMMSS_name.sql
```

## vue-only
```
project/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── .gitignore
├── README.md
├── DOCUMENTATION/
│   └── project.md
├── IMPLEMENTATION-PLANS/
└── src/
    ├── App.vue
    ├── main.js
    ├── router.js
    ├── views/
    │   └── [Screen].vue
    ├── components/
    │   └── [feature]/
    │       └── [Component].vue
    ├── stores/
    │   └── [domain].js
    ├── services/
    │   ├── apiClient.js
    │   └── [domain]Service.js
    ├── composables/
    │   └── use[Feature].js
    └── assets/
        └── main.css
```

## nuxt-only
```
project/
├── nuxt.config.ts
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── DOCUMENTATION/
│   └── project.md
├── IMPLEMENTATION-PLANS/
├── app/                     ← Nuxt 4 keeps app code in app/
│   ├── app.vue
│   ├── pages/
│   │   └── index.vue
│   ├── components/
│   │   └── [Component].vue
│   ├── composables/
│   │   └── use[Feature].ts
│   ├── stores/
│   │   └── [domain].ts
│   ├── services/
│   │   └── apiClient.js     ← Uses $fetch + useRuntimeConfig() (not Axios)
│   └── assets/
│       └── css/
│           └── main.css
├── server/
│   ├── api/
│   │   └── [endpoint].ts
│   └── middleware/
├── public/
└── database/
    └── migrations/
        └── YYYYMMDDHHMMSS_name.sql
```

## express-vue

```
project/
├── .gitignore
├── README.md
├── DOCUMENTATION/
│   ├── project.md
│   └── api.md
├── IMPLEMENTATION-PLANS/
├── server/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   ├── utils/
│   ├── config/
│   └── logs/                ← Created by Winston logger (gitignored)
├── frontend/
│   ├── package.json
│   ├── .env.example         ← Contains VITE_API_URL
│   └── src/
│       ├── App.vue
│       ├── main.js
│       ├── router.js
│       ├── views/
│       ├── components/
│       ├── stores/
│       ├── services/
│       │   └── apiClient.js  ← Uses import.meta.env.VITE_API_URL
│       └── composables/
└── database/
    └── migrations/
        └── YYYYMMDDHHMMSS_name.sql
```

## express-nuxt

```
project/
├── .gitignore
├── README.md
├── DOCUMENTATION/
│   ├── project.md
│   └── api.md
├── IMPLEMENTATION-PLANS/
├── server/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   ├── utils/
│   ├── config/
│   └── logs/                ← Created by Winston logger (gitignored)
├── frontend/
│   ├── package.json
│   ├── nuxt.config.ts
│   ├── .env.example         ← Contains NUXT_PUBLIC_API_URL
│   └── app/                 ← Nuxt 4 keeps app code in app/
│       ├── pages/
│       ├── components/
│       ├── composables/
│       ├── stores/
│       └── services/
│           └── apiClient.js  ← Uses $fetch + useRuntimeConfig() (not Axios)
└── database/
    └── migrations/
        └── YYYYMMDDHHMMSS_name.sql
```

## cloudflare-site

```text
project/
├── package.json
├── wrangler.jsonc           ← Cloudflare config: serves ./public
├── .gitignore
├── README.md
├── DOCUMENTATION/
│   └── project.md
├── IMPLEMENTATION-PLANS/
└── public/
    ├── index.html
    ├── 404.html
    └── style.css
```

## cloudflare-app

```text
project/
├── package.json
├── wrangler.jsonc           ← Cloudflare config: Worker, static files, D1, rate limit
├── .dev.vars.example        ← Local-only settings (copy to .dev.vars, never commit)
├── .gitignore
├── README.md
├── DOCUMENTATION/
│   ├── project.md
│   └── api.md
├── IMPLEMENTATION-PLANS/
├── src/
│   ├── index.js             ← Routes: public API, admin API, static files
│   └── access.js            ← Cloudflare Access check for /admin
├── migrations/
│   └── 0001_init.sql        ← D1 (SQLite) migrations, numbered
└── public/
    ├── index.html
    ├── style.css
    └── admin/
        └── index.html
```

## python-script

```text
project/
├── main.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
├── DOCUMENTATION/
│   └── project.md
├── IMPLEMENTATION-PLANS/
├── src/
│   ├── __init__.py
│   └── [module].py
├── config/
│   └── settings.py
└── data/                    ← Input/output data files (gitignored if large)
```
