export async function tryEnableFirestorePersistence(enablePersistence, db, warn = console.warn) {
  const timeoutMs = 1500;
  let timer;
  try {
    const result = await Promise.race([
      Promise.resolve(enablePersistence(db)).then(() => true),
      new Promise(resolve => {
        timer = setTimeout(() => resolve('timeout'), timeoutMs);
      })
    ]);
    if (result === 'timeout') {
      warn("Firestore persistence initialization is taking too long; continuing startup while it finishes in the background.");
      return false;
    }
    return true;
  } catch (error) {
    // IndexedDB can be unavailable in private browsing or locked by another
    // tab. Persistence is an optimization; the app must still start normally.
    warn("Firestore persistence unavailable; using memory cache.", error);
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
