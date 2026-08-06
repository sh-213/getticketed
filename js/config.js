/**
 * Site-wide configuration and copy.
 * Edit this file to update brand name, pricing, Gumroad link, and product
 * copy without touching any page logic.
 */
const SITE_CONFIG = {
  brandName: "Get Ticketed",

  // Drop the real Gumroad checkout URL in here when ready. Nothing else
  // in the codebase needs to change.
  gumroadLink: "GUMROAD_LINK_HERE",

  certs: {
    cscs: {
      name: "CSCS / CITB Health, Safety & Environment",
      questionsPath: "/data/cscs/questions.json",
      quizPath: "/cscs/mock-test.html",
      guidePath: "/cscs/guide.html",
    },
  },

  passPack: {
    price: "£9.99",
    features: [
      "150+ realistic practice questions",
      "Printable revision sheets",
      "Exam strategy guide",
      "Last-minute checklist",
      "Topic summary sheets",
      "2-3 bonus practice exams",
    ],
  },

  // Official CITB operatives HS&E test pass mark, verified directly
  // against citb.co.uk. Used only for a factual, sourced comparison on
  // the results page — never as a probability or prediction.
  officialPassMark: {
    correctNeeded: 45,
    totalQuestions: 50,
    percentage: 90,
    source: "CITB - Operatives Health, Safety and Environment test",
    sourceUrl:
      "https://www.citb.co.uk/courses-tests/health-safety-and-environment-hse-test/operatives-test",
  },

  // Standard wording for the cost of failing. Reused verbatim across the
  // landing page, results page and Pass Pack page so the claim stays
  // consistent and never states a fixed or "official" figure.
  costOfFailingCopy:
    "Failing can cost you through another test attempt, travel, and time away from work.",

  disclaimer:
    "This is an independent revision resource. It is not affiliated with, endorsed by, or connected to CITB or CSCS.",
};
