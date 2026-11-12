import assert from "node:assert/strict";

import {
  applyDeterministicIntelligence
} from "../js/ai/problem-analyzer.js";

const aiAnalysis = {
  mode: "problem_solving",
  requestSummary: "Find two numbers matching a target.",
  keywords: ["array"],
  clues: [],
  approaches: [
    {
      pattern: "Two Pointers",
      applicability: "direct",
      reason: "AI suggestion.",
      conditions: [],
      dataStructures: [
        {
          name: "Array",
          role: "input",
          reason: "Input."
        }
      ]
    }
  ],
  requestedDataStructures: [],
  reasoning: "AI reasoning.",
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

const unsortedTwoSum =
  "Given an unsorted array of integers, return the indices of two numbers whose sum equals a target.";

const result = applyDeterministicIntelligence(
  unsortedTwoSum,
  aiAnalysis
);

assert.equal(result.recommendationStatus, "curated");
assert.equal(result.primaryPattern, "Hashing");

assert.deepEqual(
  result.recommendedDataStructures.sort(),
  ["Array", "Hash Map"].sort()
);

assert.ok(
  !result.approaches.some(item => item.pattern === "Two Pointers")
);

console.log("PASS: Actual analyzer integration prioritizes curated Two Sum rules.");

const customAnalysis = {
  ...aiAnalysis,
  mode: "custom_visualization"
};

const customResult = applyDeterministicIntelligence(
  "Visualize an array with ten elements.",
  customAnalysis
);

assert.equal(
  customResult.recommendationStatus,
  "not_applicable"
);

assert.equal(customResult.mode, "custom_visualization");

console.log("PASS: Custom visualization requests retain their original mode.");

console.log("\\nANALYZER PIPELINE TESTS PASSED.");
