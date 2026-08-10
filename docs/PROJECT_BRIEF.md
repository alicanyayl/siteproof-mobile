# SiteProof Project Brief

## Project Identity

- **Product name:** SiteProof
- **Repository name:** `siteproof-mobile`
- **Intended GitHub owner:** `alicanyayl`
- **Primary platform:** Cross-platform (iOS and Android)
- **Technology direction:** React Native with Expo and strict TypeScript
- **Product type:** Backendless portfolio demonstration

### Phase 0 technical baseline

The verified foundation targets Expo SDK 54.0.36 with Expo Router 6.0.24, React Native 0.81.5, React 19.1.0, and strict TypeScript 5.9.3. Local and CI tooling use Node.js 22 (`>=22.13 <23`) and pnpm 10.30.0. Expo Go is the primary development runtime, and Continuous Native Generation keeps generated `android/` and `ios/` projects outside version control. SDK 54 is used specifically so the portfolio project can run on a physical iPhone through the current App Store Expo Go binary; this is a runtime compatibility choice, not a claim that SDK 54 is technically superior to SDK 57. Typed routes, native light/dark appearance, deterministic Jest tests, Expo-supported ESLint, Expo Doctor, and Android JavaScript export validation form the Phase 0 quality baseline.

Phase 0 intentionally contained no inspection domain, camera, location, SQLite, notifications, synchronization, conflict, or reporting implementation. Those capabilities remained assigned to later phases.

### Phase 1 implementation baseline

Phase 1 implements the offline task domain with `expo-sqlite` and Zod. A versioned migration creates `tasks` and `checklist_items`; first-run seeding adds 24 deterministic synthetic tasks and 138 checklist items without overwriting an existing database. A typed repository owns database access, while the route layer passes only task IDs. The assigned-task list is virtualized, task detail safely handles missing IDs, and every checklist toggle is written immediately before the UI reloads the saved record.

The Phase 1 automated tests validate fixture integrity and UI behavior through the repository boundary. They do not substitute for real-device proof that SQLite data survives an operating-system process restart; that verification remains an explicit native validation item.

## Portfolio Objective

SiteProof is a focused field-inspection mobile application designed to provide credible, reviewable evidence of practical React Native and Expo engineering. It is a portfolio project, not a commercial field-service platform.

The finished project should demonstrate competent use of native device features, offline-first persistence, lifecycle-aware behavior, deterministic synchronization scenarios, mobile performance practices, and cross-platform mobile validation. Every simulated capability must be clearly identified as a local simulation; the project must never imply that a production backend or remote service exists.

## Product Concept

A field worker enters the app as a local demo user and receives assigned inspection tasks. For each task, the worker can review instructions, complete checklist items, verify the device's current foreground location against the task site, capture photo evidence, add notes, and complete the inspection.

The workflow remains usable without a network connection. Drafts and completed changes are stored in SQLite and represented as queued local mutations. A deterministic local sync simulator demonstrates queued, syncing, failed, retrying, completed, and conflicting states without pretending to communicate with a real backend. A completed inspection can be rendered as a PDF and shared through the operating system's native share sheet.

## Capability Proof Matrix

| Capability | Planned proof in SiteProof | Evidence expected in the finished project |
| --- | --- | --- |
| Camera capture | Capture inspection evidence with the device camera and retain local image files | Real-device capture flow, permission handling, preview, and persisted file reference |
| Foreground location | Read location only during an explicit verification action and compare it with a configured coordinate and radius | Clear in-range/out-of-range result with denied and unavailable states |
| Native permissions | Explain and request camera, foreground location, and notification access contextually | First-request, denied, blocked, and settings-recovery experiences |
| SQLite persistence | Store task fixtures, inspection progress, evidence metadata, and mutation state locally | App relaunch and offline use preserve in-progress work |
| App lifecycle | React when the app returns to the foreground | Refresh relevant permission/connectivity state and attempt eligible active-app synchronization |
| Deep linking | Open a task through a custom-scheme link | Valid, missing, and invalid task targets handled safely |
| Local notifications | Schedule a device-local reminder and route notification interaction to a task | Honest local-only scheduling and navigation behavior |
| File and PDF generation | Produce an inspection report from locally stored data | Readable report containing task, checklist, notes, location result, and evidence references as appropriate |
| Native file sharing | Share the generated report through the operating system | Native share sheet invoked with a generated local file |
| Network-aware retry | Observe connectivity and retry eligible queued work while the app is active | Deterministic online/offline transitions without claims of terminated-app execution |
| Offline mutation queue | Record local changes as explicit queued operations | Visible queued, syncing, failed, retrying, completed, and conflicting states |
| Conflict resolution | Create and resolve a deterministic simulated conflict | UI compares local and simulated remote values and records the selected resolution |
| Performant mobile lists | Render assigned tasks and sync history efficiently | Stable keys, appropriate list virtualization, controlled re-renders, and responsive interaction under a representative fixture load |
| Mobile device behavior | Prioritize cross-platform permission, file, notification, lifecycle, and sharing behavior | Reviewed real-device or suitable development-build results |
| Haptic feedback | Reinforce selected completion and status actions | Purposeful feedback with graceful behavior where unsupported |
| Safe-area and platform behavior | Respect device insets and relevant platform differences | Usable layouts across representative mobile screen sizes |

## Main User Flow

1. Open the app and continue as a local demo user.
2. Review contextual explanations before camera, foreground location, or notification permission requests.
3. Browse assigned inspection tasks.
4. Open a task from the list, a custom-scheme deep link, or a local-notification interaction.
5. Complete checklist items and add notes.
6. Capture and retain photo evidence.
7. Verify the current foreground location against the task's configured coordinate and acceptance radius.
8. Save progress or complete the inspection while offline.
9. Observe the resulting mutation in the sync center.
10. Use deterministic demo controls to produce success, failure, retry, or conflict behavior.
11. Review and resolve a simulated conflict when one is produced.
12. Generate a PDF inspection report and share it through the native share sheet.

## Real vs Simulated Features

### Real device and application capabilities

The implementation is expected to use real device or operating-system APIs for:

- camera access and image-file creation;
- foreground location reads;
- camera, foreground location, and notification permission flows;
- SQLite persistence;
- foreground/background application lifecycle events;
- custom-scheme deep links;
- scheduled local notifications;
- PDF and local file generation;
- native file sharing;
- haptic feedback; and
- safe-area and platform-aware behavior.

### Explicit local simulations

The following are demonstrations driven entirely by local fixtures and deterministic controls:

- authentication server;
- remote REST API;
- remote file upload;
- multi-device synchronization;
- server-side conflicts; and
- remote push notifications.

Product copy, documentation, demo controls, and UI status labels must describe these features as simulated. Local notifications must not be presented as remote push notifications, and local queue processing must not be presented as communication with a production service.

## Planned Screens

- **Permission onboarding:** Context and recovery guidance for camera, foreground location, and notification access.
- **Demo session entry:** A transparent local-demo entry point with no claim of remote authentication.
- **Assigned task list:** Task status, essential site context, and efficient navigation across representative fixture data.
- **Task detail and checklist:** Instructions, checklist progress, notes, evidence summary, location state, report action, and save/complete actions.
- **Camera evidence:** Permission handling, capture, preview, confirmation, and local-file state.
- **Location verification:** Explicit foreground verification with distance/radius feedback and failure states.
- **Sync center:** Mutation state, attempts, deterministic processing controls, retry actions, and conflict entry points.
- **Conflict review:** Local-versus-simulated-remote comparison and an explicit resolution choice.
- **Completed inspection report:** Inspection summary, PDF generation state, and native sharing action.
- **Demo controls and settings:** Deterministic scenario selection, notification scheduling, and clearly labeled simulation controls.

## Data and Offline Model

SQLite is the local source of truth for the demonstration. The planned local model must cover, at minimum:

- assigned task fixtures and their site coordinates and verification radius;
- checklist definitions and saved item state;
- inspection drafts, notes, completion state, and timestamps;
- locally managed photo evidence metadata and file references;
- location-verification results recorded from explicit foreground checks;
- queued mutations, attempt information, status, and deterministic scenario outcome; and
- simulated conflict values and the user's recorded resolution.

Task work must be readable and editable without connectivity. A save or completion action persists the inspection transactionally enough to avoid presenting an updated task without its corresponding queued mutation. Generated media and reports remain local files with intentional ownership and cleanup rules defined in code.

The sync simulator consumes local queue entries and applies predetermined outcomes. It is a teaching and demonstration mechanism, not an HTTP client or hidden backend substitute. Seed fixtures and scenario selection make important states reproducible for development, tests, and portfolio review.

## Lifecycle and Sync Boundaries

Synchronization is permitted only when the application is active and one of these triggers occurs:

- connectivity changes to an eligible state while the app is active;
- the user manually retries or starts processing; or
- the app returns to the foreground.

The app may also refresh relevant permission and connectivity information after a foreground transition. Queue processing is idempotent at the simulator boundary and prevents duplicate concurrent processing of the same mutation.

SiteProof does not promise background location, continuous background synchronization, execution while terminated, or guaranteed delivery. Work safely remains queued until an allowed active-app trigger can process it. Deep links and local-notification interactions tolerate cold-start or resume navigation and fail safely when the referenced task is unavailable.

## Accessibility and Performance Expectations

- Support screen-reader labels, roles, states, and meaningful action names on interactive controls.
- Preserve logical focus and reading order, including permission, error, and conflict dialogs.
- Provide touch targets and spacing suitable for field use and avoid relying on color alone for status.
- Respect dynamic text sizing where practical, safe areas, and representative compact and large mobile layouts.
- Keep checklist, task, sync, and report interactions keyboard-independent and understandable with assistive technology.
- Use accessible status announcements for important asynchronous changes such as capture, verification, queue failure, and report completion.
- Use React Native list virtualization and stable item identity for task and queue lists.
- Avoid unnecessary list-row re-renders and avoid loading full-resolution images where thumbnails are sufficient.
- Keep local database queries bounded and observable under a representative fixture set.
- Review responsiveness, permission flows, notifications, camera, files, sharing, and lifecycle behavior on iOS and Android hardware or development builds.

## Phase Plan

### Phase 0 — Foundation

Establish the Expo project foundation, aligned to Expo SDK 54 for App Store Expo Go compatibility, with Expo Router, strict TypeScript, a basic visual system, CNG configuration, deterministic test setup, GitHub Actions, and repository metadata.

### Phase 1 — Offline task domain

Implemented: task fixtures, validated domain schemas, a repository layer, SQLite persistence, assigned-task list, task detail, and immediately persisted checklist draft progress.

### Phase 2 — Native evidence

Implemented and physically verified on iPhone 16: contextual pre-permission flows, CameraView rear photo capture, preview/retake/accept UI, persistent document photo storage using SDK 54 FileSystem API, migration v2 SQLite tables, Haversine distance calculations, verification rules, and foreground location verification in dark mode. Feedback haptic triggers are implemented in code.

### Phase 3 — Lifecycle and synchronization

Implemented and verified via automated tests: real NetInfo device connectivity monitoring, database migration v3 durable `sync_queue` outbox, outbox mutation coalescing, AppState active lifecycle sync triggers, local Simulated Server engine, conflict injection and failure simulation controls, exponential backoff retry policy, Sync Center UI, Conflict Resolution UI, 10-second local OS notification reminders, and Expo Go deep links. Physical device verification confirmed offline queueing and local notification delivery; other lifecycle/sync triggers remain implemented & automated-tested.

### Phase 4 — Reporting and mobile quality

Implemented and verified: HTML inspection report generator with safe HTML escaping, PDF report creation via SDK 54 `expo-print`, native PDF sharing via SDK 54 `expo-sharing`, restrained native entrance animations and loading motion using React Native `Animated`, accessibility & Reduce Motion support via `AccessibilityInfo.isReduceMotionEnabled()` and `reduceMotionChanged` subscription, and responsive mobile layout hardening. Physical iPhone PDF/share confirmation remains pending user hardware test.

### Phase 5 — Finalization

Implemented and verified: all configured deterministic Jest suites pass (14/14 suites, 50 tests), Expo Doctor 18/18 checks passed, Android JavaScript export validation (`pnpm export:android`), Metro Expo Go startup verification, concise cross-platform portfolio README with truthful Real vs Simulated matrix, architecture documentation, MIT license, GitHub repository metadata, committed, pushed to `origin/main`, and green GitHub Actions CI. Project complete.

## Explicit Non-Goals

The initial project will not include:

- a real backend or remote API;
- a web administration dashboard;
- personnel administration;
- multi-tenancy;
- payments;
- chat;
- AI features;
- background location tracking;
- guaranteed synchronization while the app is terminated;
- route navigation;
- a social layer;
- analytics or telemetry; or
- App Store or Google Play submission.

## Completion Criteria

SiteProof is complete as a portfolio demonstration when:

- the primary flow can be performed on mobile targets, including while offline;
- all capabilities in the proof matrix have reviewable implementation evidence or an explicitly documented limitation;
- task, checklist, notes, evidence metadata, verification results, and mutations survive application relaunch through SQLite;
- camera, foreground location, and notification permission outcomes are handled without trapping the user;
- local image capture, report generation, and native sharing work in the verified build environment;
- deep links and local-notification interactions open valid tasks and safely handle invalid targets;
- the deterministic simulator can reproduce success, failure, retry, and conflict states, and a conflict can be resolved through the UI;
- synchronization stays within the documented active-app lifecycle boundaries;
- representative task and queue fixture loads remain responsive;
- core flows receive an accessibility review and material findings are addressed or documented;
- automated checks appropriate to the project pass locally and in GitHub Actions;
- build verification supports the portfolio claims;
- the README and architecture documentation accurately distinguish real device behavior from local simulation; and
- the repository is committed, pushed to `origin/main`, and clean at final verification.

## Risks and Scope Controls

| Risk | Scope control |
| --- | --- |
| The simulator could be mistaken for a real backend | Label simulated authentication, API, uploads, synchronization, conflicts, and push behavior in UI and documentation |
| Native behavior may differ in Expo Go, development builds, emulators, and hardware | Identify build constraints early and verify portfolio claims on an appropriate development build or real device |
| Permission denial can block the demonstration | Provide contextual requests, denial states, settings guidance, and graceful alternatives where the flow permits |
| Local files may become orphaned or unavailable | Define file ownership, persistence, validation, and cleanup when native evidence is implemented |
| Queue or lifecycle races may duplicate work | Serialize eligible processing, persist attempts and states, and make deterministic operations idempotent |
| Offline scope may expand into production synchronization | Keep all outcomes fixture-driven and exclude real networking, accounts, uploads, and multi-device guarantees |
| Conflict UI may imply server authority | Use explicitly simulated remote values and explain how the deterministic scenario was produced |
| Feature breadth may weaken portfolio quality | Deliver phase gates in order, prioritize the main flow, and defer non-goals |
| Large images or lists may harm mobile responsiveness | Use thumbnails and bounded image work, virtualized lists, representative load fixtures, and performance review |
| Sensitive or misleading data could enter fixtures or reports | Use synthetic inspection data only and keep generated artifacts free of real personal or customer information |
