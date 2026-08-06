/**
 * Results view. Renders into a container element once the quiz is
 * complete. Pure DOM/event wiring — all scoring math lives in scoring.js
 * so it stays testable and reusable.
 *
 * Architecture note: each result is rendered as a discrete block
 * (`renderExplanationReviewItem`-style structure) with a stable
 * data-question-id hook, so a future "was this helpful?" control could
 * be added per-question without restructuring this file.
 */
const Results = {
  /**
   * @param {HTMLElement} container
   * @param {{questions: object[], answers: object[], onRestart: Function}} data
   */
  render(container, { questions, answers, onRestart }) {
    // Guard against an invalid/empty result set rather than showing a
    // broken or misleading summary.
    if (!Array.isArray(answers) || answers.length === 0) {
      container.innerHTML = `
        <div class="state-message">
          <h2>No results to show</h2>
          <p>It looks like this test wasn't completed. Start again to get your results.</p>
          <button type="button" class="btn btn-primary" id="restart-btn">Start the Mock Test</button>
        </div>`;
      container.querySelector("#restart-btn").addEventListener("click", onRestart);
      return;
    }

    const score = Scoring.calculateScore(answers);
    const breakdown = Scoring.topicBreakdown(answers, questions);
    const strongest = Scoring.strongestTopics(breakdown, 3);
    const weakest = Scoring.weakestTopics(breakdown, 3);
    const readiness = Scoring.readinessMessage(score.percentage);
    const weakestTopicName = weakest.length > 0 ? weakest[0].topic : null;

    const passMark = SITE_CONFIG.officialPassMark;
    const meetsMark = Scoring.meetsPassMark(score.percentage, passMark.percentage);

    container.innerHTML = `
      <section class="section section--tight" aria-labelledby="results-heading">
        <h1 id="results-heading" class="sr-only">Your Results</h1>

        <div class="score-summary">
          <div class="score-summary__figure">${score.percentage}%</div>
          <p class="score-summary__label">${score.correct} of ${score.total} correct</p>
          <p class="score-summary__pass-status" data-pass="${meetsMark}">
            ${meetsMark ? "Meets" : "Below"} the official ${passMark.percentage}% pass mark
          </p>
        </div>

        <div style="margin-top: var(--space-6);">
          <h2>Strongest topics</h2>
          <ul class="topic-list" style="margin-top: var(--space-3);">
            ${strongest.map((t) => topicRow(t)).join("")}
          </ul>
        </div>

        <div style="margin-top: var(--space-5);">
          <h2>Topics to work on</h2>
          <ul class="topic-list" style="margin-top: var(--space-3);">
            ${weakest.map((t) => topicRow(t)).join("")}
          </ul>
        </div>

        <div style="margin-top: var(--space-5);" class="readiness-box">
          <p>${readiness.text}</p>
          <p>
            The official CITB test has a pass mark of <strong>${passMark.correctNeeded} out of ${passMark.totalQuestions} (${passMark.percentage}%)</strong>.
            You scored ${score.percentage}% here, which would <strong>${meetsMark ? "meet" : "fall short of"}</strong> that mark on this practice set.
          </p>
          <p>${readiness.disclaimer}</p>
          <p class="preview-note">
            Source: <a href="${passMark.sourceUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(passMark.source)}</a>
          </p>
        </div>

        <div style="margin-top: var(--space-6);" class="pitch">
          <h2>${weakestTopicName ? `Fix your ${escapeHtml(weakestTopicName)} gaps` : "Ready to go further?"}</h2>
          <p style="margin-top: var(--space-2);">
            ${weakestTopicName ? `The Pass Pack includes a full topic summary sheet and extra practice questions for ${escapeHtml(weakestTopicName)}, plus everything else you need for test day.` : "The Pass Pack gives you 150+ more questions and everything else you need for test day."}
          </p>
          <p class="pitch__cost-note" style="margin-top: var(--space-3);" data-cost-copy>Failing can cost you through another test attempt, travel, and time away from work.</p>
          <p class="pitch__price" style="margin-top: var(--space-2);">
            <span data-pass-pack-price>£9.99</span> one-time
          </p>
          <ul class="feature-list" style="margin-top: var(--space-3);">
            ${SITE_CONFIG.passPack.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
          </ul>
          <p style="margin-top: var(--space-4);">
            <a href="${SITE_CONFIG.certs.cscs.guidePath}" id="pass-pack-cta" class="btn btn-primary btn-block">Get the Pass Pack</a>
          </p>
        </div>

        <div style="margin-top: var(--space-6);" class="card">
          <h2>Want this on your phone for test day?</h2>
          <p style="margin: var(--space-2) 0 var(--space-3);">We'll send you your score summary. One email, no spam.</p>
          <form
            id="email-capture-form"
            class="email-capture"
            action="${SITE_CONFIG.brevo.formAction}"
            method="post"
            target="email-signup-frame"
            novalidate
          >
            <label class="field-label" for="email-input">Email address</label>
            <input class="field-input" type="email" id="email-input" name="EMAIL" autocomplete="email" required>

            <input type="hidden" name="locale" value="en">

            <div aria-hidden="true" style="position: absolute; left: -5000px;">
              <input type="text" name="email_address_check" tabindex="-1" value="">
            </div>

            <label class="consent-label" for="email-consent">
              <input type="checkbox" id="email-consent" name="OPT_IN" required>
              <span>I agree to receive this email and understand I can unsubscribe at any time. See the <a href="/privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
            </label>

            <button type="submit" class="btn btn-secondary">Send it to me</button>
          </form>
          <iframe id="email-signup-frame" name="email-signup-frame" title="Email signup response" style="display:none;"></iframe>
          <div id="email-confirmation" class="form-confirmation" hidden>
            Sent. Check your inbox for your results.
          </div>
        </div>

        <p style="margin-top: var(--space-6); text-align: center;">
          <button type="button" class="btn btn-secondary" id="restart-btn">Retake the test</button>
        </p>
      </section>
    `;

    wireEmailForm(container);
    wirePassPackCta(container);
    container.querySelector("#restart-btn").addEventListener("click", onRestart);
  },
};

function topicRow(t) {
  return `
    <li class="topic-list__item">
      <span>${escapeHtml(t.topic)}</span>
      <span><strong>${t.percentage}%</strong> (${t.correct}/${t.total})</span>
    </li>`;
}

function wirePassPackCta(container) {
  const cta = container.querySelector("#pass-pack-cta");
  cta.addEventListener("click", () => {
    trackEvent("pass_pack_clicked", { location: "results" });
  });
}

/**
 * Submits to Brevo via a real form POST targeting a hidden iframe,
 * rather than fetch()/XHR — Brevo's sibforms.com endpoint isn't
 * CORS-enabled for cross-origin AJAX, and there is no backend here to
 * proxy the request through or to hold an API key safely. This is the
 * standard no-backend integration pattern: the browser submits the form
 * for real, the response lands in the hidden iframe instead of
 * navigating the page away, and we show the confirmation optimistically
 * once submitted (the iframe's response is cross-origin, so it can't be
 * read to confirm success/failure — email format and consent are
 * validated client-side before submitting).
 */
function wireEmailForm(container) {
  const form = container.querySelector("#email-capture-form");
  const confirmation = container.querySelector("#email-confirmation");
  const iframe = container.querySelector("#email-signup-frame");
  const emailInput = form.querySelector("#email-input");
  const consentInput = form.querySelector("#email-consent");

  let submitted = false;

  form.addEventListener("submit", (event) => {
    if (!emailInput.checkValidity()) {
      event.preventDefault();
      emailInput.reportValidity();
      return;
    }
    if (!consentInput.checkValidity()) {
      event.preventDefault();
      consentInput.reportValidity();
      return;
    }

    // Valid — let the browser submit the form for real. The email
    // address is sent only to Brevo, never written to localStorage
    // or logged.
    submitted = true;
    trackEvent("email_submitted", {});
  });

  iframe.addEventListener("load", () => {
    if (!submitted) return; // ignore the iframe's initial empty load
    form.hidden = true;
    confirmation.hidden = false;
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
