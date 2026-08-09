/**
 * Site-wide configuration and copy.
 * Edit this file to update brand name, pricing, Gumroad link, and product
 * copy without touching any page logic.
 */
const SITE_CONFIG = {
  brandName: "Get Ticketed",

  // Drop the real Gumroad checkout URL in here when ready. Nothing else
  // in the codebase needs to change.
  gumroadLink: "https://4091731470513.gumroad.com/l/kfvhb",

  // Brevo (free plan: unlimited contacts, 300 emails/day) embedded-form
  // action URL. Find it in Brevo under Contacts > Forms > create or open
  // a form > Embed > HTML code — copy the <form action="..."> URL, it
  // looks like "https://XXXXXXXX.sibforms.com/serve/MUIXXXXXXX...".
  // This value is meant to be public (it's the same one exposed in any
  // embedded Brevo form snippet); the real secret (API key) is never
  // used here since there's no backend to hold it safely.
  brevo: {
    formAction:
      "https://40067e93.sibforms.com/serve/MUIFAJxeWqsjjktKsEdRHclscJme6KaKdcLxHzck75yavv9560PHJzpZFMbRvsM5QlDwIoPOsEXWUDIwh7ZiwwdXZPuA-YHwqJlsuiGo8Az08lX7Jo4YDR6V6n7caOwvFHc19dzNtAYb6uVMoQZ88TEw6Lt3HcaS4kAlJzJj1N_n1MNfDdYygEjB937W7tHwwsjWO4nyRgeU6AKK7A==",
  },

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
