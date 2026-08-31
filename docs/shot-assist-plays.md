# Shot / assist play links

Shots remain in the existing player's `stats.shots` or `stats.quarters.qN.shots` array. AST remains an independent `games.playEvents` stat event and the existing player's AST counter. No collection migration or aggregate changes are required.

- Shot: `playId`, nullable `assistPlayerId`, nullable `assistEventId`.
- AST: same `playId`, `shotEventId` (the stable history event ID), `shooterPlayerId`.
- New quick shots also keep `onCourtPlayerIds` for untimed historical selection. Timed selection uses `currentPlayersAt`. Old untimed shots use original recording/substitution sequence, never drag order.
- A play ID is generic; no separate assist-only play collection is introduced.

The assist writer rereads the game and relevant stat documents in a Firestore transaction, computes deltas, and commits all changes together. A shot ID is reused on save retries. One request cannot commit only the shot or only the AST. Existing AST linking does not increment counters. Changing an assistant moves the existing AST counter when a different unlinked AST is not selected. Unlinking leaves AST intact; explicit deletion removes its counter and clears the partner reference.

Legacy aggregate-only AST/2PM/3PM rows are materialized only when used. All remaining rows for that player/Q/key retain their legacy event IDs and totals, preventing subsequent legacy row indices or drag overrides from shifting. No mass rewrite is performed.

Normal shot editing uses the same writer to preserve links or detach an AST when Made changes to Miss. Normal stat counter reductions that remove a linked AST also clear the shot reference. The original history category/result CSS is unchanged; relation text is a separate small line.

Related SHOT and AST now render as one history action, anchored at the shot's position. Grouping requires reciprocal IDs, the same play ID/Q, a Made shot and different players; incomplete or unrelated old events remain visible independently. Both event IDs are retained when saving drag order. Unlinking restores the independent AST row. The grouped editor retains separate SHOT/AST edit and delete operations.

Each history action and its following insertion button share a DOM container. Dragging moves that container, keeping the button immediately below its action. The head insertion button stays at the top. Insertion anchors are refreshed after every move, and insertion order is normalized so a new action cannot split a linked pair.

## Validation

- `node --test tests/*.test.mjs` (expand file names in PowerShell): all 58 tests passed in the release worktree.
- New behavior tests cover starters, substitutions, re-entry, Q changes, old games, both link directions, reuse, change, unlink, deletion, normal editing, reordering/insertion, aggregates, retry idempotency and atomic commit failure.
- `node tests/build-assist-browser-fixture.mjs` generates a disposable page at `tmp/assist-qa/index.html`. Serve the repository and open that page. It extracts the actual quick/history functions and uses the same mutation planner, with an in-memory persistence adapter and synthetic players. It never imports Firebase or writes production records.
- At 390 × 844: player → shot → Made → assistant; no self/bench candidate; No + name; No.8 OUT / No.12 IN; none; Miss without assist step; history link/unlink; legacy AST linking; simulated save failure and successful retry were checked through browser interactions.
- Grouped-history follow-up: three shots plus one AST render as three cards. Dragging the related card to the top preserved one insertion button per card, a 7px card/button gap, correct before/after IDs, and the order after reopening. Unlink restored the fourth independent row. The fixture's “関連付き履歴テスト” button reproduces this scenario.
- Transaction tests simulate callback retries and rejected commits. They are not a Firebase emulator test. Public deployment is checked separately; no live game is modified just to test this feature.
