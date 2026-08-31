# Velora release handoff

## Release candidate scope

Velora now includes a responsive authenticated web client and a credential-free Expo companion source workspace. The enhancement release candidate includes durable social interactions, private story archives, analytics with truthful empty states, profile and cover editing with crop metadata, protected administrator workflows, feedback and bug queues, safety controls, rich messaging, chat preferences, and unread-count surfaces.

## Administrator governance

All administrator procedures are enforced on the server through the authenticated user role. The optional bootstrap allowlist is deployment configuration, not client logic and not a username-only backdoor. If direct bootstrap is desired, configure the protected `VELORA_ADMIN_ALLOWLIST` project secret through project settings and keep the value restricted to approved, verified identities. The owner-facing policy remains that requested identity names do not grant access by themselves.

## Story archive cleanup

Expired stories are archived by the protected scheduled callback. Bind the scheduler to the published Velora URL and the scheduler route documented in the server scheduled-route source. The callback must use its protected job credential and should be monitored through the deployment scheduler history. Archive records remain owner-only and media bytes remain in object storage.

## Realtime transport decision

The web client exposes durable typing and presence state with a bounded polling fallback. Before enabling production-grade live presence, choose a persistent realtime transport and hosting mode that supports long-lived connections. Autoscale is suitable for the current request/response release candidate; a persistent always-on mode is the appropriate follow-up when WebSocket or server-sent-event delivery is enabled.

## Native validation

The Expo companion deliberately contains no server secrets and opens the shared authenticated platform through its secure WebView approach. Before an App Store or Play release, validate camera, microphone, media-library, voice-note, and video-note permission prompts on real iOS and Android devices or supported simulators. Also test background/foreground transitions, file upload cancellation, and sign-out/session revocation on each platform.

## Verification performed

The release candidate was checked with the web TypeScript compiler, Vitest suite, production web build, native TypeScript compiler, and Expo web export. Desktop route screenshots were checked for home, messages, feedback, settings, admin, and analytics; mobile full-page screenshots were checked for messages, settings, admin, and analytics. Empty states intentionally display when no real events or submissions exist.

## Owner-controlled next steps

The remaining operational steps are configuration and device validation rather than seeded demo behavior: set any desired protected bootstrap allowlist, bind the story-expiry scheduler to the published URL, decide when to move from bounded polling to persistent realtime hosting, and complete physical-device media permission checks before store submission.
