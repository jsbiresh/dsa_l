import assert from "node:assert/strict";

import {
  generateRuleBasedRecommendations
} from "../js/intelligence/recommendation-engine.js";

import {
  integrateAnalysis
} from "../js/intelligence/analysis-integrator.js";

const aiFixture = {
  mode: "problem_solving",
  requestSummary: "Find two numbers whose sum equals a target.",
  keywords: ["array", "two numbers"],
  clues: [],
  approaches: [
    {
      pattern: "Two Pointers",
      applicability: "direct",
      reason: "AI-generated suggestion.",
      conditions: [],
      dataStructures: [
        {
          name: "Array",
          role: "input",
          reason: "Input sequence."
        }
      ]
    }
  ],
  requestedDataStructures: [],
  reasoning: "Example AI reasoning.",
  confidence: 0.8,
  requiresClarification: false,
  clarificationQuestion: "",
  primaryPattern: "Two Pointers",
  secondaryPatterns: [],
  recommendedDataStructures: ["Array"],
  requestedDataStructure: "",
  timeComplexity: "",
  spaceComplexity: "",
  concepts: []
};

// TEST 1: Curated knowledge must override conflicting AI suggestions.
const question =
  "Given an unsorted array of integers, return the indices of two numbers whose sum equals a target.";

const rules = generateRuleBasedRecommendations(question);

const integrated = integrateAnalysis(aiFixture, rules);

assert.equal(integrated.recommendationStatus, "curated");
assert.equal(integrated.recommendationSource, "curated_rule_engine");

assert.ok(
  integrated.approaches.some(item => item.pattern === "Hashing")
);

assert.ok(
  !integrated.approaches.some(item => item.pattern === "Two Pointers")
);

console.log("PASS: Curated Hashing recommendation overrides conflicting AI suggestion.");

// TEST 2: Structure selection comes from curated knowledge.
assert.ok(
  integrated.recommendedDataStructures.includes("Hash Map")
);

assert.ok(
  integrated.recommendedDataStructures.includes("Array")
);

assert.equal(
  integrated.approaches[0].verificationStatus,
  "curated"
);

console.log("PASS: Curated data structures reach the integrated analysis.");

// TEST 3: Knowledge is retained for educational explanations.
const hashMap = integrated.approaches[0].dataStructures.find(
  item => item.name === "Hash Map"
);

assert.ok(hashMap.knowledge.purpose);
assert.ok(hashMap.knowledge.strengths.length > 0);
assert.ok(hashMap.knowledge.tradeOffs.length > 0);

console.log("PASS: Data structure knowledge is preserved.");

// TEST 4: Deterministic evidence replaces potentially conflicting AI clues.
assert.ok(integrated.clues.length > 0);
assert.ok(
  integrated.clues.some(clue => clue.suggests === "Hashing")
);

console.log("PASS: Curated evidence is displayed as problem clues.");

// TEST 5: Unsupported problems retain AI suggestions as unverified.
const unknownRules = generateRuleBasedRecommendations(
  "Design an algorithm for an unspecified mathematical objective."
);

const unknownAi = {
  ...aiFixture,
  reasoning: "An AI-generated hypothesis."
};

const unverified = integrateAnalysis(unknownAi, unknownRules);

assert.equal(unverified.recommendationStatus, "ai_unverified");
assert.equal(
  unverified.approaches[0].verificationStatus,
  "unverified"
);

assert.match(unverified.reasoning, /not been independently verified/i);

console.log("PASS: Unmatched AI suggestions are explicitly marked unverified.");

// TEST 6: Invalid inputs are rejected.
assert.throws(
  () => integrateAnalysis(null, rules),
  /Validated AI analysis/
);

assert.throws(
  () => integrateAnalysis(aiFixture, null),
  /rule-based analysis/
);

console.log("PASS: Invalid integration inputs are rejected.");

console.log("\nANALYSIS INTEGRATOR TESTS PASSED.");
