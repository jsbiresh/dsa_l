import test from "node:test";
import assert from "node:assert/strict";

import { analyzeDSARequest } from "../js/ai/problem-analyzer.js";
import { createVisualizationPlan } from "../js/ai/visualization-planner.js";
import { createExecutionTrace } from "../js/visualization/visualization-runtime.js";

async function prepareSearch(question) {
    const analysis = await analyzeDSARequest(question, {
        generateJSON: async () => {
            throw new Error("Qwen must not be needed for a named search algorithm.");
        }
    });

    assert.equal(analysis.analysisProvider, "deterministic_fallback");
    assert.equal(analysis.primaryPattern, "Searching");

    const selectedApproach = analysis.approaches[0];

    const plan = await createVisualizationPlan(
        { question, analysis, selectedApproach },
        {
            generateJSON: async () => {
                throw new Error("Local search planner should handle this request.");
            }
        }
    );

    assert.equal(plan.planningSource, "deterministic_fallback");

    return {
        plan,
        trace: createExecutionTrace(plan)
    };
}

const cases = [
    {
        name: "Linear Search finds the first element",
        question: "Use Linear Search to find target 8 in [8, 3, 5, 1].",
        algorithm: "Linear Search",
        expected: 0
    },
    {
        name: "Linear Search finds a middle element",
        question: "Use Linear Search to find target 7 in [8, 3, 5, 1, 9, 2, 7, 4].",
        algorithm: "Linear Search",
        expected: 6
    },
    {
        name: "Linear Search reports an absent target",
        question: "Use Linear Search to find target 6 in [8, 3, 5, 1].",
        algorithm: "Linear Search",
        expected: -1
    },
    {
        name: "Binary Search finds a target in ascending order",
        question: "Use Binary Search to find target 7 in [1, 3, 5, 7, 9, 11].",
        algorithm: "Binary Search",
        expected: 3
    },
    {
        name: "Binary Search finds a target in descending order",
        question: "Use Binary Search to find target 7 in [11, 9, 7, 5, 3, 1] in descending order.",
        algorithm: "Binary Search",
        expected: 2
    },
    {
        name: "Binary Search reports an absent target",
        question: "Use Binary Search to find target 6 in [1, 3, 5, 7, 9, 11].",
        algorithm: "Binary Search",
        expected: -1
    }
];

for (const item of cases) {
    test(item.name, async () => {
        const { plan, trace } = await prepareSearch(item.question);

        assert.equal(plan.input.parameters.algorithm, item.algorithm);
        assert.equal(plan.input.parameters.expectedResult, item.expected);
        assert.equal(trace.steps.at(-1).variables.result, item.expected);
        assert.ok(trace.steps.length > 1);
        assert.ok(trace.steps.length <= 250);
        assert.ok(trace.steps.at(-1).visualStates["array-main"]);
    });
}

test("Binary Search rejects unsorted input", async () => {
    const question = "Use Binary Search to find target 5 in [8, 3, 5, 1, 9].";

    const analysis = await analyzeDSARequest(question, {
        generateJSON: async () => {
            throw new Error("Qwen must not be needed.");
        }
    });

    await assert.rejects(
        () => createVisualizationPlan(
            {
                question,
                analysis,
                selectedApproach: analysis.approaches[0]
            },
            {
                generateJSON: async () => {
                    throw new Error("Local search planner should handle this request.");
                }
            }
        ),
        /already sorted/
    );
});
