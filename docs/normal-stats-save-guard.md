# Normal stats save guard

## Root cause and scope

`statsForm` previously read `state.stats` immediately, fell back to `{}` for a
missing document or quarter, and displayed numeric zero for absent fields.
The save handler read mutable listener state again and passed absolute form
values through `saveAssistPlay` / `reconcileStats`. Although
`commitAssistMutation` read fresh documents in a transaction, it had no edit
baseline comparison. Therefore stale or uninitialized absolute values could
replace existing totals. This identifies an executable unsafe path; it is not
proof that a particular production record was lost through that path.

Normal edits now use server-only game and game/player stats reads, reject
cache/pending writes/duplicate documents, and check the local operation queue.
A 12-second read timeout fails closed. Inputs are not rendered before success;
a generation counter discards late responses after player changes or closing.
The save button and handler require a successfully rendered baseline.

The immutable baseline records game/player/mode/quarter, document identity,
and deterministic sorted value fingerprints. It compares the entire player's
stats document (including other quarters, shots and associations), and the
game's registration mode, quarter count, season, playEvents, order overrides
and history clock. `updatedAt` is excluded from the stats fingerprint. This is
intentionally conservative: a change to another quarter or game history may
require reloading. Participation-only changes do not invalidate the baseline.

Every save transaction callback, including retries, compares that baseline
before staging any writes. No database schema/revision migration is needed.
Zero has no special prohibition: values from the loaded editable form, including
an intentional 3→0 change, are accepted when the baseline still matches.

Normal absolute saves bypass the optimistic/offline queue. Offline or uncertain
normal saves stop; quickStat/freeThrow/SHOT/AST delta and journal routes remain
in place. Old queued absolute reconciliations without a baseline also fail
closed rather than silently replaying unsafe totals. Successful saves reload
the baseline for the existing stay-open form behavior.

`saveParticipationGame` remains unchanged: it sends a gamePatch for participation
(and existing temporary-player data where relevant). No stats write, playEvents
rewrite, reconciliation or sequence-less history deletion is added.

## Verification

Run `node --test tests/*.test.mjs` and `node --check js/app.js`.
All destructive scenarios use in-memory documents; no production Firestore
records are modified for validation.

| Requested scenario | Coverage |
| --- | --- |
| 1, 2, 13, 14 | Actual participation save function; starter/substitution patches for all 4 Q; deep equality of stats/shots/AST/playEvents and write-target assertions |
| 3, 4 | Real transaction planner normal edits and 0; actual form handler with DOM doubles loads 3 and saves 0 |
| 5, 6 | Actual form disabled state and direct handler invocation before loading; missing-baseline transaction writes zero documents |
| 7 | Concurrent stat/history/association/mode changes; retry-time conflict recheck; unchanged updatedAt cannot hide changed values |
| 8 | Server-confirmed missing document or missing Q permits new registration |
| 9 | Server read failure, timeout, cache and pending-write rejection; actual failed form remains disabled |
| 10 | Whole-game normal edit to zero |
| 11, 12 | Existing quick-history, offline registration, journal and assist transaction regression suites |
| Additional | Out-of-order form loads; duplicate-target protection; post-save baseline reload; normal branch bypasses offline queue |

Browser fixture interaction was not run: the cloud browser rejected local/data
URLs. DOM test doubles exercise the real form function but do not substitute
for a full browser end-to-end test. Production verification is read-only startup
and deployed-file checks, not a production save test.

Firestore transaction semantics were checked against the official documentation:
https://firebase.google.com/docs/firestore/manage-data/transactions
