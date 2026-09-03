# FurniVision

FurniVision is a Vite + React furniture storefront. The Render configuration
in `render.yaml` deploys it as a static site with SPA rewrites, so routes such
as `/furniture`, `/design`, and `/checkout` continue to work after a refresh.

## Deploy on Render

1. Push the contents of this directory to a GitHub or GitLab repository.
2. In Render, choose **New → Blueprint** and select that repository.
3. Render will read `render.yaml`, install dependencies with pnpm, build the
   `@workspace/furnivision` workspace, and publish
   `artifacts/furnivision/dist/public`.
4. If you want accounts, cloud-synced data, and room uploads, enter the six
   Firebase web-app values requested by the Blueprint. They are build-time
   `VITE_` variables and are intentionally not included in the repository.
5. After the first deploy, add the Render hostname to Firebase Authentication
   → Settings → Authorized domains if you enable Google sign-in.

The site also works in demo mode without Firebase. Demo orders do not process
payments; connect a server-side Stripe checkout flow before accepting real
orders.

## Local production build

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @workspace/furnivision build
pnpm --filter @workspace/furnivision serve
```

The production files are generated at
`artifacts/furnivision/dist/public`. Copy
`artifacts/furnivision/.env.example` to a local environment file when testing
Firebase locally.