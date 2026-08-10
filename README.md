# SiteProof

SiteProof is an Android-first Expo portfolio app that demonstrates a credible offline field-inspection workflow with real mobile platform capabilities and clearly labeled local simulations.

## Current implementation

Phase 0 established the Expo foundation: Expo Router, strict TypeScript, light and dark themes, safe-area-aware responsive layouts, deterministic tests, Android JavaScript export validation, and GitHub Actions CI. The foundation is now aligned to Expo SDK 54 so it can run in the current App Store Expo Go binary on a physical iPhone.

Phase 1 adds the offline task domain:

- 24 deterministic, synthetic inspection tasks with 138 checklist items;
- Zod-validated task and checklist schemas;
- versioned SQLite migrations and idempotent first-run seeding;
- a typed repository boundary that keeps SQL out of route components;
- a virtualized assigned-task list with loading, empty, and error states;
- typed task-detail navigation with safe unknown-ID handling; and
- immediately persisted checklist drafts that remain the local source of truth.

Phase 2 implements native inspection evidence (IMPLEMENTED IN CODE):

- contextual pre-permission dialogs before requesting camera or foreground location access;
- full-screen rear camera capture (`CameraView`), picture preview, retake, and acceptance flow;
- persistent local photo file storage under `Paths.document` (`SiteProof/evidence/`) using SDK 54 `expo-file-system`;
- database migration version 2 adding `task_evidence` and `task_location_checks` SQLite tables;
- pure TypeScript Haversine distance calculation and location verification accuracy rules;
- foreground location acquisition (`expo-location`) comparing device coordinates to task target sites; and
- feedback haptics (`expo-haptics`) for photo acceptance and location evaluation results.

Note: All evidence photos remain local to the Expo Go project/device environment; no remote upload service exists. Physical behavior on iPhone remains subject to physical user confirmation (PHYSICALLY VERIFIED ON IPHONE).

The current baseline uses Expo SDK 54.0.36, React Native 0.81.5, React 19.1.0, TypeScript 5.9.3, Node.js 22 (`>=22.13 <23`), and pnpm 10.30.0. SDK 54 is a deliberate Expo Go compatibility choice for physical-device portfolio validation; it is not presented as technically superior to SDK 57. Continuous Native Generation is used, so generated `android/` and `ios/` projects are not committed.

## Offline architecture

`SQLiteProvider` initializes `siteproof.db` before application routes render. Migration version 1 creates `tasks` and `checklist_items`, while migration version 2 adds `task_evidence` and `task_location_checks`. UI code reads and updates data through `TaskRepository`; route parameters carry only a task ID. Checking an item or adding evidence writes state immediately to SQLite.

Automated tests validate fixture integrity, list behavior, typed repository interactions, Haversine calculations, location verification rules, evidence filename generation, checklist accessibility state, and saved-state reloads.

## Local setup

```sh
corepack enable
corepack prepare pnpm@10.30.0 --activate
pnpm install
pnpm start
```

`pnpm start` starts the project in Expo Go mode. Scan the displayed QR code with the current App Store Expo Go app to open SiteProof on a physical iPhone. This development workflow does not require an Apple Developer account, EAS login, an IPA, or a custom development client.

## Commands

- `pnpm lint` - run ESLint with Expo's flat configuration and zero warnings allowed
- `pnpm typecheck` - run strict TypeScript checks
- `pnpm test` - run Jest in watch mode
- `pnpm test:run` - run deterministic Jest tests once
- `pnpm run doctor` - validate Expo project health
- `pnpm export:android` - validate a non-interactive Android JavaScript export
- `pnpm check` - run the complete deterministic local check sequence

## Capability status

Implemented now: the Expo/React Native foundation, Expo Go development workflow, typed routing, accessible and responsive light/dark UI, automated tests and CI, Phase 1 local task/checklist domain backed by SQLite, and Phase 2 native photo evidence, persistent file storage, foreground location verification, Haversine distance, and haptic feedback.

Phase 3 lifecycle synchronization (connectivity state, mutation queue, retry policy, simulated conflicts, local notifications) and Phase 4 reporting remain outstanding. Remote services will remain explicit local simulations where the [project brief](docs/PROJECT_BRIEF.md) requires them.

## License

SiteProof is available under the [MIT License](LICENSE).

