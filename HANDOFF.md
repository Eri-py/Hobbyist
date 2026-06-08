# HANDOFF — create-post presigned-upload overhaul

> Temporary cross-machine handoff. Delete before merging the branch.
> On a fresh machine: pull this branch, open Claude Code, say *"read HANDOFF.md and continue"* — and have it re-create the local memory entries from this doc.

## What this is

Re-architecting post creation from a fire-and-forget multipart upload into a **media-first, presigned, optimistic-with-background-upload** model. The client declares a media manifest, the server hands back pre-signed PUT URLs, the client uploads bytes **directly to storage**, then calls `finalize` (HEAD-verify → publish).

- **Branch:** `create-post-presigned-upload` (off `main`).
- **Backend + service-naming standardization** already merged to `main` via PR #1024 (2026-06-08). Subsequent work is on this branch.
- **DB:** Postgres. **Storage:** MinIO (S3-compatible) behind `IMediaUrlSignerService` + `IMediaObjectStoreService`.

## Backend state (done, on this branch)

- `PostMedia` table + `PostStatus` enum (**Draft / Uploading / Published**). `Status` + `PublishedAt` replaced the old `IsDraft` / `MediaCount`.
- Media keyed by a stable **GUID `Id`** with a mutable `Position`; storage object key = `{userId}/{postId}/{mediaId}{ext}` (single source of truth: `Hobbyist.Common/MediaObjectKeys.cs`).
- `PostUploadService` owns the lifecycle — partial classes under `WebServer/Hobbyist.Api/Services/PostServices/PostUploadServices/`:
  - `init` (`InitPublishAsync`) / `init-draft` (`InitDraftAsync`) — `PostUploadService.Init.cs`
  - `{slug}/finalize` (`FinalizeAsync`) — `PostUploadService.Finalize.cs`
  - `DELETE {slug}` (`DiscardAsync`) — `PostUploadService.Discard.cs`
  - shared helpers (`LoadOwnedPostAsync`, `BuildUploadAsync`) — `PostUploadService.cs`
- Controller: `WebServer/Hobbyist.Api/Controllers/PostsController.cs`. DTOs: `WebServer/Hobbyist.Api/Dtos/Posts/PostUploadDtos.cs`. Limits/config: `PostServices/PostMediaConfig.cs`.
- Migration `AddPostMediaAndStatus` applied (hand-edited to drop+add `Status`, not rename).

## Decisions made this session (don't relitigate)

- **Always-recreate model; client owns retry (Instagram-style).** `finalize` is verified by whoever calls it and is idempotent (already-Published → `Published:true`; discarded → `NotFound`), so any client that returns self-heals.
- **Removed `RefreshUploadsAsync`** (interface, `Finalize.cs`, `{slug}/uploads/refresh` endpoint, and its DTOs). **No resume-from-partial** — retry = client `Discard`s the stuck post and `init`s a fresh one from its local copy. Justification: realistic payloads are small (compress client-side), so re-uploading on the rare retry is cheap and beats maintaining resume + partial-state logic. Reversible (adding resume back is additive).
- **Upload-URL TTL** is now an explicit constant `PostMediaConfig.UploadUrlLifetimeMinutes` (currently 15) instead of relying on the signer's implicit default. The real expiry risk is session interruption (app backgrounded/killed), not bandwidth — bump it if that proves to bite.
- **Removed `PostStatus.Failed`** — vestigial; failure lives as the client's local pending post, not a server state. No migration needed (plain `int` column, no check constraint).
- **Reconciliation sweep DROPPED** (deleted the `UploadReconciliationService` skeleton). Its only unique job was GC'ing uploads from clients that *never* return (orphaned storage + zombie `Uploading` rows — invisible to users since feeds show only `Published`). Deferred as YAGNI with no user base; revisit when storage cost matters. Without a sweep, a stuck post is never server-deleted, so a returning client can always discard+recreate.
- **`mediaId` stays a GUID.** It lives only in the internal storage key, surfaced solely in img-src presigned URLs — never in a page URL. Viewing route is `/profile/{username}/{postId}` (`Website/src/routeTree.gen.ts`, no media segment); public URLs use `username` (unique), not `userId`. A media slug buys nothing.
- **`Position` kept.** It's the client↔server correlation handle (manifest item ↔ returned upload URL; `mediaId` is never sent to the client) and the future "share a specific slide" handle (`?slide=N`, Instagram `img_index`-style — positional, follows the slot if posts ever become reorderable).

## Recent commits on this branch

- `Adopt always-recreate upload model; drop reconciliation.`
- `Drop null-forgiving operators on user name claims.`

## Next milestone — migrate the CLIENT onto the presigned flow

The client is still on the **old flow**: `Shared/hooks/src/app/useCreatePost.ts` posts `FormData` to the now-deleted `posts/create` / `posts/draft`, typed against stale generated types (`CreatePostResponse` / `CreateDraftResponse`, which no longer exist). The website route (`Website/src/routes/_app/create.tsx`) drives off website-local hooks `@/hooks/create/useCreate` + `@/hooks/create/useMediaUpload` (dropzone, reorder, errors) — and **already has the `beforeunload`/blocker + draft-or-discard dialog wired** (`useBlocker`). Nothing calls the new endpoints yet.

Dependency-ordered plan:

1. **OpenAPI type regen** *(prerequisite)* — get `InitPublishRequest`, `InitPostResponse`, `PresignedUpload`, `FinalizeResponse` into the generated `@hobbyist/types`. **Confirm how types are generated here** (committed `openapi.json` + an `openapi-typescript` script, vs. emitting the spec from the app — and whether the Tailscale-cert wrinkle blocks running the app).
2. **Shared upload engine** — orchestrates `init` → presigned `PUT` per file (with progress) → `finalize`; retry = `discard` + re-`init`. Platform-agnostic core, transport injected (browser `fetch`/XHR vs. native background upload).
3. **Web client rewire** — point `useCreate` / `useMediaUpload` at the engine; optimistic submit; blocker/draft dialog already present.
4. **Mobile client** — OS background uploads (iOS `URLSession` / Android `WorkManager`); background-relaunch to call `finalize` is invisible (no app pop-up).
5. **Test rewrite** — replace the old silent-failure `Shared/hooks/src/tests/create/useCreatePost.test.tsx`.

Recommended start: **#1 (OpenAPI regen) → web first.**

## Other remaining backend tail

- MinIO bucket CORS (so the web client can PUT directly).
- The deferred test pass (new `PostUploadService` / `MediaObjectKeys` tests).
- Deferred: orphan-GC sweep (the dropped reconcile), if/when storage leak matters.

## Working-style reminders (this repo)

- **Ask before editing** — propose the concrete change, wait for a green light; don't auto-change then show.
- **Stop at each major logic milestone** for review; keep diffs small; explain unfamiliar concepts.
- **No backwards compatibility** — no real users yet, so overhauls delete old code outright.
- **Commits:** capitalized subject ending in a period, then `- ` bullets; end with the `Co-Authored-By` trailer.
- Naming/structure: folders under `Services/` end in `Services`; DI types are `I{Name}Service` / `{Name}Service`; config = `*Config`.
- `gh` CLI is **not installed** — open PRs via the push URL + a ready-to-paste title/body.
- The app **can't run locally without Tailscale** (Kestrel binds the Tailscale host cert). `dotnet build` / `dotnet ef` / `dotnet test` work without it.

## Deep references (machine-local, did NOT travel with git)

- Memory: `~/.claude/projects/.../memory/create-post-overhaul.md` and `hobbyist-working-style.md`.
- Plan: `~/.claude/plans/the-create-post-logic-groovy-scroll.md`.
