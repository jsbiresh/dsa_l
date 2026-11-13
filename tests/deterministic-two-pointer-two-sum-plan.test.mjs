import assert from "node:assert/strict";

import {
    createVisualizationPlan
} from "../js/ai/visualization-planner.js";

import {
    createExecutionTrace
} from "../js/visualization/visualization-runtime.js";

import {
    generateRuleBasedRecommendations
} from "../js/intelligence/recommendation-engine.js";

const question =
    "Given nums = [2, 7, 11, 15], find two numbers whose sum is 9.";

// Obtain a valid curated Two Pointers selection from a problem
// that explicitly guarantees sorted input.
const recommendationQuestion =
    "Given a sorted array nums = [2, 7, 11, 15], find two numbers whose sum is 9.";

const analysis =
    generateRuleBasedRecommendations(recommendationQuestion);

const selectedApproach = analysis.approaches.find(
    approach => approach.pattern === "Two Pointers"
);

assert.ok(
    selectedApproach,
    "The recommendation engine must recommend Two Pointers for this sorted input."
);

let ollamaCalls = 0;

const plan = await createVisualizationPlan(
    {
        question,
        analysis,
        selectedApproach
    },
    {
        generateJSON: async () => {
            ollamaCalls++;
            throw new Error("Simulated Ollama HTTP 500.");
        }
    }
);

assert.equal(ollamaCalls, 0);
assert.equal(plan.planningSource, "deterministic_fallback");
assert.equal(plan.selectedApproach.pattern, "Two Pointers");

assert.deepEqual(
    plan.visualizations.map(item => item.visualizerId),
    ["array"]
);

assert.deepEqual(plan.input.parameters.nums, [2, 7, 11, 15]);
assert.equal(plan.visualizations[0].initialState.array.length, 4);

const trace = createExecutionTrace(plan);
const finalStep = trace.steps.at(-1);

assert.equal(finalStep.action, "COMPLETE");
assert.deepEqual(finalStep.variables.result, [0, 1]);
assert.deepEqual(finalStep.variables.resultValues, [2, 7]);
assert.equal(finalStep.variables.sum, 9);

assert.deepEqual(
    finalStep.visualStates["array-main"].metadata.activeIndexes,
    [0, 1]
);

assert.ok(trace.steps.some(step => step.action === "MOVE_RIGHT_POINTER"));
assert.ok(trace.steps.some(step => step.action === "COMPARE_SUM"));

console.log("PASS: Real recommendation selects Two Pointers.");
console.log("PASS: Two Pointers execution bypasses Ollama.");
console.log("PASS: Explicit four-element input is preserved.");
console.log("PASS: Pointer movements and comparisons are recorded.");
console.log("PASS: Correct indices [0, 1] and values [2, 7] are found.");

await assert.rejects(
    createVisualizationPlan(
        {
            question:
                "Given nums = [2, 11, 7, 15], find two numbers whose sum is 9.",
            analysis,
            selectedApproach
        },
        {
            generateJSON: async () => {
                throw new Error("Ollama should not be called.");
            }
        }
    ),
    /requires a sorted array/
);

console.log("PASS: Unsorted input is rejected for Two Pointers.");
console.log("\nDETERMINISTIC TWO POINTERS TWO SUM TESTS PASSED.");
