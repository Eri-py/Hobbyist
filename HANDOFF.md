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
- **Web mid-upload close = leave the zombie + GC sweep reclaims it.** Client carries ZERO cleanup logic. We chose this over `sendBeacon`-on-close (unreliable, races the PUTs). **⚠️ PARTIALLY SUPERSEDED (session 3):** the server GC still reclaims orphans, but the client is no longer zero-logic — we're adding durable local persistence + resume (see the "optimistic background upload" milestone). GC and client-resume are complementary: GC cleans the *server* row, persistence preserves the *user's work*.
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

What started as the background-tasks hook grew into a full app-level notification system. All web + shared green (`pnpm --filter website test` 113, `pnpm --filter @hobbyist/hooks test` 108, web/shared typecheck clean). Committed as `a8ef249` (create-flow rewire), `814636a` (notification system + migrations), `85db0bb` (auth errors via injected `onError`), and `ef93b30` (key-based dismissal + banner restyle).

- **`useBackgroundTasks` + `BackgroundTasksProvider`** (`hooks/app/` + `providers/app/`, in `AppProvider`): `run(task, {label})` tracks in-flight fire-and-forget work for a single `beforeunload` guard (attached only while pending), and surfaces terminal failures through `notify` (the task owns its own retries; `run` never rejects → safe to `void`). **NOTE: still has zero consumers — the create flow does not route through it yet (next milestone).**
- **`NotificationProvider`** (mounted at `__root.tsx`, above the router so it persists across in-app nav): `notify({ message, severity, duration?, action?, key? })` / `dismiss(id)` / `dismissKey(key)`. `action` ⇒ sticky; `key` replaces instead of stacking; `dismissKey` clears a keyed entry without holding the id `notify` returned (id stays unique so replace-by-key still remounts/re-animates the banner). Responsive `NotificationViewport`: desktop top-right stack (≤3), mobile single top slide-down banner, faster drain under backlog.
- **`NotificationBanner` restyle (`ef93b30`):** MUI `Alert` + `Slide`, but **constant `background.paper` surface** instead of a severity-colored fill — severity reads through the **icon color + a 4px left accent stripe** (`info` uses the brand `primary.main`, since default MUI info-blue is too pale on paper). Taller, with 24px icon / 16px text mirroring the mobile `ErrorMessage`. (Note the theme's global `MuiSvgIcon` override forces icons black/white, so the banner colors its icon explicitly.)
- **All toasts migrated → `notify`, old components deleted:** background-tasks failures, create media-validation errors (`useMediaUpload`, `ErrorStack` deleted), home login prompt (`LoginSnackbar` deleted).
- **Server-error handling reworked:** shared pure `getServerErrorMessage` normalizer (network/no-response, status fallbacks, `data.message`, default). **`useServerError` removed.** `useLogin`/`useSignUp`/`useOtp` now take an injected `onError(message)` (DI) called in each mutation's `onError` with the normalized message — web passes `notify({severity:"error", key:"auth-error"})`, mobile passes a local `setState` for inline display. Field validation (RHF) stays inline, untouched.
- **Auth-error step clearing (`ef93b30`):** login/sign-up call `dismissKey("auth-error")` in a `useEffect` keyed on `step`, so a failure from one step is retired when the user advances rather than lingering into the next step. (Errors never change `step` themselves, so this can't clobber a fresh error.) The cross-*route* bleed case is left as-is by design — the same `dismissKey` in an unmount cleanup would close it if ever wanted.

Why `beforeunload` alone (no TanStack `useBlocker`): in-app nav keeps the SPA — and the in-page upload — alive, so we only care about real tab close/reload. The pre-submit blocker in `create.tsx` is separate and unchanged; after submit `hasPostedRef` flips it off and this guard takes over.

## Wire the create flow through `run()` (2026-06-12, session 3) — DONE (web)

The create flow now routes through the background-task runner. Shared 108 + website 114 green, both typechecks clean.

- **Shared engine:** `createPost`/`saveDraftMutation` collapsed into one `submit(sources, publish)` (`useCreatePost.ts`). Generalized `attemptPublish` → `attemptSubmit(body, sources, publish)` (success = `publish ? published : pendingPositions.length === 0`; self-discards its orphan). `submit` owns the retry loop (`MAX_SUBMIT_ATTEMPTS = 2`) and **rejects on terminal failure**. `useMutation`/`isSavingDraft`/slug-return all gone — the draft is no longer "tracked." Returns just `{ methods, submit }`.
- **`useCreate.ts`:** pulls `run` from `useBackgroundTasks`; publish = `onPostCreated(); void run(() => submit(sources, true), { label: "Publishing your post" })`; draft = `void run(() => submit(sources, false), { label: "Saving your draft" })` (+ an empty-files guard, since a draft is still media-first). Draft does **not** call `onPostCreated` — the caller proceeds.
- **`create.tsx`:** `handleSaveDraftAndProceed` is now synchronous fire-and-forget (`saveDraft(files); blocker.proceed?.()`); `saveError` state, the try/catch, and the dialog spinner removed. Draft failures surface via the notification banner.
- **`hasPostedRef` kept** — it suppresses the leave-dialog on the optimistic publish-navigation; unrelated to `run`.

## Optimistic *background upload* (durable + partial-resume) (2026-06-13, session 3) — DONE (web)

Renamed the pattern **"fire-and-forget" → "background upload"** (it persists, retries, and resumes). The web create flow now survives a tab close / crash / connection drop and resumes **only the files that didn't land** (per-file, not byte-offset). All green: backend 143, shared 110, website 124, all typechecks + web lint clean.

**Architecture (reuse primitives, keep our engine):** the shared engine stays the orchestrator; persistence + transport are the platform seam. We did **not** adopt Uppy (would re-fork web from the shared engine). Reused `idb-keyval` (web blob store) only.

Pipeline: **click → persist snapshot to IndexedDB → `init` (persist slug) → upload → `finalize` (re-signs anything still missing) → loop on the gaps → delete snapshot.** Failure leaves the snapshot; on next load the resume sweep continues it; past TTL it's dropped and the server GC reclaims the orphan.

What shipped:
- **Backend — `finalize` returns `PendingUploads`** (`PostUploadService.Finalize.cs`): `VerifyUploadedMediaAsync` now re-signs a fresh upload target (via the existing `BuildUploadAsync`, same object key) for each still-`Pending` file and returns them. `FinalizeResponse.PendingPositions` (int[]) was **replaced** by `PendingUploads: PresignedUpload[]` (positions live inside). `finalize` already flips landed files to `Uploaded` and persists incrementally, so uploaded files stay uploaded across calls — that's what makes partial resume work. New test `FinalizeAsync_AcrossCalls_KeepsLandedFilesAndResignsOnlyMissing`.
- **Shared engine reworked** (`useCreatePost.ts`): discard-and-recreate → **`init → loop(upload → finalize)`** on `pendingUploads` (`uploadAndFinalize`). `uploadTargets` uses `Promise.allSettled` (a failed PUT doesn't abort the rest; finalize is the truth). Added `resume(slug, payload, onSlug)` (finalize-discover → upload gaps; **404 ⇒ recreate via `submit`**) and a `SlugSink` (`onSlug`) so the client persists the slug. **No more client discard** — a give-up leaves a Draft+pending post for resume/GC. Extracted **`createUploadEngine(axios, transport)`** (form-free `{ submit, resume }`); `useCreatePost` composes it with the form + `buildPayload`.
- **Web persistence** (`Website/src/lib/uploadStore.ts`, `idb-keyval`): `PersistedUpload { id, createdAt, slug?, payload }`; `saveUpload`/`deleteUpload`/`listUploads`. **No `fake-indexeddb`** — tests mock `idb-keyval` in-memory.
- **Web wiring**: `useCreate.dispatch` persists the snapshot, runs `submit(payload, onSlug)` (onSlug persists the slug), deletes on success — all best-effort (`.catch`). `hooks/create/useResumeUploads` (create-domain; mounted via a tiny `ResumeUploadsOnLoad` inline in `AppProvider`, since it must render inside `BackgroundTasksProvider`; gated on auth, runs once) sweeps `listUploads()`: resumes records with a slug, recreates those without, drops records older than `RESUME_TTL_MS` (1h). NB: the sweep is web glue (idb-keyval + web `run()`), so it lives in the web app, not the shared engine — the shared engine only exposes the `resume()` primitive.
- **Test infra**: added `test.server.deps.inline: ["@mui/material"]` to `vite.config.ts` (MUI v9 ESM directory-import of `react-transition-group` breaks under vitest externalization — see that file's comment).

**Reversed decisions (don't relitigate):** always-recreate → partial resume; discard-on-failure → leave for resume/GC. The GC sweep is now the primary server cleanup.

### Still to do here
- ✅ **W5 — notification "Retry" action** (session 4): a failed `run()` now surfaces a sticky `action: { label: "Retry" }` that re-invokes the same task thunk via `run` (a fresh, tracked attempt that re-offers Retry if it fails again). Default for *every* failed background task — no opt-in flag, since a task thunk is inherently re-invocable (in create, re-running `submit` is a safe fresh attempt that self-discards orphans). Failure messages dropped "Please try again." (the button is the affordance now). `BackgroundTasksProvider.tsx` + `useBackgroundTasks` doc + tests (website 125 green, typecheck + lint clean).
- **Browser verification**: confirm real-browser IndexedDB blob byte-fidelity + a true close-tab-then-reopen resume (untestable in jsdom).
- **GC sweep + grace** (server, deferred): must be set against `RESUME_TTL_MS` (1h) and presigned-URL `expiresAt`.
- **Mobile** (separate, big): currently *broken* (imports deleted `appendPostFields`/`appendDraftFields` + old `useCreatePost(axios)` signature). Rewire onto `createUploadEngine` + a native transport: `expo-file-system` (persist asset to disk — iOS background upload *requires* a file, not in-memory data) + `react-native-background-upload` (NSURLSession-background / Android service, survives termination). **Risk: native-module compat on RN 0.83 / Expo 55 — spike first.** Partial resume + the `pendingUploads` seam are now ready for it.

**Research precedents (verified):** Uppy *Golden Retriever* (web crash recovery via IndexedDB/ServiceWorker), *tus* (resume-from-offset), iOS `URLSession` background + Android `WorkManager`.

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
