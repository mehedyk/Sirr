# ZIP 4 — Deploy Instructions

## 1. Run DB migration

In Supabase SQL editor, run the full contents of:

```
supabase/migrations/003_zip4_hardening.sql
```

This adds:
- `hmac TEXT` column to `messages`
- `read_receipts` table with RLS
- Hardened `conversation_members` INSERT policy (admin-only, fixes S5)
- Enables realtime on `read_receipts`

## 2. Push to Vercel

Replace all source files and push. Vercel auto-builds.

---

## What was fixed in ZIP 4

| ID  | Issue | Fix |
|-----|-------|-----|
| S5  | `conversation_members` INSERT allowed self-add race condition | `admin_insert_members` RLS policy — only admins can add members |
| S10 | `LoggingDecorator` logs to console in production (leaks IDs) | Dev-only logging; production silences `info`/`warn` entirely |
| S11 | WebRTC signaling unauthenticated (any message accepted) | Signals validated via Supabase Presence — only session-authenticated users accepted |
| S4  | No sender verification beyond AES-GCM | HMAC-SHA-256 on `conversationId:messageId:ciphertext` stored in `messages.hmac`, verified on receive |
| BUG | `aesDecryptBytes` syntax error (double decrypt call) | Removed dead function; single clean implementation |
| BUG | WebRTC `trickle: false` — ICE candidates not sent incrementally | `trickle: true` with incremental candidate exchange |
| TS  | `any` throughout hooks and components | All types explicit; `SimplePeer.SignalData`, `PresenceState`, etc. |

## New features

- **Client-side message search** — click the 🔍 in the chat header. Searches decrypted content in the browser — never sent to the server.
- **Read receipts** — `read_receipts` table tracks when each user last viewed each conversation. Subscription updates in real time.
- **Video calls** — `CallWindow` rebuilt: PiP local feed, mute audio/video, authenticated WebRTC signaling, error banner, cleanup on unmount.
- **HMAC sender auth** — every new message is signed. Tampered or replayed ciphertext shows `⚠ Message authentication failed` instead of decrypting silently.
