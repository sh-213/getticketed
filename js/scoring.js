/**
 * Pure scoring functions. No DOM access here — everything takes plain
 * data in and returns plain data out, so it can be reused by the quiz
 * view, the results view, and tested independently of either.
 */
const Scoring = {
  /**
   * `answers` is an array of { questionId, selectedIndex, correct }.
   */
  calculateScore(answers) {
    const total = answers.length;
    const correct = answers.filter((a) => a.correct).length;
    const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);
    return { correct, total, percentage };
  },

  /**
   * Groups answers by topic and returns per-topic correct/total/percentage.
   * `questions` is the full question bank, used to look up each answer's
   * topic by questionId.
   */
  topicBreakdown(answers, questions) {
    const topicById = new Map(questions.map((q) => [q.id, q.topic]));
    const byTopic = {};

    answers.forEach((answer) => {
      const topic = topicById.get(answer.questionId);
      if (!topic) return; // Guard against answers referencing an id no longer in the bank.

      if (!byTopic[topic]) {
        byTopic[topic] = { topic, correct: 0, total: 0 };
      }
      byTopic[topic].total += 1;
      if (answer.correct) byTopic[topic].correct += 1;
    });

    return Object.values(byTopic).map((t) => ({
      ...t,
      percentage: t.total === 0 ? 0 : Math.round((t.correct / t.total) * 100),
    }));
  },

  /**
   * Returns the top `count` topics by percentage. Ties keep original
   * (alphabetical-ish) order from topicBreakdown. Topics with zero
   * questions answered are excluded from both strongest and weakest.
   */
  strongestTopics(breakdown, count = 3) {
    return [...breakdown]
      .filter((t) => t.total > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, count);
  },

  weakestTopics(breakdown, count = 3) {
    return [...breakdown]
      .filter((t) => t.total > 0)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, count);
  },

  /**
   * Plain-language readiness message. This is deliberately NOT a
   * prediction or probability of passing — it only describes performance
   * on this specific, smaller sample of questions. Bands are set relative
   * to the real CITB pass mark (90%) so "strong" roughly lines up with
   * actually clearing that bar here, not an arbitrary cutoff.
   */
  readinessMessage(percentage) {
    let level;
    let text;

    if (percentage >= 90) {
      text =
        "You're answering at or above the level the real test requires. That's a good sign, but this test only covers a sample of questions.";
      level = "strong";
    } else if (percentage >= 70) {
      text =
        "You're on the right track, but the real test sets a high bar - there are still gaps worth closing before test day.";
      level = "developing";
    } else {
      text =
        "There are significant gaps to work on before test day.";
      level = "needs-work";
    }

    return {
      level,
      text,
      disclaimer:
        "This is only an indication, not a prediction. The real exam draws from a much larger question bank, so treat this as a guide to where to focus revision, not a guarantee of the outcome.",
    };
  },

  /**
   * Compares a score against the official pass mark. Pure boolean logic
   * only — all wording/caveats live in the results view, not here.
   */
  meetsPassMark(percentage, passMarkPercentage) {
    return percentage >= passMarkPercentage;
  },
};
