# TOP1 Takip

> A job-tracking panel for small workshops: the admin hands the customer an 8-digit number, and that number is the entire login. No password, no account, no app.

**Live demo: [to-p1.com](https://to-p1.com)** · [Türkçe README](README.tr.md)

[![tests](https://github.com/zegroged/top1-takip/actions/workflows/test.yml/badge.svg)](https://github.com/zegroged/top1-takip/actions/workflows/test.yml)
![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)
![React 19](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Prisma 7](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-compose-2496ED?style=flat-square&logo=docker)
![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue)

**How this was built:** the code was written with AI assistance and reviewed by the author.

## Overview

Small workshops — a tiling contractor, an auto repair shop — lose a real part of every day to the same phone call: *"is it done yet?"* The owner has no system, so the answer is a verbal guess, and the customer calls again tomorrow. The obvious fix is a customer portal, but the usual portal is wrong for this audience: someone who will check on their car six times over two weeks is not going to create an account, verify an email, and remember a password.

This project removes the account entirely. The admin creates a customer record and the system generates a random 8-digit number. The customer types that number — nothing else — and lands on a read-only live view of their own job: an ordered checklist with a completion percentage, the estimated delivery date, and a dated timeline of updates with photos taken on the shop floor. The admin side is the mirror image: create the customer, seed a default task list, tick tasks off, reorder them, and post a dated update with photos that appears on the customer's screen immediately.

The codebase was first written for a tiling and renovation contractor — the repository directory is still `fayans`, Turkish for *tile* — and the same mechanic was then re-targeted to auto parts and vehicle repair tracking, which is what runs at to-p1.com today. The tracking core (customers, tasks, updates, photos) did not change between the two; only the task vocabulary and the marketing front page did. See [Status](#status) for what this deployment actually is.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components, Server Actions, `output: "standalone"`) |
| UI | React 19, Tailwind CSS v4 (`@theme` tokens, OKLCH palette), lucide-react; `sonner`'s `<Toaster />` is mounted in the layout but nothing fires a toast yet |
| Data | Prisma 7 with the `pg` driver adapter, PostgreSQL 16 |
| Auth | `jose` — HS256 JWT in an httpOnly cookie; `bcryptjs` for the admin password |
| Media | `sharp` (EXIF-aware resize to WebP) |
| Animation | GSAP 3 + `@gsap/react`, IntersectionObserver |
| Validation | Zod 4 (environment schema, validated at import time) |
| Deployment | Multi-stage Dockerfile, Docker Compose, behind an existing nginx reverse proxy + Cloudflare |

**Size:** 37 TypeScript/TSX files, ~3,500 lines under `src/` · 6 Prisma models · 7 pages · 19 Server Actions · 1 route handler · 0 automated tests (see [Known limitations](#known-limitations)). The generated Prisma client under `src/generated/` is gitignored and not counted.

## Features

### Customer (`/giris`, `/takip`)

- Log in with the customer number only. No password field exists.
- Live job summary: name, job title, customer number, estimated delivery date, address.
- Ordered task checklist with a progress bar and an `n/total` count.
- Dated timeline of updates, each optionally tied to a task and carrying photos.
- Sign out clears the session cookie.

### Admin (`/admin/giris`, `/admin`, `/admin/musteri/[id]`, `/admin/vitrin`)

- **First-run setup:** when the `admins` table is empty, `/admin/giris` renders a "create the first admin" form instead of a login form; afterwards it renders login.
- **Customer list** with server-side search across name, customer number, phone, and job title, each row showing live progress.
- **Create customer** with an optional "seed the default task list" checkbox that inserts the ten standard repair steps in order.
- **Customer detail:** edit details, add/reorder (up-down swap)/toggle/delete tasks, append more default tasks, post a dated update with a note and multiple photos, delete updates and photos, delete the customer (cascades).
- **Showcase manager** (`/admin/vitrin`): upload, order, and delete gallery images.
- Destructive buttons route through a `ConfirmSubmit` client component that cancels the form submit unless confirmed.

### Public site (`/`)

- Scroll-driven hero built on a single `<video>` element with two entirely different interaction modes (desktop vs. mobile — see below), part-category and value-proposition sections revealed on scroll, and a call-to-action into the customer login.

## Architecture / Design notes

**The customer number is the credential, and the design accounts for that.** This is the load-bearing decision of the project, so the surrounding code has to earn it. Numbers are 8 digits drawn from `crypto.randomInt`, retried up to 25 times against a unique index until one is free — not sequential, so they cannot be enumerated by counting up from a known number. The login action rate-limits by client IP (8 attempts/minute for customers, 5/minute for admins) to make guessing the ~90M space impractical. The customer view is strictly read-only; there is no action a customer session can take beyond signing out. The threat model is honestly "a neighbour should not be able to read your repair bill," not "this protects secrets" — and the limitations section says so.

**Two independent session namespaces, not one role field.** `src/lib/session.ts` issues separate signed JWTs under separate cookie names (`fayans_admin`, `fayans_customer`) and exposes `requireAdmin()` / `requireCustomer()` guards that redirect. Holding a customer cookie gives no path to admin state, because the admin guard reads a different cookie entirely. Cookies are httpOnly, `sameSite: lax`, `secure` in production, 30-day expiry matching the token's.

**No REST API — Server Actions, with one deliberate exception.** All 19 Server Actions are co-located with the pages that use them. The 14 that touch admin-owned data open with `await requireAdmin()`, so authorization cannot be forgotten at a route boundary that does not exist. The other five are the authentication actions themselves — first-run admin setup, admin login, customer login, and the two logouts — which necessarily run before or after a session exists; `setupAdmin` guards itself instead by refusing to do anything once `admins` is non-empty. The single route handler, `/foto/[...path]`, exists because uploaded photos live on a Docker volume rather than in the build output: it delegates to `readImage()` in `src/lib/uploads.ts`, which rejects anything where `path.basename(name) !== name` as path traversal, and returns the file with `Cache-Control: public, max-age=31536000, immutable` — safe because filenames are UUIDs and therefore never reused.

**Progress math is pure and shared.** `computeProgress` and `countDone` in `src/lib/tasks.ts` take a `{ done: boolean }[]` and nothing else — no Prisma types, no IO. Three separate pages (admin list, admin detail, customer view) import the same two functions, so the percentage a customer sees and the percentage the admin sees cannot drift apart. It also means these are the two functions in the project that would be trivial to unit-test first.

**Uploads are normalized on the way in, not on the way out.** `saveImage()` pipes every upload through sharp: `.rotate()` to bake in EXIF orientation (phone photos from the shop floor arrive sideways otherwise), resize to fit within 1600×1600 without enlarging, then WebP at quality 80, written under a fresh UUID. The original is never stored. The 30 MB ceiling is set in two places that have to agree — `serverActions.bodySizeLimit` in `next.config.ts` and `client_max_body_size` in the nginx snippet in the deploy notes.

**Environment validation runs at build time, which shapes the Dockerfile.** `src/lib/env.ts` parses `process.env` through a Zod schema at module import, so a missing `DATABASE_URL` or a short `SESSION_SECRET` fails loudly instead of surfacing as a runtime null. Because that import also executes during `next build`, the builder stage supplies obvious throwaway placeholders and the real secrets arrive at runtime via `env_file` — the placeholder never reaches an image layer that matters. `NEXT_PUBLIC_*` values are the opposite case: they are inlined into client bundles at build time, so the domain is passed as a Docker build arg rather than a runtime variable.

**Migrations are a compose dependency, not a deploy step someone remembers.** The Dockerfile has a dedicated `migrator` target whose only job is `prisma migrate deploy`. In `docker-compose.prod.yml`, `migrate` waits on the database healthcheck and `app` waits on `migrate` finishing with `condition: service_completed_successfully`. A failed migration stops the release instead of starting an app against a stale schema.

**It shares a host with services it does not own.** The production stack joins an external Docker network (`fayans_shared`) and publishes itself only as the network alias `fayans-web:3000`, exposing no host ports. The pre-existing nginx on that box keeps 80/443 and proxies one server block to the alias. The service is named `app`, not `web`, specifically so it cannot collide with the reverse proxy's own upstream naming — the kind of detail you only write down after it bites you once.

**Animation choices are documented as reversals, in the files where they were reversed.** Lenis smooth scrolling was removed after it hijacked the mouse wheel on desktop and locked touch scrolling on mobile; `SmoothScroll` is now a pass-through component kept only so the layout import does not break, with the reason in the file. `Reveal` deliberately uses IntersectionObserver rather than GSAP ScrollTrigger, because a mobile address bar collapsing changes viewport height and could leave a ScrollTrigger threshold untriggered — stranding content at `opacity: 0` — plus a 1.5-second fallback timer that reveals content unconditionally if the observer never fires. The hero runs two different implementations off one `<video>`: desktop scrubs `currentTime` from accumulated scroll delta and, when scrolling stops, switches to playing the clip at 0.8× (slow scrubbing of a 24 fps source looks like ~3 fps, while playback stays smooth); mobile abandons scrubbing entirely for tap-to-advance between four hand-picked "exploded view" frames, playing between them at 1.6× because seeking stutters on mobile decoders. All three animated paths — the desktop hero, the mobile hero, and `Reveal` — honour `prefers-reduced-motion`.

**A small Next 15 correctness detail.** Cookies cannot be mutated during render in Next 15, so `/takip` cannot clear a stale cookie when it finds the customer has been deleted — it can only redirect. `/giris` therefore re-verifies the customer still exists in the database before redirecting a cookie-holder back to `/takip`, which is what keeps the two pages from bouncing off each other forever. The reasoning is a comment above each redirect.

## Getting started

Requires Node 22+ and Docker.

```bash
git clone <repo-url> && cd fayans
npm install

docker compose up -d          # PostgreSQL 16 on :5432

cp .env.example .env          # then fill in the values below
npx prisma migrate dev        # apply schema + generate the client
npm run db:seed               # create the first admin
npm run dev                   # http://localhost:3000
```

`.env.example` documents every variable the application itself reads. The production compose file additionally expects `DB_PASSWORD`, which is documented in [deploy/DEPLOY.md](deploy/DEPLOY.md) rather than here. The two that must be set for local development:

- `DATABASE_URL` — the dev default already matches `docker-compose.yml`.
- `SESSION_SECRET` — minimum 16 characters, or startup fails validation. Generate one with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

`npm run db:seed` creates `admin` / `admin123` unless `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set. **Local use only.** In production, leave the table empty and create the first admin through the setup form at `/admin/giris`.

Then: sign in at `/admin/giris`, create a customer, copy the generated 8-digit number, and open `/giris` in a private window to see the customer's side.

Production deployment — Docker stack, shared network, nginx server block, rollback steps — is documented in [deploy/DEPLOY.md](deploy/DEPLOY.md) (Turkish).

## Known limitations

Written down deliberately; none of these are hidden from a reader of the code.

- **No automated tests.** Zero test files in the repository, and no test runner in `package.json`. `src/lib/tasks.ts` and `src/lib/stages.ts` are pure and would have been the natural starting point, but the project stopped before any tests were written.
- **The rate limiter is in-process memory.** `src/lib/ratelimit.ts` is a `Map` in the Node process. Correct for the single-container deployment it was written for, useless behind more than one replica, and reset by every restart. Redis or the database would be the fix.
- **Photos are on a local Docker volume, not object storage.** This pins the app to one host, and backups are whatever the operator does to the volume. Deleting a `Photo` or `ProgressUpdate` row removes the database record but does **not** unlink the file, so orphaned WebP files accumulate on disk. There is no cleanup job.
- **The customer number is a bearer token with no rotation and no expiry.** Anyone who has the number — a text message forwarded to the wrong person, someone reading over a shoulder — can see that job. Rate limiting slows guessing; it does not address sharing. Acceptable for a repair status page, not for anything sensitive.
- **`src/lib/stages.ts` is dead code.** It implements a six-stage pipeline (received → diagnosed → parts sourced → assembly → testing → ready) with progress helpers, and its comments reference `Customer.currentStage` and `ProgressUpdate.stage` — fields that are not in the Prisma schema. The per-customer task checklist replaced this design and the file was never deleted.
- **The showcase gallery is half-wired.** `/admin/vitrin` uploads, reorders, and deletes `ShowcaseItem` rows correctly, but the current auto-parts home page never queries them, so nothing is rendered publicly. The gallery section belonged to the earlier tiling version of the front page.
- **Unused components from the earlier version remain in the tree**, along with their video assets: `video-tour`, `video-scene-tour`, `cinematic-tour`, `flythrough-hero`, `scroll-hero`, `parallax`, `big-list`, plus 60 pre-rendered WebP frames under `public/frames/` from an approach the hero no longer uses. Only `parts-hero`, `reveal`, `smooth-scroll`, `confirm-submit`, and `ui` are reachable from a page.
- **Turkish-only UI.** All copy is hard-coded in the components; there is no i18n layer.
- **ESLint is skipped during production builds** (`eslint.ignoreDuringBuilds: true` in `next.config.ts`) so a lint warning cannot block a deploy. TypeScript checking still runs. There is no CI pipeline.
- **Task reordering is an up/down neighbour swap**, not drag-and-drop, and rewrites two rows per move inside a transaction. Fine at the scale of ten tasks per customer.

## Status

**This is a demo, and it was always meant to be one.** to-p1.com is not serving a real workshop's customers. I built it as a working reference so I could walk into auto shops and parts dealers in my city and show them a real system on a real domain instead of describing one — "this is what your customers would see; want one?" The company name, phone number, and copy in `src/lib/constants.ts` are placeholders, and the code says so in comments.

**Real usage: zero customers.** No workshop has adopted it. The pitching stopped and the project is no longer being developed.

It is published because the code is a fair sample of how I work: a real database schema, real authentication with an unusual and defended constraint, a production Docker deployment that coexists with services it does not own, and a set of animation decisions I got wrong once and documented when I reversed them. The earlier tiling-contractor version and the auto-parts version share the same tracking core, which is the part I would point to first.

## License

AGPL-3.0 — see [LICENSE](LICENSE).

The AGPL is deliberate. This was built as a working demo to pitch to workshops rather than as a teaching example, and it is a complete deployed system rather than a sketch. Anyone may study, modify, and run it — but running a modified version as a network service means publishing the source of that version. Copyright is held by the author, so separate commercial terms can be arranged on request.
