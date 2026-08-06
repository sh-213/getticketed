/**
 * Quiz view controller for /cscs/mock-test.html.
 * Owns question fetching, progress persistence, rendering, and the
 * handoff to Results.render() once the quiz is complete.
 *
 * The question bank can hold more questions than a single test uses
 * (see TEST_LENGTH). Each fresh attempt draws a random subset of that
 * size from the full pool and shuffles their order, so repeat attempts
 * don't show the same 50 questions in the same order. `questions` always
 * holds the full fetched pool; `state.questionIds` holds the specific,
 * shuffled subset for the current attempt.
 *
 * Answers are only ever written to storage together with an advanced
 * currentIndex (see commitAnswerAndAdvance), so a refresh mid-question
 * never leaves a duplicate or half-recorded answer behind.
 */
(function () {
  const STATE_KEY = "cscs_quiz_state_v1";
  const CERT_ID = "cscs";
  const TEST_LENGTH = 50;

  let questions = [];
  let questionsById = new Map();
  let state = null;
  let pendingAnswer = null; // { selectedIndex, correct } for the on-screen, not-yet-committed question

  const els = {
    loading: document.getElementById("loading-view"),
    error: document.getElementById("error-view"),
    errorMessage: document.getElementById("error-message"),
    retryBtn: document.getElementById("retry-btn"),
    quiz: document.getElementById("quiz-view"),
    results: document.getElementById("results-view"),
    progressFill: document.getElementById("progress-fill"),
    progressLabel: document.getElementById("progress-label"),
    topic: document.getElementById("question-topic"),
    questionText: document.getElementById("question-text"),
    optionsList: document.getElementById("options-list"),
    feedbackPanel: document.getElementById("feedback-panel"),
    feedbackHeading: document.getElementById("feedback-heading"),
    feedbackExplanation: document.getElementById("feedback-explanation"),
    feedbackSource: document.getElementById("feedback-source"),
    nextBtn: document.getElementById("next-btn"),
    liveRegion: document.getElementById("quiz-live"),
  };

  /**
   * Fisher-Yates shuffle. Returns a new array; never mutates the input,
   * since `questions` is the shared, cached full pool.
   */
  function shuffleArray(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function isValidState(s) {
    return (
      s &&
      typeof s === "object" &&
      s.certId === CERT_ID &&
      Array.isArray(s.questionIds) &&
      s.questionIds.length > 0 &&
      typeof s.currentIndex === "number" &&
      s.currentIndex >= 0 &&
      Array.isArray(s.answers) &&
      typeof s.completed === "boolean" &&
      typeof s.startedAt === "string" &&
      (!s.completed || s.answers.length > 0) // a completed quiz must have answers
    );
  }

  /**
   * A stored attempt is only resumable if every question it references
   * still exists in the current bank. If the bank has since changed
   * (question removed/replaced), the safe fallback is a fresh attempt.
   */
  function isResumableAgainstBank(storedIds) {
    const seen = new Set();
    for (const id of storedIds) {
      if (seen.has(id) || !questionsById.has(id)) return false;
      seen.add(id);
    }
    return true;
  }

  function createFreshState() {
    const subsetSize = Math.min(TEST_LENGTH, questions.length);
    const selected = shuffleArray(questions).slice(0, subsetSize);
    return {
      certId: CERT_ID,
      questionIds: selected.map((q) => q.id),
      currentIndex: 0,
      answers: [],
      completed: false,
      startedAt: new Date().toISOString(),
    };
  }

  function saveState() {
    Storage.set(STATE_KEY, state);
  }

  function announce(text) {
    if (els.liveRegion) els.liveRegion.textContent = text;
  }

  function currentQuestion() {
    return questionsById.get(state.questionIds[state.currentIndex]);
  }

  // --- View switching -----------------------------------------------

  function showLoading() {
    els.loading.hidden = false;
    els.error.hidden = true;
    els.quiz.hidden = true;
    els.results.hidden = true;
  }

  function showError(message) {
    els.loading.hidden = true;
    els.error.hidden = false;
    els.quiz.hidden = true;
    els.results.hidden = true;
    els.errorMessage.textContent = message;
  }

  function showQuiz() {
    els.loading.hidden = true;
    els.error.hidden = true;
    els.quiz.hidden = false;
    els.results.hidden = true;
  }

  function showResultsView() {
    els.loading.hidden = true;
    els.error.hidden = true;
    els.quiz.hidden = true;
    els.results.hidden = false;
    Results.render(els.results, {
      questions,
      answers: state.answers,
      onRestart: restartQuiz,
    });
    trackEvent("results_viewed", {
      certId: CERT_ID,
      score: Scoring.calculateScore(state.answers).percentage,
    });
  }

  // --- Question rendering ---------------------------------------------

  function renderQuestion() {
    const question = currentQuestion();
    const questionNumber = state.currentIndex + 1;
    const total = state.questionIds.length;

    pendingAnswer = null;

    els.progressFill.style.width = `${(state.currentIndex / total) * 100}%`;
    els.progressLabel.textContent = `Question ${questionNumber} of ${total}`;
    els.topic.textContent = question.topic;
    els.questionText.textContent = question.question;
    els.questionText.focus();

    els.optionsList.innerHTML = "";
    question.options.forEach((optionText, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.dataset.index = String(index);
      btn.setAttribute("aria-label", `Option ${letterFor(index)}: ${optionText}`);
      btn.innerHTML = `<span class="option__marker" aria-hidden="true">${letterFor(index)}</span><span>${escapeHtml(optionText)}</span>`;
      btn.addEventListener("click", () => handleAnswer(question, index, btn));
      els.optionsList.appendChild(btn);
    });

    els.feedbackPanel.hidden = true;
    els.nextBtn.hidden = true;

    announce(`Question ${questionNumber} of ${total}. Topic: ${question.topic}.`);
  }

  /**
   * Injects schema.org Question/Answer structured data built from the
   * live question bank, so it can never drift out of sync with the
   * actual quiz content in questions.json.
   */
  function injectQuestionSchema(questionList) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": questionList.map((q) => ({
        "@type": "Question",
        "name": q.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${q.options[q.correctIndex]}. ${q.explanation}`,
        },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  function letterFor(index) {
    return String.fromCharCode(65 + index); // 0 -> A, 1 -> B, ...
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function handleAnswer(question, selectedIndex, selectedBtn) {
    if (pendingAnswer) return; // already answered this question

    const correct = selectedIndex === question.correctIndex;
    pendingAnswer = { selectedIndex, correct };

    // Correct/incorrect state is never shown by colour alone: each
    // affected option also gets an icon and a status word appended to
    // its accessible name.
    const optionButtons = Array.from(els.optionsList.children);
    optionButtons.forEach((btn, index) => {
      btn.disabled = true;
      const marker = btn.querySelector(".option__marker");
      if (index === question.correctIndex) {
        btn.classList.add("is-correct");
        marker.textContent = "✓";
        btn.setAttribute("aria-label", `${btn.getAttribute("aria-label")} — correct answer`);
      } else if (index === selectedIndex) {
        btn.classList.add("is-incorrect");
        marker.textContent = "✗";
        btn.setAttribute("aria-label", `${btn.getAttribute("aria-label")} — your answer, incorrect`);
      }
    });

    els.feedbackPanel.hidden = false;
    els.feedbackPanel.dataset.result = correct ? "correct" : "incorrect";
    els.feedbackHeading.textContent = correct ? "Correct" : "Not quite";
    els.feedbackExplanation.textContent = question.explanation;

    if (question.source) {
      els.feedbackSource.hidden = false;
      els.feedbackSource.textContent = `Source: ${question.source}`;
    } else {
      els.feedbackSource.hidden = true;
      els.feedbackSource.textContent = "";
    }

    const isLastQuestion = state.currentIndex === state.questionIds.length - 1;
    els.nextBtn.textContent = isLastQuestion ? "See Results" : "Next Question";
    els.nextBtn.hidden = false;
    els.nextBtn.focus();

    announce(correct ? "Correct." : "Not quite. See the explanation below.");
  }

  function commitAnswerAndAdvance() {
    if (!pendingAnswer) return;
    const question = currentQuestion();

    state.answers.push({
      questionId: question.id,
      selectedIndex: pendingAnswer.selectedIndex,
      correct: pendingAnswer.correct,
    });

    const isLastQuestion = state.currentIndex === state.questionIds.length - 1;

    if (isLastQuestion) {
      state.completed = true;
      saveState();
      trackEvent("quiz_completed", {
        certId: CERT_ID,
        score: Scoring.calculateScore(state.answers).percentage,
      });
      showResultsView();
    } else {
      state.currentIndex += 1;
      saveState();
      renderQuestion();
    }
  }

  function restartQuiz() {
    Storage.remove(STATE_KEY);
    state = createFreshState();
    saveState();
    trackEvent("quiz_started", { certId: CERT_ID, totalQuestions: state.questionIds.length });
    showQuiz();
    renderQuestion();
  }

  // --- Init -------------------------------------------------------------

  async function init() {
    showLoading();
    try {
      questions = await QuestionBank.fetch(SITE_CONFIG.certs[CERT_ID].questionsPath);
      questionsById = new Map(questions.map((q) => [q.id, q]));
      injectQuestionSchema(questions);
    } catch (err) {
      showError(
        "We couldn't load the mock test questions. Check your connection and try again."
      );
      return;
    }

    const stored = Storage.get(STATE_KEY, null, isValidState);

    if (stored && isResumableAgainstBank(stored.questionIds) && stored.currentIndex <= stored.questionIds.length) {
      state = stored;
      showQuiz();
      if (state.completed) {
        showResultsView();
      } else {
        renderQuestion();
      }
    } else {
      state = createFreshState();
      saveState();
      trackEvent("quiz_started", { certId: CERT_ID, totalQuestions: state.questionIds.length });
      showQuiz();
      renderQuestion();
    }
  }

  els.retryBtn.addEventListener("click", init);
  els.nextBtn.addEventListener("click", commitAnswerAndAdvance);

  init();
})();
