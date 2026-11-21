# Keps Letters — Quasar / Vue 3 frontend

Talks to the Laravel backend. Builds straight into `../letters-laravel/public`, which
is what Laravel serves (see `quasar.config.js` → `build.distDir`).

```bash
npm install
npm run dev     # http://localhost:9100, proxies /api and /auth to :8000
npm run build   # emits into ../letters-laravel/public
```

## Shape

- `services/api.js` — axios + bearer token. A `401` means the account was disabled or
  removed from Microsoft mid-session, so it drops the token and returns to sign-in.
- `stores/auth.js` — the signed-in person and the companies they may use.
- `components/TableField.vue` — the three table layouts:
  *columns across the top* (add rows), *headings down the left* (add value columns),
  and a paste box for templates that never named their columns.
- `pages/TemplatesPage.vue` — template upload, table setup, signature style, and the
  dynamic-field library (tags are click-to-copy; tables show `{{@key}}`).
- `pages/QueuePage.vue` — polls every 45s and on window focus, so approvals appear
  without signing out and back in.
- `pages/AdminPage.vue` — People & access, including **Sync with Microsoft**.
