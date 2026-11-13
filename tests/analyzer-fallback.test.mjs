import assert from "node:assert/strict";

import {
    analyzeDSARequest
} from "../js/ai/problem-analyzer.js";

const twoSumQuestion =
    "Given an integer array nums = [2, 7, 12, 18] and an integer target = 20, return the indices of the two numbers whose sum equals the target. Assume exactly one valid solution exists.";

const failedModel = async () => {
    throw new Error("Simulated Ollama connection failure.");
};

const invalidModel = async () => ({
    mode: "problem_solving",
    approaches: "invalid"
});

// Test 1: Ollama unavailable.
const offlineResult = await analyzeDSARequest(
    twoSumQuestion,
    { generateJSON: failedModel }
);

assert.equal(
    offlineResult.analysisProvider,
    "deterministic_fallback"
);

assert.equal(
    offlineResult.recommendationStatus,
    "curated"
);

assert.ok(
    offlineResult.approaches.some(
        approach => approach.pattern === "Hashing"
    )
);

assert.ok(
    offlineResult.recommendedDataStructures.includes("Hash Map")
);

console.log("PASS: Two Sum works when Ollama is unavailable.");

// Test 2: Ollama returns invalid JSON structure.
const invalidResult = await analyzeDSARequest(
    twoSumQuestion,
    { generateJSON: invalidModel }
);

assert.equal(
    invalidResult.analysisProvider,
    "deterministic_fallback"
);

assert.equal(
    invalidResult.recommendationStatus,
    "curated"
);

assert.ok(
    invalidResult.approaches.some(
        approach => approach.pattern === "Hashing"
    )
);

console.log("PASS: Invalid AI output activates curated fallback.");

// Test 3: Successful AI response still goes through integration.
const validModel = async () => ({
    mode: "problem_solving",
    requestSummary: "Find two numbers that sum to the target.",
    keywords: ["pair sum"],
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
                    reason: "Stores the input."
                }
            ]
        }
    ],
    requestedDataStructures: [],
    reasoning: "AI analysis.",
    confidence: 0.9,
    requiresClarification: false,
    clarificationQuestion: ""
});

const onlineResult = await analyzeDSARequest(
    twoSumQuestion,
    { generateJSON: validModel }
);

assert.equal(onlineResult.analysisProvider, "qwen");
assert.equal(onlineResult.recommendationStatus, "curated");

assert.ok(
    onlineResult.approaches.some(
        approach => approach.pattern === "Hashing"
    )
);

console.log("PASS: Valid AI response retains deterministic verification.");

// Test 4: No matching rule and unavailable AI must not fabricate.
const unknownResult = await analyzeDSARequest(
    "Explain the history of fictional spacecraft.",
    { generateJSON: failedModel }
);

assert.equal(
    unknownResult.recommendationStatus,
    "no_curated_match"
);

assert.equal(unknownResult.approaches.length, 0);

console.log("PASS: Unmatched requests receive no fabricated approach.");

console.log("\nANALYZER FALLBACK TESTS PASSED.");
