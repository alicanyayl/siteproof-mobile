# SiteProof

SiteProof is an Android-first Expo portfolio app that demonstrates a credible offline field-inspection workflow with real mobile platform capabilities and clearly labeled local simulations.

## Current implementation

Phase 0 established the Expo SDK 57 foundation: Expo Router, strict TypeScript, light and dark themes, safe-area-aware responsive layouts, a development-client configuration, deterministic tests, Android JavaScript export validation, and GitHub Actions CI.

Phase 1 adds the offline task domain:

- 24 deterministic, synthetic inspection tasks with 138 checklist items;
- Zod-validated task and checklist schemas;
- versioned SQLite migrations and idempotent first-run seeding;
- a typed repository boundary that keeps SQL out of route components;
- a virtualized assigned-task list with loading, empty, and error states;
- typed task-detail navigation with safe unknown-ID handling; and
- immediately persisted checklist drafts that remain the local source of truth.

The current baseline uses Expo SDK 57, React Native 0.86, React 19, Node.js 22 (`>=22.13 <23`), and pnpm 10. Continuous Native Generation is used, so generated `android/` and `ios/` projects are not committed.

## Offline architecture

`SQLiteProvider` initializes `siteproof.db` before application routes render. Migration version 1 creates `tasks` and `checklist_items`, enables foreign keys and WAL mode, and seeds fixtures only when the task table is empty. UI code reads and updates data through `TaskRepository`; route parameters carry only a task ID. Checking an item writes its new state immediately and promotes an assigned task to in-progress in the same transaction.

Automated tests validate fixture integrity, list behavior, typed repository interactions, checklist accessibility state, saved-state reloads, and unknown task IDs. Native persistence across a process restart still requires development-build or device verification and is not claimed by the Jest suite.

## Local setup

```sh
corepack enable
corepack prepare pnpm@10.30.0 --activate
pnpm install
pnpm start
```

`pnpm start` targets an Expo development build. A compatible development client must be built and installed separately before native-device use.

## Commands

- `pnpm lint` - run ESLint with Expo's flat configuration and zero warnings allowed
- `pnpm typecheck` - run strict TypeScript checks
- `pnpm test` - run Jest in watch mode
- `pnpm test:run` - run deterministic Jest tests once
- `pnpm run doctor` - validate Expo project health
- `pnpm export:android` - validate a non-interactive Android JavaScript export
- `pnpm check` - run the complete deterministic local check sequence

## Capability status

Implemented now: the Expo/React Native foundation, typed routing, accessible and responsive light/dark UI, development-build configuration, automated tests and CI, plus the local task/checklist domain backed by SQLite.

Not yet implemented: camera, location, permissions, notifications, lifecycle synchronization, mutation queues, conflicts, PDF generation, native sharing, EAS cloud builds, and real-device verification. Remote services will remain explicit local simulations where the [project brief](docs/PROJECT_BRIEF.md) requires them.

## License

SiteProof is available under the [MIT License](LICENSE).
