# HANDOFF — create-post presigned-upload overhaul

> Temporary cross-machine handoff. Delete before merging the branch.
> On a fresh machine: pull this branch, open Claude Code, say *"read HANDOFF.md and continue"* — and have it re-create the local memory entries from this doc.

## What this is

Re-architecting post creation from a fire-and-forget multipart upload into a **media-first, presigned, optimistic-with-background-upload** model. The client declares a media manifest, the server hands back pre-signed PUT URLs, the client uploads bytes **directly to storage**, then calls `finalize` (HEAD-verify → publish).

- **Branch:** `create-post-presigned-upload` (off `main`).
- **DB:** Postgres. **Storage:** MinIO (S3-compatible) behind `IMediaUrlSignerService` + `IMediaObjectStoreService`.

## Where we are now (2026-06-10)

**The web upload flow works end-to-end** — submit → init → direct PUTs to MinIO → finalize → published. Verified live in the browser.

Client-migration plan status (original 5-step plan):
1. ✅ **OpenAPI type regen** — `@hobbyist/types` has `InitPublishRequest`, `InitDraftRequest`, `InitPostResponse`, `PresignedUpload`, `FinalizeResponse`, `MediaManifestItem`.
2. ✅ **Shared upload engine** — `useCreatePost` (now in `Shared/hooks/src/create/`, **not** `app/`).
3. ✅ **Web client rewire** — `useCreate` + `uploadToStorage` transport.
4. ⏳ **Mobile client** — NOT done; **currently broken** (still calls the old `createPost(formData)` / `appendPostFields`). Left broken on purpose until we get to it. OS background upload (iOS `URLSession` / Android `WorkManager`) is the real work.
5. ✅ **Test rewrite** — done alongside 2 & 3.

## Commits this session (on top of `d1037f8`)

- `23a1111` Rewrite useCreatePost onto the presigned upload flow (regen + shared engine + tests).
- `37f45f6` Rewire the web create flow onto the presigned upload engine.
- `4ce267c` Fix presigned URL scheme and empty-prefix discard; move useCreatePost to create/.

## How the shared engine works

`Shared/hooks/src/create/useCreatePost.ts` — `useCreatePost<TFile = File>(axiosInstance, transport)`:
- Inline API fns (`initApi`/`initDraftApi`/`finalizeApi`/`discardApi`), `useLogin`-style.
- `buildManifest` (exported, pure): array order → 1-based `position`.
- `uploadAll`: parallel PUT of each source to its matching `PresignedUpload` via the injected `transport` (position N → `sources[N-1]`).
- `attemptPublish`: `init → uploadAll → finalize`; discards on incomplete/error so no orphan from our own retries.
- `createPost` (publish): fire-and-forget, optimistic; up to `MAX_PUBLISH_ATTEMPTS = 2` (one recreate). **Finalize is called automatically right after `await uploadAll` resolves** — plain sequential await, the web never references finalize.
- `saveDraft` (draft): `init-draft → uploadAll`, **no finalize** (stays Draft; finalize happens in the future "open draft → publish" flow). Awaited via mutation so the blocker dialog shows `isSavingDraft`.
- Exported seams: `UploadSource<TFile>`, `UploadTransport<TFile>` (generic, default `File`).

Web glue:
- `Website/src/api/uploadToStorage.ts` — `uploadToStorage`: raw `fetch` PUT to the presigned URL with `requiredHeaders`. **Deliberately bypasses axiosInstance** (storage, not our API: no cookies/baseURL/refresh interceptor). Reusable for profile pics / banners later — lives in `api/`, not `create/`, for that reason.
- `Website/src/hooks/create/useCreate.ts` — injects `uploadToStorage`, maps `FileWithMetadata[]` → `UploadSource[]`, drops FormData.
- `Website/src/routes/_app/create.tsx` — pre-submit `useBlocker` (Save-draft/Discard dialog) unchanged; submit drops the redundant validated-values arg.

## Decisions made this session (don't relitigate)

- **No progress UI — truly fire-and-forget.** Submit → navigate away → upload runs in-page → done. Mobile gets real OS background upload; web can't, so we mitigate at close-time (see next milestone).
- **Reconciliation REVERSED back in** — but trivially: it's NOT a new service. It's a scheduled job that queries `Status == Draft && Media.Any(Pending) && CreatedAt < now - TTL` (grace ~5 min, TBD) and calls the **existing `DiscardAsync`** (which already deletes S3 + DB row). This is the cleanup mechanism for web zombies (tab closed mid-upload) and any client that never returns. Still deferred — backend, independent of client work. (Query updated for the two-state model — see the redesign section below.)
- **Web mid-upload close = leave the zombie + GC sweep reclaims it.** Client carries ZERO cleanup logic. We chose this over `sendBeacon`-on-close (unreliable, races the PUTs).
- **Local MinIO stays HTTP** (`UseSsl: false`, `http://localhost:9000`). Prod parity via mkcert was considered and declined (per-machine cert chore). `http://localhost` is mixed-content-exempt so the browser PUT works even though the site is HTTPS (Tailscale).
- **Always-recreate; client owns retry.** No resume-from-partial. `finalize` idempotent.

## Backend fixes this session

- **Pre-signed URL scheme** (`MinioMediaUrlSignerService`): the AWS SDK defaults `GetPreSignedUrlRequest.Protocol` to HTTPS regardless of `ServiceURL`, so local HTTP MinIO got `https://` URLs → `ERR_SSL_PROTOCOL_ERROR` on every PUT. Now driven by `MediaStorage:UseSsl` and set on both the read (GET) and upload (PUT) requests.
- **`DeleteByPrefixAsync` NRE** (`MinioMediaObjectStoreService`): AWS SDK v4 returns `S3Objects = null` (not empty) when nothing matches; `.Count` threw. Null-guarded → discarding a never-uploaded post is a clean no-op, not a 500. (This was firing constantly because the failing PUTs drove the discard+recreate retry.)
- Tests added: `WebServer/Hobbyist.Tests/MediaStorageServicesTests/` (signer scheme + objectstore empty/happy-path). Starts the deferred storage-service test pass.

## Backend two-state redesign (2026-06-10, session 2) — DONE, client sync pending

Reworked the post lifecycle. `dotnet build` + `dotnet test` green (142 tests, incl. new `Hobbyist.Tests/PostUploadServicesTests/PostUploadServiceTests.cs` — 24 cases over init/finalize/discard).

What changed (backend only):
- **Two-state `PostStatus`:** `Draft = 0`, `Published = 1` — `Uploading` is gone. Status is *intent*, not byte progress; byte progress stays per-file on `PostMediaStatus` (`Pending`/`Uploaded`). A post is **always born Draft** (whether Post or Save draft). Migration `PostStatusTwoState` remaps existing rows (1→0, 2→1; Down is lossy, fine pre-launch).
- **One `init` endpoint.** `POST posts/init` takes the unified `InitPostRequest` (metadata optional, media required). `posts/init-draft` is **deleted**. `InitPublishRequest`/`InitDraftRequest` merged into `InitPostRequest`.
- **Intent-driven finalize.** `POST posts/{slug}/finalize` now takes a body `FinalizeRequest { bool Publish }`. `publish:true` + all media verified + metadata complete → `Published`; otherwise stays `Draft`. Idempotent on already-published. The client supplies intent — **no stored "publish-intent" bit** (that's the whole point of two states).
- **`pendingPositions` STAYS** in `FinalizeResponse` (it's the "all verified?" signal both clients read; mobile's future partial-retry seam). Partial-retry *client logic* deferred to the mobile milestone; web still does full delete-and-recreate.
- **Rename:** `IMediaObjectStoreService.HeadObjectAsync` → `GetObjectInfoAsync`. Finalize's verify loop extracted to `PostUploadService.VerifyUploadedMediaAsync`.
- **Draft invariant:** a *resting* Draft must have zero `Pending` media (the GC discriminator). So Save-draft must discard if its finalize comes back with non-empty `pendingPositions` — enforced **client-side in Phase 7**, not in the service.

⚠️ **The web client is now BROKEN against this backend until Phase 7.** It still calls `posts/init-draft` (gone → 404) and `finalize` with no body. Fixing that is the immediate next step:

### Phase 7 — client contract sync (do this next; needs Tailscale for type regen)
1. Regen `@hobbyist/types`: `cd Shared/types && npm run generate-types` — **requires the API running** (`generate-openapi-types.js` fetches `/openapi/v1.json`), so it needs Tailscale.
2. `Shared/hooks/src/create/useCreatePost.ts`: single `posts/init` for both flows; `finalizeApi(slug, publish)` posts `{ publish }`; publish path → `finalize(true)`; draft path → `finalize(false)` and, on non-empty `pendingPositions`, discard + throw so the awaited mutation rejects.
3. Update shared-engine tests + the `Website useCreate` test (drop the `init-draft` mock; assert draft now finalizes with `publish:false`).

Then resume the original milestone below (web background-tasks hook).

## NEXT MILESTONE — reusable background-tasks system (web)

Goal: a **generic "fire and keep tracking" registry** any web feature can use (post upload first; profile pics / banners later) + one app-level `beforeunload` guard. Not a one-off for posts. Web uses React Context providers (no Zustand); pattern = context+hook in `hooks/app/`, provider in `providers/app/`, composed in `AppProvider`, mounted at `__root.tsx`.

Plan (stop at the provider for review before wiring `useCreate`):

1. **`Website/src/hooks/app/useBackgroundTasks.ts`** — context + `useBackgroundTasks` hook + types:
   ```ts
   type BackgroundTask = { id: string; label?: string; startedAt: number };
   type BackgroundTasksContextTypes = {
     pending: BackgroundTask[];
     hasPending: boolean;
     run: <T>(task: () => Promise<T>, meta?: { label?: string }) => Promise<T>;
   };
   ```
2. **`Website/src/providers/app/BackgroundTasksProvider.tsx`** — holds `pending`; `run` adds an entry, invokes the thunk, removes it in `.finally`; a single `beforeunload` listener (read pending via a ref, no re-bind) calls `preventDefault()` while pending is non-empty. Add to `AppProvider`.
3. **Shared engine tweak:** make `createPost` **return** its promise instead of `void`-ing it (the retry loop never rejects, so exposing it is safe; mobile keeps ignoring the return). That makes it trackable without the engine knowing about the web tracker.
4. **`useCreate.ts`:** `const { run } = useBackgroundTasks();` then `onPostCreated(); void run(() => createPost(sources), { label: "Publishing your post" });`

Why `beforeunload` alone (no TanStack `useBlocker`): in-app nav keeps the SPA — and the in-page upload — alive, so we only care about real tab close/reload, which is exactly what `beforeunload` catches. Accept the browser limitation: `beforeunload` shows only the generic "Leave site?" prompt, not a custom dialog. The pre-submit blocker in `create.tsx` is separate and unchanged; after submit `hasPostedRef` flips it off and this guard takes over.

Tests: `BackgroundTasksProvider` — `run` adds then removes on settle (success AND failure), `hasPending` reflects state, `beforeunload` prevented only while pending; update `useCreate` test to assert publish dispatches through `run`.

## Other remaining backend tail

- **MinIO bucket CORS** — needed for prod (cross-origin browser PUT). Not yet hit locally because `http://localhost` same-ish origin works; prod will need it.
- **GC sweep** (the reinstated reconciliation) — scheduled `DiscardAsync` over `Draft && Media.Any(Pending)`-past-TTL. Backend, deferred. (Relies on the invariant that a resting draft has zero Pending media — see redesign section.)
- Remaining storage/`PostUploadService`/`MediaObjectKeys` tests (signer + objectstore done).

## Working-style reminders (this repo)

- **Ask before editing** — propose the concrete change, wait for a green light; don't auto-change then show.
- **Stop at each major logic milestone** for review; keep diffs small; explain unfamiliar concepts.
- **No backwards compatibility** — no real users yet, so overhauls delete old code outright.
- **Commits:** capitalized subject ending in a period, then `- ` bullets; end with the `Co-Authored-By` trailer.
- Naming/structure: folders under `Services/` end in `Services`; DI types are `I{Name}Service` / `{Name}Service`; config = `*Config`. Web: context+hook in `hooks/`, provider in `providers/`.
- `gh` CLI is **not installed** — open PRs via the push URL + a ready-to-paste title/body.
- The app **can't run locally without Tailscale** (Kestrel binds the Tailscale host cert). `dotnet build` / `dotnet ef` / `dotnet test` work without it. MinIO runs via `Setup/WebServer/docker-compose.yml` (storage profile).

## Deep references (machine-local, did NOT travel with git)

- Memory: `~/.claude/projects/.../memory/` — `project-draft-post-backend` is STALE (describes the old FormData flow); trust this HANDOFF over it.
- Plan: `~/.claude/plans/the-create-post-logic-groovy-scroll.md`.
