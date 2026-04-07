# Visionary

Racing-thoughts capture app. Monorepo: `apps/mobile` (Expo) + `apps/backend` (Convex).

## First-time setup

```bash
bun install
```

### 1. Provision Convex

```bash
cd apps/backend
bunx convex dev
```

Interactive on first run — log in, create the deployment. Leave it running; it
generates `convex/_generated/*` and writes `CONVEX_DEPLOYMENT` to
`apps/backend/.env.local`. It also prints a deployment URL like
`https://<name>.convex.cloud` — copy that.

### 2. Point the mobile app at Convex

```bash
cd apps/mobile
cp .env.example .env.local
# paste the URL from step 1 into EXPO_PUBLIC_CONVEX_URL
```

### 3. Run the app

```bash
cd apps/mobile
bunx expo start
```

Keep `bunx convex dev` running in the backend dir while developing — it
hot-reloads backend functions and regenerates types.
