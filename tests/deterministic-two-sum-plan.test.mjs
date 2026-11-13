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
    "Given an integer array nums = [2, 7, 12, 18] and an integer target = 20, return the indices of the two numbers whose sum equals the target. Assume exactly one valid solution exists.";

const ruleAnalysis = generateRuleBasedRecommendations(question);

const selectedApproach = ruleAnalysis.approaches.find(
    approach => approach.pattern === "Hashing"
);

assert.ok(selectedApproach, "Curated Hashing recommendation must exist.");

const analysis = {
    approaches: ruleAnalysis.approaches
};

const plan = await createVisualizationPlan(
    {
        question,
        analysis,
        selectedApproach
    },
    {
        generateJSON: async () => {
            throw new Error("Simulated Ollama HTTP 500.");
        }
    }
);

assert.equal(plan.planningSource, "deterministic_fallback");
assert.equal(plan.selectedApproach.pattern, "Hashing");

assert.deepEqual(
    plan.visualizations.map(item => item.visualizerId),
    ["array", "hash-map"]
);

console.log("PASS: Qwen failure creates a validated deterministic plan.");

const trace = createExecutionTrace(plan);

assert.ok(trace.steps.length >= 5);
assert.ok(trace.steps.every(step => step.visualStates));

console.log("PASS: Execution trace contains complete multi-structure snapshots.");

const finalStep = trace.steps.at(-1);

assert.equal(finalStep.action, "COMPLETE");

assert.deepEqual(finalStep.variables.result, [0, 3]);

assert.equal(
    finalStep.visualStates["hash-main"].state.entries.length,
    3
);

assert.deepEqual(
    finalStep.visualStates["array-main"].metadata.activeIndexes,
    [0, 3]
);

console.log("PASS: Final result is indices [0, 3].");
console.log("PASS: Three Hash Map entries are preserved.");
console.log("PASS: Both renderers receive the final snapshot.");

assert.ok(
    trace.steps.some(
        step =>
            step.action === "INSERT_VALUE" &&
            step.visualStates["hash-main"].state.entries.length === 3
    )
);

console.log("PASS: Collision chain is represented in execution history.");

console.log("\nDETERMINISTIC TWO SUM PLAN TESTS PASSED.");
