# Velora Social

Velora is a polished social-platform foundation with a responsive React web experience and a companion Expo project for iOS and Android. The web application delivers secure OAuth-backed identity, profile management, linked Velora accounts, social publishing, protected media references, activity notifications, temporary stories, private conversation records, discovery, privacy controls, reporting, and a role-protected moderation workspace.

> **Product principle:** Velora deliberately separates durable social data from the interface. The browser and native clients are clients of a structured service layer; they do not own the authoritative state of posts, relationships, messages, media, or safety actions.

## Implemented Platform Areas

| Area | Current implementation |
| --- | --- |
| Identity and accounts | OAuth-backed sign-in, profile creation, multiple linked Velora identities, active-account selection, account preferences, and server-side administrator roles. |
| Publishing | Validated image and video upload endpoint, object-storage references, media metadata, captions, locations, hashtags, mentions, post editing/deletion services, and responsive post creation. |
| Social graph | Persistent likes, comments with authorization checks, saved posts, shares, follow/unfollow behavior, private-account follow requests, follower/following queries, and in-app notifications. |
| Stories | Image/video story records, configured 24-hour expiry, viewer records, viewed state, desktop/mobile story viewer, owner deletion, and an idempotent expiry endpoint. |
| Conversations | Direct conversations, durable messages, owned-media attachments, reply references, deletion by sender, read timestamps, and conversation search UI. |
| Trust and safety | Reports, server-side admin authorization, account suspension/restoration services, post removal services, moderation audit rows, and owner-alert plumbing for priority reports. |
| Design and accessibility | Original Velora identity, theme tokens, keyboard reachable controls, explicit labels for vector controls, loading/empty/error feedback, responsive layouts, light/dark/system appearance, and no emoji-based controls. |

## Technology and Project Layout

The web platform uses React, TypeScript, Tailwind CSS, Express, tRPC, Drizzle ORM, MySQL/TiDB, managed OAuth, and managed object storage. The companion native workspace included at `native/` uses Expo, React Native, TypeScript, and platform vector icons.

| Location | Responsibility |
| --- | --- |
| `client/src/` | Responsive web routes, reusable Velora components, theme behavior, media upload client, and accessible interaction surfaces. |
| `server/routers/` | Modular feature contracts for accounts, profiles, posts, stories, conversations, notifications, discovery, safety, and administration. |
| `server/mediaRoutes.ts` | Authenticated binary upload endpoint with allowlisted type, extension, signature, size, and rate-limit checks. |
| `server/scheduledRoutes.ts` | Cron-authenticated and idempotent expiry handler for temporary stories. |
| `drizzle/schema.ts` | Normalized relational schema and typed entity definitions. |
| `docs/ARCHITECTURE.md` | Service boundaries, data flow, security approach, media pipeline, and realtime strategy. |
| `docs/NATIVE_CLIENT.md` | Native companion contract and secure release-time configuration boundary. |

## Local Development

From the web project directory, install dependencies and run the development server with the commands below. The scaffold injects the managed application and database configuration in the hosted development environment; do not commit an `.env` file containing credentials.

```bash
cd /home/ubuntu/velora-social
pnpm install
pnpm dev
pnpm check
pnpm test
```

The database schema is defined in `drizzle/schema.ts`. For a schema change, generate a migration, review the generated SQL for destructive operations, and apply it through the platform database-management workflow. Do not use ad hoc destructive schema commands.

```bash
pnpm drizzle-kit generate
```

## Media Storage

Velora stores actual file bytes in managed object storage and persists only the generated key, signed-serving path, ownership, scope, name, MIME type, size, and optional descriptive metadata in `media_assets`. The upload endpoint rejects unsupported MIME types, mismatched filenames, invalid byte signatures, and files larger than 50 MB.

The four permitted media scopes are `profile`, `post`, `story`, and `message`. A subsequent social action verifies that the selected media record is owned by the authenticated user and was uploaded for the correct scope before it can be referenced.

## Authentication, Sessions, and Security

Authentication uses the configured OAuth provider and secure session cookies supplied by the application scaffold. Velora does not implement a parallel local password store, does not retain plaintext passwords, and delegates password reset, password changes, and primary identity-session revocation to the configured identity provider. Application-level Velora identities are represented as owned linked accounts and must be selected explicitly before social writes.

All primary mutations use structured validation, server-side active-account ownership checks, constrained database operations, and role checks for administrative functionality. The database schema prevents duplicate likes, follows, saves, conversation memberships, story views, hashtag links, and other relationship rows through composite primary or unique constraints. Rate-sensitive operations use a persistent activity ledger rather than frontend-only timing.

## Story Expiry Scheduling

The application immediately hides an expired story in all read queries using `expiresAt`. The authenticated callback at `/api/scheduled/story-expiry` then removes expired stories and their viewer records in bounded, idempotent batches. The callback validates the platform-issued job identifier against the durable `platform_jobs` record; it does not trust the HTTP request body.

After the site has been checkpointed and published, create the project-level scheduled job using the managed project scheduler. Use a six-field UTC expression, such as an hourly invocation:

```bash
manus-heartbeat create \
  --name velora-story-expiry \
  --cron "0 0 * * * *" \
  --path /api/scheduled/story-expiry \
  --description "Remove expired Velora stories and story-view records"
```

Persist the returned task identifier in `platform_jobs.scheduleCronTaskUid` for the row whose `id` is `story-expiry`. This final binding must only be performed after deployment because scheduled calls target the public service.

## Optional Operational Alerts

Priority reports for violence, hate, or nudity can notify the project owner when the server-side `VELORA_OWNER_ALERTS` configuration is explicitly enabled. In-app notifications remain the channel for end users. The owner-alert channel should be enabled only after the product owner has decided which operational events are actionable and established a response process.

## Native Companion

The companion workspace can be installed and type-checked as follows:

```bash
cd native
pnpm install
pnpm check
pnpm ios
pnpm android
```

Set `EXPO_PUBLIC_VELORA_WEB_URL` to the published Velora web address before a native release build. The initial mobile surface is a branded, safe-area-aware secure handoff into the shared web platform. It deliberately contains no database, storage, or alert credentials. Configure OAuth deep-link return handling before progressively moving authenticated feature views from the web handoff into native screens.

## Verification

The current web project passes `pnpm check` and `pnpm test`. Automated coverage includes session-cookie logout behavior and shared user-content parsing/normalization. The responsive onboarding surface was also checked at desktop and mobile viewport widths.

## Deployment

Save a checkpoint after review, then use the project interface’s **Publish** action to deploy the web platform. The scheduler must be configured only after that deployment succeeds. Production realtime presence and typing indicators require a persistent, shared transport configuration; persistent hosting is appropriate when that always-connected transport is enabled.

## Roadmap

The next production increments are native OAuth deep-link completion and feature-native screens, user-facing session-device management where supported by the identity provider, rich pagination/cursors, dedicated content delivery/transcoding, a persistent realtime transport for presence and typing, moderation evidence workflows, and notification-delivery preferences beyond the in-app center.
