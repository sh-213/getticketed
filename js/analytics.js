/**
 * Minimal analytics module. Currently just logs to the console.
 * Swap the body of trackEvent() for a real provider later — nothing
 * elsewhere in the codebase needs to change since every call site only
 * ever calls trackEvent(name, data).
 *
 * Events fired across the site:
 *   quiz_started, quiz_completed, results_viewed,
 *   pass_pack_clicked, email_submitted
 */
function trackEvent(name, data = {}) {
  try {
    console.log("[analytics]", name, data);
  } catch (err) {
    // Analytics must never break the page.
  }
}
