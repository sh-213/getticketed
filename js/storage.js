/**
 * Safe localStorage wrapper.
 *
 * Every read is wrapped in try/catch and validated with a shape check so
 * corrupted, missing, or unparseable data always falls back to a clean
 * state instead of breaking the page. Never store personal data here
 * (no email addresses).
 */
const Storage = {
  /**
   * Read and JSON-parse a key. Returns `fallback` if the key is missing,
   * unparseable, or fails the optional `isValid` shape check.
   */
  get(key, fallback, isValid) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      if (typeof isValid === "function" && !isValid(parsed)) return fallback;
      return parsed;
    } catch (err) {
      return fallback;
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      // Storage full, disabled, or unavailable (e.g. private browsing).
      // The quiz must keep working without persistence in this case.
      return false;
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      // Ignore — nothing meaningful to recover from here.
    }
  },
};
