# Visionary — Backend

## Role

One backend that serves the mobile app (and later the web app). In v1 its job is tiny: receive thoughts, store them, serve them back, and hand the client a short-lived Deepgram token when it wants to record voice. That's the whole job.

## Stack

### Platform
- **Convex** — the entire backend. Database, server functions, scheduled jobs, and real-time subscriptions, all in one TypeScript-native platform.
  - Functions are written as `query`, `mutation`, and `action` exports. Clients import them as typed hooks. No REST layer, no API contracts to hand-maintain.
  - Reactive by default: every `useQuery` on the client is a live subscription. When a thought is saved on one device, every other device sees it without polling.
  - Scales to zero on the free tier. Deploys with `bunx convex deploy` from any machine, including Linux.
- **TypeScript** end to end. The Convex functions live in `apps/backend/convex/` and the generated client types are imported by the mobile app as `@visionary/backend/convex/_generated/api`.

### Database
- **Convex's built-in document database.** Schema defined in `apps/backend/convex/schema.ts`. Indexes are declarative. Transactions are automatic — every mutation runs in a single ACID transaction.
- That's it for v1. No vector indexes, no search indexes.

### Auth
- **`@convex-dev/auth`** with Sign in with Apple and Sign in with Google providers.
- The Convex Auth users table is extended with one custom field — `accentColor` — via the `usersTable` config override. One table, one source of identity.
- Sessions are managed by Convex. The mobile client stores the auth token in `expo-secure-store`; the (future) web client will use httpOnly cookies via the Convex web client.

### Voice / transcription
- **Deepgram streaming** — used by the mobile client via WebSocket for real-time speech-to-text during voice capture. All streaming happens directly between the device and Deepgram. The Deepgram API key **never touches the device**.
- The backend's only role is a single action — `deepgram.token` — which mints a short-lived Deepgram auth token (via Deepgram's temporary-key endpoint) and returns it to the client. The client uses that token to open the WebSocket.
- No audio is stored anywhere, ever. Convex file storage is not used in v1.

## Function surface

The entire v1 backend is five functions plus whatever `@convex-dev/auth` wires up on its own.

**Queries** (read, reactive):
- `thoughts.list` — list thoughts for the authenticated user, ordered by `createdAt` descending. Paginated. Used by the mobile archive as a live `useQuery`.
- `thoughts.get` — single thought detail. Used by the ThoughtDetail screen.

**Mutations** (write, transactional):
- `thoughts.create` — create a thought. Body: `{ content }`. Server assigns `_id`, `userId`, `createdAt`.
- `users.setAccentColor` — updates the current user's `accentColor` field. Called from the settings sheet.

**Actions** (network I/O):
- `deepgram.token` — calls Deepgram's temporary-key endpoint using the project API key from Convex env, returns a short-lived token to the client.

No microservices, no Dockerfile, no deployment YAML, no cron jobs, no queues.

## Data model

Two tables. That's the whole schema.

- **users** — owned by `@convex-dev/auth`, extended with `accentColor: v.optional(v.string())`. Standard auth fields (email, provider, `_creationTime`, etc.) are managed by the auth library.
- **thoughts** — `userId: v.id("users")`, `content: v.string()`, `_creationTime` (built-in). Indexed by `userId` for the list query.

No `source` field. No `audioStorageId`. No `summary`. No `links` table. No `embeddings`. Everything else is derived or deferred.

## Search on the archive

The design doc specifies a search bar on the archive page. In v1 this is a **client-side filter** over the already-loaded `useQuery(api.thoughts.list)` result — the user types, the list filters in memory. At side-project scale (likely under a few thousand thoughts in the first year), this is instant and requires zero backend work.

When client-side filtering starts to feel sluggish (probably 10k+ thoughts), we add a Convex search index on `thoughts.content` and swap the client-side filter for a server-side `withSearchIndex` query. One-line schema change, one-line query change. Deferred until a real need shows up.

## Repo structure

Bun workspaces from day one.

```
visionary/
├── apps/
│   ├── mobile/      (Expo — the v1 client)
│   ├── backend/     (Convex — schema, functions, generated client)
│   └── web/         (Vite — future)
└── package.json     (bun workspaces root)
```

Mobile imports backend types as `@visionary/backend/convex/_generated/api`. Bun workspace resolution handles it with no build step.

## Cut from the backend stack

- No GraphQL.
- No REST layer.
- No microservices.
- No Hono, no Fly.io, no Dockerfile.
- No Postgres, no Neon, no Drizzle, no Prisma.
- No Redis, no BullMQ. Convex's scheduler is the queue when we eventually need one.
- No separate vector database (Pinecone, Weaviate, Qdrant, pgvector). Not in v1.
- No Cloudflare R2, no Convex file storage. No audio is ever stored.
- No Kubernetes anything. Ever.
- No Clerk, no Lucia. Convex Auth.
- No analytics in v1.
- No AI pipeline in v1 (no embeddings, no Haiku linking, no Sonnet ask/evaluate, no mind map graph). Transcription is the only AI, and it runs client-side over a WebSocket that the backend only issues a token for.

## Ops

- **GitHub** for source. **GitHub Actions** for CI: typecheck, lint, test on PR. CI runs `bunx convex deploy --preview` for branch previews.
- **Convex dashboard** for backend observability: function logs, scheduler runs, slow queries.
- No PagerDuty, no on-call. It's a side project.

## Cost ceiling

- **Convex**: free tier covers function calls, storage, and bandwidth at side-project volume.
- **Deepgram**: pay-as-you-go, ~$0.0043 per minute for streaming. Cheap at personal use.
- **Apple / Google OAuth**: free.

The whole v1 backend should run for under $5/month at personal-use volume.

## Future (post-v1, ships with the web app)

Everything listed below is **not in v1**. It is written down here only to make the long-term shape of the backend clear and to keep v1 scope honest.

- **Web app backend features** — `ai.ask` (vector search + Sonnet synthesis with citations), `ai.evaluate` (Sonnet evaluation of a thought or cluster), `map.graph` (mind-map nodes and edges).
- **Embeddings + linking** — `ai.embed` (OpenAI `text-embedding-3-small`) and `ai.link` (Haiku-driven relationship labeling), scheduled after each `thoughts.create`. Requires adding a vector index to the `thoughts` table and a `links` table.
- **Full-text search index** — a Convex search index on `thoughts.content` if client-side filtering stops being fast enough.
- **Models in play when the AI layer lands** — Deepgram (already in v1, for voice), OpenAI `text-embedding-3-small` (embeddings), Claude Haiku 4.5 (linking), Claude Sonnet 4.6 (ask/evaluate).

These features get added in one focused pass when the web app starts being built, not before.
