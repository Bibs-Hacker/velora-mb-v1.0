# Project TODO

## Completed baseline

- [x] Define shared Velora architecture, domain vocabulary, contracts, and security boundaries.
- [x] Extend and migrate the relational model for users, linked accounts, profiles, posts, media, interactions, follows, stories, conversations, messages, notifications, settings, reports, moderation, rate limits, jobs, and search history.
- [x] Implement OAuth-backed authentication, account/profile onboarding, active linked-account selection, device-session visibility/revocation, validation, authorization, and rate limiting.
- [x] Implement object-storage media references and validated image/video upload handling without database blobs.
- [x] Implement feed, post composition, captions, locations, hashtags, mentions, likes, comments, saves, shares, follow/unfollow, profiles, stories, conversations, discovery, notifications, settings, and moderation foundations.
- [x] Implement story expiry callback and protected platform-job binding.
- [x] Implement the Velora visual system, responsive layouts, loading/empty/error states, and accessible semantic controls.
- [x] Implement protected administrator statistics, account management, report queue, content review, and moderation history.
- [x] Add baseline web/native documentation, automated server/client tests, and Expo companion source under `native/`.
- [x] Run baseline web type checks/tests, mobile type checks, and Expo web export.
- [x] Save baseline checkpoint `e28b8524`.

## Enhancement request — 2026-08-30

- [x] Add durable message delivery/read receipts and genuine live-ready typing/presence state with bounded polling fallback.
- [x] Add private archived-story records and owner-only archive browsing after public expiry.
- [x] Add aggregate analytics for daily/weekly/monthly registrations, optional gender breakdown with privacy thresholds, active users, and progression graphs.
- [x] Add rich profile editing: secure profile/cover media, crop/position/rotation metadata, email, username, and private date of birth.
- [x] Enforce standard-user registration by default and add explicit protected admin role governance with configurable verified bootstrap allowlists, never a username-only or client-side backdoor.
- [x] Add server-owned verification badge eligibility/review state without fabricating qualifications, ratings, or testimonials.
- [x] Add advanced account, privacy, security, notification, appearance, chat, data, and accessibility settings.
- [x] Add real user feedback/rating submissions and bug reports routed to administrator queues without seeding fake records.
- [x] Add server-enforced block, mute, report, review, suspension-duration, and ban workflows, including blocked message suppression and muted notification suppression.
- [x] Add message reply/reaction swipe alternatives, image/video/document attachments, polls, voice/video-note metadata flows, per-chat themes, SVG decorations, and user-selected chat backgrounds.
- [x] Add accurate unread badges for chats, notifications, reports, and other pending actions.
- [x] Add branded web/native launch icon and startup treatment.
- [x] Add enhancement migrations, service/client tests, responsive route checks, security regression coverage, and updated documentation.
- [x] Save and deliver the final enhancement checkpoint.

## Security and integrity decisions

- [x] Do not grant administration to every registrant or expose administrator checks only in the client.
- [x] Do not embed user-provided email addresses/usernames as an unreviewable source-code backdoor; any bootstrap allowlist must be protected deployment configuration plus verified server-side role assignment.
- [x] Keep password registration, recovery, and primary identity sessions delegated to the configured identity provider unless a separately audited credential service is approved.
- [x] Keep user feedback, ratings, testimonials, analytics events, posts, messages, and registrations real; never seed synthetic activity to populate dashboards.
- [x] Keep all binary media in object storage with metadata-only relational references.
- [x] Keep date of birth, demographic fields, archives, admin data, and conversation evidence private by default with least-privilege access.
- [x] Make block/mute/archive/moderation behavior server-enforced and reversible where appropriate.
- [x] Treat realtime typing/presence as dependent on a shared persistent transport; do not claim live behavior from static copy alone.

## Enhancement acceptance

- [x] Review schema changes and apply additive migrations safely.
- [x] Verify every new server mutation has validation, authorization, rate-limit, error-path, and privacy tests.
- [x] Verify graphs use truthful aggregate data, explicit time windows, and honest empty states.
- [x] Verify profile crop/editor controls preserve image readability and metadata-only storage.
- [x] Verify chat themes preserve contrast and do not collide with typography.
- [x] Verify responsive web routes at desktop/tablet/mobile widths and check horizontal overflow.
- [x] Verify keyboard/touch/screen-reader access for new crop, graph, chat, settings, moderation, and feedback controls.
- [x] Verify native build configuration contains no server secrets and document device/simulator-only checks.
- [x] Update README, architecture, native handoff, changelog, and release notes.
- [x] Read this file before the enhancement checkpoint and ensure statuses match persisted code.

## Deferred deployment/device configuration

- [x] Document protected admin bootstrap configuration through secure project settings; owner may configure values if direct bootstrap is desired.
- [x] Document the published Velora URL and schedule binding required for story archive cleanup.
- [x] Document the persistent realtime hosting/transport decision required before enabling production live typing and presence.
- [x] Document real iOS/Android device or simulator permission validation as a release handoff step.
- [x] Auto-publish behavior and final checkpoint review are documented for release handoff.

## History

- [x] Preserve this ledger and append dated clarifications; do not delete baseline or enhancement history.
- [x] Keep future native direct-screen migration, push notifications, transcoding, exports, retention controls, and end-to-end fixtures as roadmap work unless explicitly implemented.

## Current status

- [x] Enhancement implementation complete for the release candidate.
- [x] Final enhancement verification complete for web and native checks.
- [x] Final enhancement checkpoint saved.
- [x] Final enhancement delivery prepared.

## Owner-facing note

- [x] Dev-Brian’s requested identity is not granted administrator privileges by request alone; administrator access remains explicit, auditable, verified, and server-controlled.
- [x] Publication and any protected configuration changes remain owner-controlled.
