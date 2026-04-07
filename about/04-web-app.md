# Visionary — Web App

## Purpose

A separate companion surface for the deliberate, sit-down sessions where you actually want to look back, connect, and evaluate your thoughts. The mobile app is the notebook; the web app is where you wander.

The web app is opened on purpose, at a desk or on a couch, with time. It's not a port of the mobile app. It's a different product that talks to the same database.

## Scope

The web app exists for three jobs the mobile app deliberately does not do:

1. **Mind map.** AI-generated connections between thoughts. Zoom in and out on any idea's neighborhood. See where a thought came from and what it grew into. Lineage matters — this is where it lives.
2. **Ask your thoughts.** A search and synthesis surface. Ask questions like "what have I been thinking about pricing?" and get a synthesized answer with citations back to source thoughts.
3. **AI idea evaluation.** Feed an idea (or a cluster of related ones) to the AI for honest analysis — strengths, weaknesses, what it reminds the AI of, what's missing.

That's it. No capture surface on the web app. Capture is mobile-only because capture is mobile-shaped.

## Out of scope (web v1)

- Capture / writing new thoughts
- Editing thoughts (consistent with mobile)
- Settings beyond accent color and sign out
- Any feature that exists on mobile and isn't an analysis tool

## Stack

- **Vite + React + TypeScript.** No SSR, no framework. It's a logged-in tool, not a marketing site. Vite builds in milliseconds.
- **TanStack Router** — file-based routing, type-safe, lightweight.
- **TanStack Query** — same query layer as mobile means shared API types and consistent caching behavior.
- **Tailwind CSS** — yes here, no on mobile. The web app has more surface area and more components, and Tailwind earns its place. Different product, different rules.
- **shadcn/ui** — for the handful of inputs, dialogs, and primitives the web app needs. Copy-paste, no runtime dep.
- **React Flow** — the mind map. Right tool, well-maintained, handles thousands of nodes, supports custom node rendering.
- **Sign in with Apple + Google** — same auth backend as mobile. Web uses standard OAuth redirect flows.

## Cut from the web stack

- No SSR / no Next.js. Logged-in tools don't need server rendering.
- No state management library. TanStack Query covers server state, React state covers everything else.
- No GraphQL.
- No analytics in v1.

## Pages

Three top-level surfaces, mirroring the three jobs.

- **Map** — the mind map view, rendered with React Flow. AI clusters thoughts and draws edges between related ones. Click a node to see the full thought. Zoom out for the wider neighborhood. This is the default landing page on web because it's the most distinctive surface.
- **Ask** — a search/chat surface. One input. Type a question. Get a synthesized answer with linked citations back to the source thoughts. Each citation can be clicked to read the original.
- **Evaluate** — pick a thought (or a small cluster), and the AI returns an honest evaluation: what's strong about the idea, what's weak, what it reminds the AI of, what questions are worth asking next, what would make it stronger.

A small navigation lives somewhere quiet (probably top-left or a sidebar collapsed by default) to switch between the three. The visual restraint of the mobile app carries over: same dark theme, same accent, same typography, same conviction.

## Visual continuity with mobile

The web app shares the mobile app's design language so it feels like the same product:

- Same dark background and warm off-white ink
- Same accent color (synced from the user's mobile choice)
- Same serif typeface for thoughts, same mono for metadata
- Same restraint — generous space, no chrome, no decoration

Where the web app departs from mobile is in *density of information*. The mind map is by definition more visually busy than a blank page. That's allowed because the user came here for that. The discipline is making the busyness *intentional* — every node, every edge, every label is in service of helping the user see their own thinking.

## Deployment

- **Cloudflare Pages** — free, fast, ships from a git push. Same Cloudflare account that hosts the audio bucket on R2.
- Custom domain.

## Build order

The web app does not exist in v1 of the product. It is built only after the mobile app has been used daily for at least two weeks and proven its value. The web app is a reward the mobile app earns.

When it does get built, the order is:

1. Empty Vite app, auth wired in, can list thoughts from the same backend.
2. Ask — the simplest of the three. One input, one synthesized answer.
3. Map — the most complex. Build the AI clustering job on the backend first, then the React Flow rendering second.
4. Evaluate — straightforward once Ask is working. Different prompt, different output shape.
