/**
 * Injects shared config values (brand name, Gumroad link, disclaimer,
 * cost-of-failing copy) into every page. Keeps these strings editable in
 * one place (config.js) instead of hardcoded across every HTML file.
 * Requires config.js to be loaded first.
 */
(function () {
  function applySiteConfig() {
    document.querySelectorAll("[data-brand-name]").forEach((el) => {
      el.textContent = SITE_CONFIG.brandName;
    });

    document.querySelectorAll("[data-gumroad-link]").forEach((el) => {
      el.href = SITE_CONFIG.gumroadLink;
    });

    document.querySelectorAll("[data-cost-copy]").forEach((el) => {
      el.textContent = SITE_CONFIG.costOfFailingCopy;
    });

    document.querySelectorAll("[data-disclaimer]").forEach((el) => {
      el.textContent = SITE_CONFIG.disclaimer;
    });

    document.querySelectorAll("[data-pass-pack-price]").forEach((el) => {
      el.textContent = SITE_CONFIG.passPack.price;
    });

    const yearEl = document.querySelector("[data-current-year]");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applySiteConfig);
  } else {
    applySiteConfig();
  }
})();
