# Blue Prince Notes

A client-first notes and todo tracker for Blue Prince.

## Deploy To GitHub Pages

This repo is already configured for GitHub Pages via:

- Workflow: `.github/workflows/deploy-pages.yml`
- Build output: `dist/client`
- SPA fallback: `404.html` is generated from `index.html`
- Base path: computed automatically per repository name

### One-time GitHub setup

1. Push this repository to GitHub.
2. Open repository settings.
3. Go to **Pages**.
4. Set **Source** to **GitHub Actions**.

After that, every push to `main` will deploy automatically.

### How base paths are handled

The workflow sets `BASE_PATH` automatically before running `npm run build`:

- User/org site repo (`<user>.github.io`) -> `/`
- Project repo (`<repo>`) -> `/<repo>/`

`vite.config.ts` reads this value:

- `const base = process.env.BASE_PATH ?? "/";`

So assets and client routes work correctly on Pages.

### Local verification for Pages build

Run a Pages-like build locally:

```bash
BASE_PATH=/your-repo-name/ npm run build
```

Then preview:

```bash
npm run preview
```

## Data Storage

- Notes, todos, map state, and images are stored client-side in IndexedDB.
- Data is browser/device local.
- Use export/import JSON for backup and migration.
