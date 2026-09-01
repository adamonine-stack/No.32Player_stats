export async function tryEnableFirestorePersistence(enablePersistence, db, warn = console.warn) {
  try {
    await enablePersistence(db);
    return true;
  } catch (error) {
    // IndexedDB can be unavailable in private browsing or locked by another
    // tab. Persistence is an optimization; the app must still start normally.
    warn("Firestore persistence unavailable; using memory cache.", error);
    return false;
  }
}
