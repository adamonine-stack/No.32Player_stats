# Local history journal (2026-09-07)

## Reproduced cause

SHOT records live in `stats.shots` / `stats.quarters.qN.shots`, not `game.playEvents`.
`rebuildStats()` replaced optimistic stats with listener rows, while the former
pending-history adapter only replayed on game snapshots and selected UI actions.
Its completed-operation protection also expired after 2.5 seconds regardless of
whether either listener had observed the committed values.

`R32_BEFORE_FIX=1 node --test tests/listener-shot-regression.test.mjs` executes the
actual adapter and stats rebuild from commit 855ae21. It fails with 0 SHOT records
where 1 is required. The identical listener sequence passes on the new adapter.

## Design

- HistoryJournal retains received documents separately from local operation patches.
- Both existing game and stats listeners synchronously project server + local state.
- Event/shot arrays merge by immutable ID. Rows retain all shot fields and AST links.
- Per-document counters use local deltas to preserve unrelated remote increments.
- IndexedDB stores every new mutation before any server transaction, online or offline.
- A single ordered worker prevents dependent edits/deletes overtaking their creates.
- Existing transactions write a per-client monotonic `historyClock` receipt to the
  game and affected stats. Receipts prevent stale operation retries from recreating
  deleted events. No additional listener or confirmation read is introduced.
- Projection skips each operation separately for each document only after its
  receipt is observed there. Durable payloads are removed after transaction success
  AND receipt observation for every affected document, with no expiration timer.
- Older document snapshots cannot replace a document with a newer receipt/timestamp.
- Failed operations remain durable, block dependent writes, and retain local edits.
- SHOT edits preserve sequence, creation time and playId. FT/non-shot deletion uses
  the existing mutation transaction machinery. General stat edits use that same path.
- The latest panel updates in place; clock input/editor focus is not rebuilt by a
  listener. Its three rows are the most recent precisely ordered actions, excluding
  synthetic legacy rows that have no known registration order.
- Service Worker network-first JS/SDK responses are cached for subsequent offline
  startup. Firebase collection schema and legacy Q/shot formats remain supported.

## Verification

`node --test --test-reporter=tap tests/*.test.mjs`

Added tests cover the actual stats-listener regression, partial acknowledgement,
stale snapshots, SHOT→REB, edits before create acknowledgement, tombstones, offline
reload/reconnect, AST linking, equal sequences, remote counter preservation, durable
queue order/failures and real transaction replay with revision receipts.

The browser fixture `tests/local-history-qa.html` uses production UI/planners/stores
and substitutes only Firebase transport through an import map. It uses a separate
QA IndexedDB database and synthetic players/game. The hold, old-snapshot and offline
controls are explicit test controls; it cannot send writes to production Firebase.
Regenerate with `node tests/build-local-history-fixture.mjs` after UI changes.
