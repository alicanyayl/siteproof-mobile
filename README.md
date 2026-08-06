# SiteProof

SiteProof is an Android-first Expo portfolio app for demonstrating a credible offline field-inspection workflow with real mobile platform capabilities and clearly labeled local simulations.

## Current foundation

Phase 0 provides a polished native landing screen, Expo Router, strict TypeScript, light and dark themes, safe-area-aware responsive layout, a development-client configuration, deterministic tests, Expo-supported linting, Android JavaScript export validation, and GitHub Actions CI.

The current baseline is Expo SDK 57, React Native 0.86, React 19, Node.js 22 (`>=22.13 <23`), and pnpm 10. Continuous Native Generation is used, so generated `android/` and `ios/` projects are not committed.

## Local setup

```sh
corepack enable
corepack prepare pnpm@10.30.0 --activate
pnpm install
pnpm start
```

`pnpm start` targets an Expo development build. A compatible development client must be built and installed separately before native-device use.

## Commands

- `pnpm lint` — run ESLint with Expo's flat configuration and zero warnings allowed
- `pnpm typecheck` — run strict TypeScript checks
- `pnpm test` — run Jest in watch mode
- `pnpm test:run` — run deterministic Jest tests once
- `pnpm run doctor` — validate Expo project health
- `pnpm export:android` — validate a non-interactive Android JavaScript export
- `pnpm check` — run the complete deterministic local check sequence

## Capability status

Implemented now: the Expo/React Native foundation, typed routing, accessible foundation UI, responsive light/dark styling, development-build configuration, automated tests, and CI configuration.

Not yet implemented: the inspection domain, camera, location, permissions, SQLite, notifications, lifecycle synchronization, mutation queues, conflicts, PDF generation, native sharing, EAS cloud builds, and real-device verification. Remote services will remain explicit local simulations where the [project brief](docs/PROJECT_BRIEF.md) requires them.

## License

SiteProof is available under the [MIT License](LICENSE).
