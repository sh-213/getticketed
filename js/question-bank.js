/**
 * Fetches and validates a question bank JSON file. The quiz engine never
 * trusts the file blindly — malformed data must produce a clear error
 * state instead of a broken page or silent misbehaviour.
 */
const QuestionBank = {
  REQUIRED_FIELDS: [
    "id",
    "question",
    "options",
    "correctIndex",
    "topic",
    "explanation",
    "source",
    "verified",
  ],

  /**
   * Checks a single question object has the correct shape.
   */
  isValidQuestion(q) {
    if (!q || typeof q !== "object") return false;
    if (!this.REQUIRED_FIELDS.every((field) => field in q)) return false;
    if (typeof q.id !== "string" || !q.id) return false;
    if (typeof q.question !== "string" || !q.question) return false;
    if (!Array.isArray(q.options) || q.options.length < 2) return false;
    if (!q.options.every((opt) => typeof opt === "string")) return false;
    if (
      typeof q.correctIndex !== "number" ||
      q.correctIndex < 0 ||
      q.correctIndex >= q.options.length
    ) {
      return false;
    }
    if (typeof q.topic !== "string" || !q.topic) return false;
    if (typeof q.explanation !== "string") return false;
    if (typeof q.verified !== "boolean") return false;
    return true;
  },

  /**
   * Fetches the question bank at `path`, validates it, and returns the
   * array of valid questions. Throws a descriptive Error on any failure
   * so the caller can render a retry/error state.
   */
  async fetch(path) {
    let response;
    try {
      response = await fetch(path, { cache: "no-store" });
    } catch (err) {
      throw new Error("network");
    }

    if (!response.ok) {
      throw new Error("http");
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error("parse");
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("empty");
    }

    const validQuestions = data.filter((q) => this.isValidQuestion(q));

    if (validQuestions.length === 0) {
      throw new Error("invalid");
    }

    // Drop duplicate ids, keeping the first occurrence, so a data entry
    // error can never let the same question count twice.
    const seenIds = new Set();
    const deduped = validQuestions.filter((q) => {
      if (seenIds.has(q.id)) return false;
      seenIds.add(q.id);
      return true;
    });

    return deduped;
  },
};
