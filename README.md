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

Phase 2 implements native inspection evidence:

- contextual pre-permission dialogs before requesting camera or foreground location access;
- full-screen rear camera capture (`CameraView`), picture preview, retake, and acceptance flow;
- persistent local photo file storage under `Paths.document` (`SiteProof/evidence/`) using SDK 54 `expo-file-system`;
- database migration version 2 adding `task_evidence` and `task_location_checks` SQLite tables;
- pure TypeScript Haversine distance calculation and location verification accuracy rules;
- foreground location acquisition (`expo-location`) comparing device coordinates to task target sites; and
- feedback haptics (`expo-haptics`) for photo acceptance and location evaluation results.

Phase 3 implements lifecycle-aware offline synchronization:

- durable outbox queue (`sync_queue`) created in database migration version 3;
- local-first mutation enqueuing (checklist updates, evidence metadata, location checks) within the same SQLite transaction;
- checklist mutation coalescing (repeated unsent toggles update the existing pending queue item while preserving base version);
- real device connectivity observation via `@react-native-community/netinfo`;
- native `AppState` active lifecycle triggers invoking synchronization attempts on foreground resume;
- deterministic local Simulated Server engine (`simulated_remote_checklist`) version matching;
- reproducible conflict injection ("Inject remote checklist change") and failure simulation ("Fail next request");
- pure exponential backoff retry policy (2s, 5s, 15s, 60s max) with recorded attempt counts and error messages;
- Sync Center UI route (`/sync`) displaying real network status, queue counts, manual sync, and simulation controls;
- Conflict Resolution route (`/sync/conflicts/[conflictId]`) allowing users to inspect version mismatches side-by-side and choose "Keep local" vs "Use simulated server";
- local OS notification reminders (`expo-notifications`) scheduled for 10 seconds, with typed response routing back to Sync Center; and
- Expo Go deep-link demonstration generating current session `exp://` links via `expo-linking`.

Note: All evidence photo files remain local to the device; no remote file upload service exists. The server and remote versions are explicit local SQLite simulations.

The current baseline uses Expo SDK 54.0.36, React Native 0.81.5, React 19.1.0, TypeScript 5.9.3, Node.js 22 (`>=22.13 <23`), and pnpm 10.30.0. SDK 54 is a deliberate Expo Go compatibility choice for physical-device portfolio validation; it is not presented as technically superior to SDK 57. Continuous Native Generation is used, so generated `android/` and `ios/` projects are not committed.

## Truthfulness & System Architecture Matrix

| Capability / Layer | Reality Level | Implementation Details |
| :--- | :--- | :--- |
| **Local Database & Storage** | **REAL** | Versioned SQLite database (`siteproof.db`, migration v1-v3) with WAL journal mode. Persistent photo storage under `Paths.document`. |
| **Outbox Queue Persistence** | **REAL** | Durable `sync_queue` table in SQLite. Local edits write to local tables and enqueue outbox mutations in the same transaction. |
| **Device Connectivity** | **REAL** | Native device network monitoring via `@react-native-community/netinfo` observing `online` / `offline` / `unknown` states. |
| **AppState Lifecycle** | **REAL** | Native React Native `AppState` listener triggering sync attempts when application transitions to `active`. |
| **Local Notifications** | **REAL** | Local OS notifications scheduled via `expo-notifications` with response listener routing back to Sync Center. |
| **Deep Link Routing** | **REAL (Expo Go)** | Session-specific `exp://` deep links generated via `expo-linking` for Expo Go. In standalone builds, configured `siteproof://` scheme provides stable app links. |
| **Simulated Server** | **SIMULATED** | Local SQLite table `simulated_remote_checklist` simulating remote server state and version numbers. |
| **Server Conflicts & Errors** | **SIMULATED** | Deterministic version mismatch detection and failure flag (`fail_next_request`) for demonstrating offline retries and conflict resolution. |
| **Photo Upload** | **LOCAL ONLY** | No image bytes are uploaded to any server. Queue payloads carry local evidence metadata only. |

## Physical device verification

The Phase 2 native evidence workflow has been physically exercised and verified on hardware:

- **Target hardware:** iPhone 16
- **Runtime:** App Store Expo Go (Expo SDK 54)
- **Appearance:** Dark mode

### Confirmed on physical iPhone
- SQLite checklist draft updates persisted across full application relaunch;
- Camera photo evidence capture, preview, retake, and acceptance functioned in live Expo Go;
- Accepted evidence photo persisted locally in document storage (`Paths.document`) and reloaded after relaunch;
- Foreground location fix was acquired on device and recorded to SQLite;
- Haversine distance, GPS accuracy, and verification radius rendered properly in dark appearance;
- Location evaluation correctly identified an out-of-range position (e.g. 350.86 km from synthetic target coordinate, ±12 m device accuracy, 75 m required radius -> evaluated as *Outside inspection area*); and
- Task target coordinates are synthetic test fixtures; physical location values are verified without exposing sensitive device coordinates.

### Phase 3 capabilities pending physical user validation
- Offline queueing during airplane mode, connection recovery auto-sync, AppState resume sync trigger, retry backoff on simulated failure, conflict injection & resolution UI ("Keep local" vs "Use simulated server"), local 10-second OS notification reminder, and Expo Go deep-link navigation are fully covered by automated unit tests and ready for physical device checkpoint validation.

## Offline architecture

`SQLiteProvider` initializes `siteproof.db` before application routes render. Migration v1 creates `tasks` and `checklist_items`, migration v2 adds `task_evidence` and `task_location_checks`, and migration v3 adds `sync_queue`, `simulated_remote_checklist`, `sync_conflicts`, and `sync_simulation_flags`.

UI code reads and updates data through `TaskRepository`; checking an item or adding evidence writes state immediately to SQLite and enqueues an outbox mutation.

Automated tests validate fixture integrity, list behavior, typed repository interactions, Haversine calculations, location verification rules, evidence storage, camera route task validation, NetInfo status mapping, retry backoff calculation, outbox coalescing, conflict detection/resolution, notification payload schema, and saved-state reloads.

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

Implemented now: Expo foundation, Expo Go development workflow, typed routing, light/dark UI, automated tests and CI, Phase 1 offline task/checklist domain, Phase 2 native photo evidence & location verification, and Phase 3 durable outbox queue, real NetInfo connectivity observation, AppState lifecycle sync triggers, local Simulated Server engine, conflict resolution UI, local notifications, and deep linking.

Phase 4 reporting and final portfolio showcase polish remain outstanding.

## License

SiteProof is available under the [MIT License](LICENSE).



