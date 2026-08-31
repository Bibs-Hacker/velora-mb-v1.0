# Velora Mobile

Velora Mobile is the native iOS and Android companion workspace for the Velora web platform. It provides a branded, safe-area-aware product shell and opens the web platform to complete secure OAuth-based sign-in. The mobile source contains no database, storage, or owner-notification credentials.

## Configuration

Set `EXPO_PUBLIC_VELORA_WEB_URL` to the published HTTPS address for the Velora web service before running a release build. The setting supplies only the public platform location; credentials remain server-side.

## Commands

Install with `pnpm install`. Run `pnpm dev` to start Expo, then use `pnpm ios`, `pnpm android`, or `pnpm web` as appropriate. Run `pnpm check` for TypeScript validation.

## Expansion Path

Set `EXPO_PUBLIC_VELORA_WEB_URL` to load the full shared authenticated Velora platform inside the native safe-area-aware WebView shell. Native tabs now provide dedicated Home, Explore, Inbox, and Profile entry points, each targeting the matching shared Velora route. This preserves feature parity for feeds, profile editing, post composition, stories, conversations, notifications, discovery, and moderation controls while the native workspace keeps all secrets out of the binary.
