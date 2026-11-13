import test from "node:test";
import assert from "node:assert/strict";

import { analyzeDSARequest } from "../js/ai/problem-analyzer.js";
import { createVisualizationPlan } from "../js/ai/visualization-planner.js";
import { createExecutionTrace } from "../js/visualization/visualization-runtime.js";

const algorithms = [
    "Bubble Sort",
    "Selection Sort",
    "Insertion Sort",
    "Merge Sort",
    "Quick Sort",
    "Heap Sort"
];

const input = [8, 3, 5, 1, 9, 2, 7, 4];
const expected = [...input].sort((a, b) => a - b);

for (const algorithm of algorithms) {
    test(`${algorithm}: analyzer through deterministic execution trace`, async () => {
        const question =
            `Use ${algorithm} to sort [${input.join(", ")}] in ascending order.`;

        const analysis = await analyzeDSARequest(question, {
            generateJSON: async () => {
                throw new Error("Qwen must not be needed for a named sorting algorithm.");
            }
        });

        assert.equal(analysis.primaryPattern, "Sorting");
        assert.equal(analysis.analysisProvider, "deterministic_fallback");
        assert.ok(
            analysis.approaches.some(approach =>
                approach.dataStructures.some(item => item.name === "Array")
            )
        );

        const selectedApproach = analysis.approaches[0];

        const plan = await createVisualizationPlan(
            { question, analysis, selectedApproach },
            {
                generateJSON: async () => {
                    throw new Error("Local planner should handle this request.");
                }
            }
        );

        assert.equal(plan.planningSource, "deterministic_fallback");
        assert.equal(plan.input.parameters.algorithm, algorithm);

        const trace = createExecutionTrace(plan);
        const finalValues = trace.steps.at(-1)
            .visualStates["array-main"].state.array
            .map(item => item.value);

        assert.deepEqual(finalValues, expected);
        assert.ok(trace.steps.length > 1);
        assert.ok(trace.steps.length <= 250);
    });
}
