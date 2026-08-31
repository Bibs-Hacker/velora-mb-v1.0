# Velora Native Client Handoff

The companion workspace is named **Velora Mobile**. Its release-time API configuration is completed after the Velora web service is published, while mobile source code remains free of service credentials. The visual system remains aligned with Velora’s warm neutral and luminous indigo identity, with SVG-equivalent vector iconography throughout and safe-area-aware navigation on both mobile operating systems. It uses the same durable server contracts as the web experience, making feature behavior consistent across platforms and keeping social data in one shared platform.

The Velora mobile app is maintained as a companion Expo project so it can produce iOS and Android binaries while preserving the product’s shared language and service contracts. The responsive web application remains the canonical backend host in this build; the native app consumes its secure HTTPS APIs and inherits the same account, post, story, conversation, notification, discovery, settings, and moderation boundaries.

## Mobile Product Surface

| Native area | Backed by the Velora platform |
| --- | --- |
| Home | Posts, stories, likes, comments, saves, and shares |
| Explore | User, post, and hashtag discovery |
| Create | Validated image/video upload and post publication |
| Inbox | Durable conversations, attachments, and read state |
| Profile | Identity, privacy, connections, and content gallery |
| Settings | Appearance and notification preferences |

The mobile client must receive its API base URL through an environment-backed application configuration during release preparation. It must not embed database credentials, owner-alert settings, or storage credentials.

## Implementation Checklist

The native build will provide a branded launch experience, bottom navigation, empty states, profile and account views, a discovery journey, conversation interfaces, and a publish flow. Server-mutating actions will use the corresponding Velora procedure rather than device-only placeholder state.
