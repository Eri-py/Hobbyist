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

## Two-state redesign (2026-06-10, session 2) — DONE (backend + web client)

Reworked the post lifecycle. Backend: `dotnet build` + `dotnet test` green (142 tests, incl. new `Hobbyist.Tests/PostUploadServicesTests/PostUploadServiceTests.cs` — 24 cases over init/finalize/discard). Web client: `@hobbyist/types` regenerated, shared engine rewired, `pnpm --filter @hobbyist/hooks test` (113) + `pnpm --filter website test` (101) + web/shared `typecheck` all green. **Mobile is still intentionally broken** (old FormData flow — step 4 below).

What changed (backend only):
- **Two-state `PostStatus`:** `Draft = 0`, `Published = 1` — `Uploading` is gone. Status is *intent*, not byte progress; byte progress stays per-file on `PostMediaStatus` (`Pending`/`Uploaded`). A post is **always born Draft** (whether Post or Save draft). Migration `PostStatusTwoState` remaps existing rows (1→0, 2→1; Down is lossy, fine pre-launch).
- **One `init` endpoint.** `POST posts/init` takes the unified `InitPostRequest` (metadata optional, media required). `posts/init-draft` is **deleted**. `InitPublishRequest`/`InitDraftRequest` merged into `InitPostRequest`.
- **Intent-driven finalize.** `POST posts/{slug}/finalize` now takes a body `FinalizeRequest { bool Publish }`. `publish:true` + all media verified + metadata complete → `Published`; otherwise stays `Draft`. Idempotent on already-published. The client supplies intent — **no stored "publish-intent" bit** (that's the whole point of two states).
- **`pendingPositions` STAYS** in `FinalizeResponse` (it's the "all verified?" signal both clients read; mobile's future partial-retry seam). Partial-retry *client logic* deferred to the mobile milestone; web still does full delete-and-recreate.
- **Rename:** `IMediaObjectStoreService.HeadObjectAsync` → `GetObjectInfoAsync`. Finalize's verify loop extracted to `PostUploadService.VerifyUploadedMediaAsync`.
- **Draft invariant:** a *resting* Draft must have zero `Pending` media (the GC discriminator). So Save-draft must discard if its finalize comes back with non-empty `pendingPositions` — enforced **client-side in Phase 7**, not in the service.

Web client sync (done): `@hobbyist/types` regenerated; `useCreatePost.ts` now uses a single `posts/init` (`buildInitBody` for both flows), `finalizeApi(slug, publish)` posting `{ publish }`, publish → `finalize(true)`, draft → `finalize(false)` and discard+throw on non-empty `pendingPositions`. Tests updated accordingly.

**Still to do for mobile (the original step 4):** rewire `Mobile/src/hooks/create/useCreate.ts` off the deleted `appendPostFields`/`appendDraftFields` + FormData onto the presigned engine, with real OS background upload (iOS `URLSession` / Android `WorkManager`) — that's where partial-retry via `pendingPositions` finally gets consumed.

Next up after this: the web background-tasks hook (milestone below).

## Background-tasks + notification system (2026-06-11/12, session 2) — DONE (web)

What started as the background-tasks hook grew into a full app-level notification system. All web + shared green (`pnpm --filter website test` 113, `pnpm --filter @hobbyist/hooks test` 108, web/shared typecheck clean). Committed as `a8ef249` (create-flow rewire), `814636a` (notification system + migrations), and the auth DI commit.

- **`useBackgroundTasks` + `BackgroundTasksProvider`** (`hooks/app/` + `providers/app/`, in `AppProvider`): `run(task, {label})` tracks in-flight fire-and-forget work for a single `beforeunload` guard (attached only while pending), and surfaces terminal failures through `notify` (the task owns its own retries; `run` never rejects → safe to `void`).
- **`NotificationProvider`** (mounted at `__root.tsx`, above the router so it persists across in-app nav): `notify({ message, severity, duration?, action?, key? })` / `dismiss(id)`. `action` ⇒ sticky; `key` replaces instead of stacking. Responsive `NotificationViewport`: desktop top-right stack (≤3), mobile single top slide-down banner, faster drain under backlog. `NotificationBanner` = MUI `Alert` + `Slide`.
- **All toasts migrated → `notify`, old components deleted:** background-tasks failures, create media-validation errors (`useMediaUpload`, `ErrorStack` deleted), home login prompt (`LoginSnackbar` deleted).
- **Server-error handling reworked:** shared pure `getServerErrorMessage` normalizer (network/no-response, status fallbacks, `data.message`, default). **`useServerError` removed.** `useLogin`/`useSignUp`/`useOtp` now take an injected `onError(message)` (DI) called in each mutation's `onError` with the normalized message — web passes `notify({severity:"error", key:"auth-error"})` (auto-hide, no linger), mobile passes a local `setState` for inline display. Field validation (RHF) stays inline, untouched.

Why `beforeunload` alone (no TanStack `useBlocker`): in-app nav keeps the SPA — and the in-page upload — alive, so we only care about real tab close/reload. The pre-submit blocker in `create.tsx` is separate and unchanged; after submit `hasPostedRef` flips it off and this guard takes over.

## NEXT MILESTONE — wire the create flow through `run()` (the original goal)

Now that `run` + notifications exist, finish the optimistic create flow:

1. **Shared engine:** collapse `createPost`/`saveDraft` into one `submit(sources, publish)` that owns the retry loop and **rejects on terminal failure** (so `run` notifies). Decided: both Post and Save-draft are fire-and-forget + optimistic; the leave-dialog "Save draft" fires `submit(false)` and proceeds. (See the draft-vs-publish discussion — the only difference is the `publish` flag.)
2. **`useCreate.ts` / `create.tsx`:** `const { run } = useBackgroundTasks();` then for both paths `onPostCreated(); void run(() => submit(sources, publish), { label: "Publishing your post" | "Saving your draft" });`. Drop `isSavingDraft`/the dialog spinner.
3. Tests: assert both paths dispatch through `run`.

Then **mobile** (the original step 4): rewire `Mobile/src/hooks/create/useCreate.ts` off FormData onto the presigned engine + OS background upload — where partial-retry via `pendingPositions` finally gets used.

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
