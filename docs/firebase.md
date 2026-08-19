# Firebase foundation (Drivoo)

Firebase is used for realtime messaging, web push (FCM), and future presence — not as the source of truth for users, agencies, cars, bookings, payments, or subscriptions. Those remain in MongoDB.

```text
Frontend (Vite + React)
  ├── Firebase Client SDK
  │     ├── App
  │     ├── Firestore (initialized, no client writes in phase 1)
  │     └── Cloud Messaging
  └── Drivoo API (JWT cookies)
        └── Backend (Express)
              └── Firebase Admin SDK
```

## Authentication (do not replace Drivoo auth)

Drivoo already authenticates with JWT in HttpOnly cookies (`frontend` / `admin` / `agency`) plus `x-access-token` for mobile/tests.

**Do not migrate login to Firebase Authentication.**

Firestore security rules cannot see Drivoo JWTs. For phase 1:

* Firestore rules deny all client access (`allow read, write: if false`).
* The backend Admin SDK bypasses rules and is the only writer.
* This is the safest fit until chat needs live listeners.

When chat needs client listeners, the recommended next step is **Firebase Custom Tokens**:

1. User signs in with the existing Drivoo login.
2. Backend verifies the Drivoo JWT, then calls `admin.auth().createCustomToken(userId)`.
3. Frontend calls `signInWithCustomToken` **only** to satisfy Firestore rules.
4. Login UI, passwords, and sessions stay on Drivoo.

| Option | Pros | Cons |
| --- | --- | --- |
| Custom tokens | Realtime client listeners, standard FCM+Firestore security | Extra sign-in to Firebase after Drivoo auth |
| Backend-only Firestore | Simplest security, no Firebase Auth | No client realtime; all chat goes through API |
| Replace Drivoo auth | — | Rejected: would break cookies, roles, mobile Expo, and existing users |

**Recommendation:** keep backend-only Firestore for this foundation; add Custom Tokens in the chat phase if you want live subscriptions.

## Environments

Use **separate Firebase projects** for development, staging, and production (`drivoo-dev`, `drivoo-staging`, `drivoo-prod`). Sharing one project risks sending development notifications to production devices.

This codebase also stores `environment` on each FCM device (`development` | `staging` | `production`) and sends only to matching devices (`BC_FIREBASE_ENVIRONMENT` / `VITE_NODE_ENV`). That is a safety net, not a substitute for separate projects.

## Frontend environment variables

Copy `frontend/.env.example` and fill the **web** config from Firebase Console → Project settings → Your apps → Drivoo Web.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=
```

These values are public client identifiers, not Admin secrets. Never put a service-account private key in `VITE_*`.

## Backend environment variables

```env
BC_FIREBASE_PROJECT_ID=
BC_FIREBASE_CLIENT_EMAIL=
BC_FIREBASE_PRIVATE_KEY=
# or:
# GOOGLE_APPLICATION_CREDENTIALS=/secure/path/serviceAccount.json
BC_FIREBASE_ENVIRONMENT=development
```

If `BC_FIREBASE_PRIVATE_KEY` is stored in `.env`, keep the `\n` sequences. The backend converts them to real newlines.

## Local setup

1. Create or select a Firebase project (dev).
2. Add a Web app if needed.
3. Enable **Cloud Messaging**.
4. Enable **Cloud Firestore** (production mode).
5. Deploy rules: `firebase deploy --only firestore:rules` (uses `firestore.rules` at the repo root).
6. Fill frontend and backend env files.
7. Restart `frontend` (`npm run dev`) and `backend`.

If Firebase env vars are empty, the app still runs. Push registration is skipped.

## FCM (web)

Client logic lives in `frontend/src/lib/firebase/`. React components must not call the SDK directly.

```text
Component → Hook → Service → Firebase SDK
```

- `useFirebaseMessaging` registers a device only when the user is signed in **and** the browser already granted notification permission.
- Call `enablePush()` from a later settings UI to request permission (user gesture).
- Tokens are stored in MongoDB (`FirebaseDevice`), one document per device. Expo mobile tokens stay in `PushToken` and are unchanged.

API (authenticated, bound to `req.user`):

- `POST /api/fcm-devices`
- `GET /api/fcm-devices`
- `DELETE /api/fcm-devices` (body `{ token }`)

## Service worker

Vite generates `/firebase-messaging-sw.js` from the `VITE_FIREBASE_*` variables (dev middleware + production asset). Do not put Admin credentials in it.

Background messages with a `notification` payload are displayed by the browser. Data-only messages are shown by the worker. Notification clicks open `data.url` or `/`.

## Firestore layout (chat — not implemented yet)

Preferred model: nested messages for pagination and rules.

```text
conversations/{conversationId}
  participantUids: string[]
  participants: [{ userId, role, unreadCount, lastReadAt }]
  lastMessage, lastMessageAt, lastMessageSenderId
  deletedAt
  messages/{messageId}
    senderId, type, text, attachmentUrl, readBy, deletedAt, createdAt
```

Client helpers: `getConversationPath`, `getConversationMessagesPath`.

## Firebase Admin

`backend/src/services/firebase/messaging.ts` exposes:

- `sendNotificationToUser(userId, payload)`
- `sendNotificationToDevice(token, payload)`
- `sendMulticastNotification(tokens, payload)`

They are ready for tests. Booking/message/payment events are **not** wired yet.

Invalid FCM tokens are deactivated (`isActive: false`).

## Retrieve credentials (Firebase Console)

### Web config

Project settings → General → Your apps → Drivoo Web → SDK snippet.

### VAPID key

Project settings → Cloud Messaging → Web Push certificates → Key pair.

### Admin SDK

Project settings → Service accounts → Generate new private key.

Use `client_email`, `project_id`, and `private_key`. Keep the JSON file off git.

### Manual console checklist

- [ ] Cloud Messaging API (HTTP v1) enabled
- [ ] Legacy Cloud Messaging API can stay disabled
- [ ] Firestore created in production mode
- [ ] `firestore.rules` deployed (deny-all until Custom Tokens)
- [ ] Distinct Firebase projects for staging/production
- [ ] Service account JSON stored only on the server

## Production

- Serve the frontend over HTTPS (required for Push and service workers).
- Confirm `/firebase-messaging-sw.js` is at the site origin root.
- Set `BC_FIREBASE_ENVIRONMENT=production` and `VITE_NODE_ENV=production`.
- Use the production Firebase project credentials only on the production host.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| No token | HTTPS or localhost, notification permission, VAPID key, SW at `/firebase-messaging-sw.js` |
| 403 on `/api/fcm-devices` | Signed in, `withCredentials`, correct `x-bc-app` |
| Admin send no-ops | `BC_FIREBASE_*` or `GOOGLE_APPLICATION_CREDENTIALS` |
| Private key parse error | `\n` in `.env`, quoted key |
| Duplicate notifications | Do not send both notification + data display on the client; SW skips `payload.notification` |
| Dev pushes hit prod users | Separate Firebase projects; matching `environment` on devices |

## Tests

```bash
cd frontend && npm test
cd backend && npm test
```

Firebase is mocked / unconfigured in unit tests. Backend device tests use MongoDB like the rest of the suite.
