# SiteProof

SiteProof is a cross-platform React Native and Expo mobile application targeting iOS and Android. It demonstrates an offline-first field inspection workflow built with real native mobile capabilities and clearly labeled local simulations.

---

## Why This Project Exists

Most mobile portfolio applications are simple CRUD wrappers around REST APIs that collapse when the network drops. SiteProof demonstrates real-world mobile engineering for mission-critical field operations:

- **Local-first durability:** All inspection tasks, checklist progress, photo evidence metadata, and location checks are stored locally in SQLite (`expo-sqlite`) before any networking is attempted.
- **Real device capabilities:** Physical camera capture (`expo-camera`), persistent local document storage (`expo-file-system`), foreground GPS verification (`expo-location`), Haversine distance calculation, haptics (`expo-haptics`), PDF report rendering (`expo-print`), and native share sheet integration (`expo-sharing`).
- **Lifecycle & connectivity awareness:** Outbox mutations are processed only when the device is online (`@react-native-community/netinfo`) and active (`AppState`), with exponential backoff retries and local notifications (`expo-notifications`).

---

## Technical Highlights

- **Expo SDK 54 & Expo Router 6:** File-based typed routing (`src/app/`) running in the App Store Expo Go binary on physical iOS hardware.
- **Strict TypeScript & Schema Validation:** Zod schemas for all domain entities, zero `any` types, zero unsafe casts, and zero rule disables.
- **Durable SQLite Outbox & Conflict Engine:** Database migration v1-v3 with transaction-safe mutation enqueuing, checklist mutation coalescing, deterministic conflict injection, and side-by-side conflict resolution UI.
- **HTML & PDF Inspection Reports:** Safe HTML escaping utility, truthful location evaluation (`evaluateLocationVerification`), report rendering via `expo-print`, and native OS share sheet via `expo-sharing`.
- **Restrained Motion & Accessibility:** Motion primitives (`FadeInView`, `PulseDot`) built on React Native `Animated`, fully respecting system Reduce Motion settings (`AccessibilityInfo`).

---

## Capability Matrix: Real vs Simulated

| Capability / Layer | Reality Level | Implementation Details |
| :--- | :--- | :--- |
| **SQLite Persistence** | **REAL** | Versioned SQLite database (`siteproof.db`, migrations v1-v3) with WAL journal mode. |
| **Camera Evidence Capture** | **REAL** | Physical rear camera capture (`CameraView`), preview, retake, and persistent storage in `Paths.document`. |
| **Foreground GPS Verification** | **REAL** | Foreground location fix comparing device coordinates with task target coordinates using Haversine distance. |
| **Durable Outbox Queue** | **REAL** | Transactional `sync_queue` table storing pending, failed, and synced local mutations. |
| **Connectivity Monitoring** | **REAL** | Live network status observation via `@react-native-community/netinfo` (`online`, `offline`, `unknown`). |
| **AppState Lifecycle Sync** | **REAL** | Sync attempts triggered automatically when app transitions to `active` state or recovers connectivity. |
| **PDF Report Generation** | **REAL** | Local HTML template rendering to PDF file in app cache via `expo-print`. |
| **Native File Sharing** | **REAL** | Native OS share sheet invoked via `expo-sharing` with PDF MIME type and Apple UTI. |
| **Local Notifications** | **REAL** | 10-second background sync reminder scheduled via `expo-notifications` with typed route interaction. |
| **Simulated Server & Versioning** | **SIMULATED** | Local SQLite table `simulated_remote_checklist` simulating server state and conflict version numbers. |
| **Server Conflicts & Errors** | **SIMULATED** | Deterministic version mismatch detection and failure simulation flag (`fail_next_request`). |
| **Remote Backend / Cloud Upload** | **NOT IMPLEMENTED** | No remote server, cloud storage, authentication, push notifications, or multi-device sync exists. |

---

## System Architecture

```
src/
├── app/                      # Expo Router routes (file-based typed navigation)
│   ├── _layout.tsx           # Root layout provider, lifecycle listeners, connectivity transition sync
│   ├── index.tsx             # Assigned tasks list route
│   ├── tasks/
│   │   ├── [taskId].tsx      # Task detail, checklist, evidence, location & report route
│   │   └── [taskId]/
│   │       └── camera.tsx    # Native camera capture route
│   └── sync/
│       ├── index.tsx         # Sync Center route
│       └── conflicts/
│           └── [conflictId].tsx # Conflict resolution route
├── db/                       # SQLite Provider, schema migrations (v1-v3), seed data
├── features/
│   ├── evidence/             # CameraView capture, thumbnail preview, document storage service
│   ├── location/             # Foreground GPS acquisition, Haversine formula, accuracy evaluation rule
│   ├── motion/               # FadeInView, PulseDot, useReduceMotion hook
│   ├── reports/              # HTML escape utility, expo-print PDF generator, expo-sharing service
│   ├── sync/                 # Outbox processor, NetInfo connectivity, retry policy, simulated server
│   └── tasks/                # SQLite TaskRepository, checklist state, task badges & cards
└── theme/                    # Color tokens (light/dark appearance), spacing, radii, typography
```

---

## Offline & Outbox Lifecycle

1. **Local-First Mutations:** When a field inspector checks an item, captures photo evidence, or runs location verification, the change is written immediately to `siteproof.db` and enqueued in `sync_queue` within the same SQLite transaction.
2. **Connectivity & Lifecycle Check:** The `syncProcessor` inspects device connectivity (`NetInfo`). If status is `offline` or `unknown`, queue processing is skipped immediately.
3. **Queue Processing & Coalescing:** When status is `online`, pending mutations are processed sequentially against the simulated server. Consecutive unsent toggles of the same checklist item are coalesced into a single outbox item.
4. **Retry & Conflict Resolution:** Failed items use exponential backoff retries (2s, 5s, 15s, 60s max). Version mismatches generate a conflict record (`sync_conflicts`), presenting a side-by-side resolution UI (`/sync/conflicts/[conflictId]`).

---

## PDF Report Generation & Native Sharing

Inspectors can export an inspection PDF report directly from the Task Detail route:

1. **Generate Report Action:** Tapping **Generate & Share Report** builds an HTML report containing task metadata, due date, checklist completion stats, location verification coordinates, distance, device accuracy, and photo evidence counts.
2. **HTML Escaping:** All user-derived text is sanitized through `escapeHtml()` to prevent injection.
3. **Truthful Location Status:** Evaluates location checks via `evaluateLocationVerification()` rendering *Verified On-Site*, *Outside Verification Area*, or *Accuracy Insufficient*.
4. **PDF Compilation:** `Print.printToFileAsync({ html })` compiles the report into an application cache PDF document (`.pdf`).
5. **Native Share Sheet:** `Sharing.shareAsync(pdfUri)` opens the native share sheet with `application/pdf` MIME type and `com.adobe.pdf` UTI. Success haptic (`triggerSuccessHaptic`) is emitted only when native sharing completes.

---

## Device & Platform Verification Matrix

### Confirmed on Physical iPhone 16 (App Store Expo Go, SDK 54)
- SQLite checklist draft persistence across full operating-system process relaunch;
- Real camera photo capture, preview, retake, and document file persistence under `Paths.document`;
- Real foreground location acquisition and Haversine distance evaluation in dark appearance;
- Offline queueing observation;
- Local 10-second OS notification reminder delivery.

### Implemented & Automated-Tested (Pending Explicit Physical Confirmation)
- Automatic connectivity recovery sync (`offline` -> `online` transition listener);
- Native `AppState` active lifecycle sync trigger;
- Exponential backoff retry policy;
- Side-by-side conflict resolution UI;
- Expo Go deep-link handoff (`expo-linking`);
- Notification tap navigation routing;
- PDF report generation on physical iPhone;
- Native share sheet invocation on physical iPhone.

### Android Platform Status
- Non-interactive Android JavaScript bundle export passes cleanly in CI (`pnpm export:android`);
- Physical Android native hardware behavior has not been validated.

---

## Local Setup & Quick Start

### Prerequisites
- Node.js `22.13.0` - `22.23.2`
- pnpm `10.30.0` (`corepack enable`)

### Installation & Run

```sh
pnpm install
pnpm start
```

`pnpm start` launches Metro in Expo Go mode (`expo start --go`). Scan the displayed QR code with the Expo Go app on your physical iPhone.

---

## Quality Commands

- `pnpm lint` — ESLint with Expo flat config and zero warnings allowed
- `pnpm typecheck` — Strict TypeScript verification (`tsc --noEmit`)
- `pnpm test:run` — Run all 14 Jest test suites (50 deterministic tests)
- `pnpm run doctor` — Expo project health check (18/18 checks passed)
- `pnpm export:android` — Non-interactive Android JS bundle export validation
- `pnpm check` — Complete local quality verification sequence

---

## Screenshots & Repository Enhancement

Application UI renders dynamically on hardware and in development mode. Real screenshots may be added as an optional manual portfolio enhancement without blocking technical completion.

---

## Known Limitations & Non-Goals

- **No Remote Backend:** The server, versioning, and remote errors are local SQLite simulations.
- **No Cloud Photo Uploads:** Evidence photos are stored locally on the physical device.
- **No Background Execution:** Synchronization is performed strictly while the application is active.

---

## License

SiteProof is released under the [MIT License](LICENSE).
