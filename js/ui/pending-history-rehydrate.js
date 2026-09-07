// Kept as an import-compatible entry point for older cached shells.
// Projection now runs synchronously in both games and stats listener callbacks.
export { projectLocalHistory as rehydratePendingHistoryState } from '../core/local-history.js';
