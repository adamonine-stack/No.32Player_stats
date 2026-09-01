export function createListenerRegistry() {
  const listeners = new Map();
  return {
    set(key, subscribe) {
      if (listeners.has(key)) return false;
      listeners.set(key, subscribe());
      return true;
    },
    remove(key) {
      const unsubscribe = listeners.get(key);
      if (!unsubscribe) return false;
      listeners.delete(key);
      unsubscribe();
      return true;
    },
    clear() {
      [...listeners.keys()].forEach(key => this.remove(key));
    },
    keys() {
      return [...listeners.keys()];
    }
  };
}
