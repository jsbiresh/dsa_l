import test from "node:test";
import assert from "node:assert/strict";

import { analyzeDSARequest } from "../js/ai/problem-analyzer.js";
import { createVisualizationPlan } from "../js/ai/visualization-planner.js";
import { createExecutionTrace } from "../js/visualization/visualization-runtime.js";

async function prepareBound(question) {
    const analysis = await analyzeDSARequest(question, {
        generateJSON: async () => {
            throw new Error("Qwen must not be needed for a named bound algorithm.");
        }
    });

    assert.equal(analysis.analysisProvider, "deterministic_fallback");
    assert.equal(analysis.primaryPattern, "Searching");

    const plan = await createVisualizationPlan(
        {
            question,
            analysis,
            selectedApproach: analysis.approaches[0]
        },
        {
            generateJSON: async () => {
                throw new Error("Local bound planner should handle this request.");
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
        name: "Lower Bound finds the first duplicate",
        question: "Use Lower Bound to find target 2 in [1, 2, 2, 2, 4, 5].",
        algorithm: "Lower Bound",
        expected: 1,
        found: true
    },
    {
        name: "Upper Bound finds the position after duplicates",
        question: "Use Upper Bound to find target 2 in [1, 2, 2, 2, 4, 5].",
        algorithm: "Upper Bound",
        expected: 4,
        found: true
    },
    {
        name: "Lower Bound returns zero when target is smaller than all values",
        question: "Use Lower Bound to find target 1 in [2, 3, 4, 5].",
        algorithm: "Lower Bound",
        expected: 0,
        found: false
    },
    {
        name: "Upper Bound returns array length when target is larger than all values",
        question: "Use Upper Bound to find target 8 in [2, 3, 4, 5].",
        algorithm: "Upper Bound",
        expected: 4,
        found: false
    },
    {
        name: "Lower Bound returns insertion position for an absent value",
        question: "Use Lower Bound to find target 4 in [1, 3, 5, 7].",
        algorithm: "Lower Bound",
        expected: 2,
        found: false
    },
    {
        name: "Upper Bound handles a single matching value",
        question: "Use Upper Bound to find target 5 in [5].",
        algorithm: "Upper Bound",
        expected: 1,
        found: true
    },
    {
        name: "Lower Bound handles a target greater than every value",
        question: "Use Lower Bound to find target 9 in [1, 3, 5, 7].",
        algorithm: "Lower Bound",
        expected: 4,
        found: false
    }
];

for (const item of cases) {
    test(item.name, async () => {
        const { plan, trace } = await prepareBound(item.question);

        assert.equal(plan.input.parameters.algorithm, item.algorithm);
        assert.equal(plan.input.parameters.expectedResult, item.expected);
        assert.equal(plan.input.parameters.found, item.found);

        const finalStep = trace.steps.at(-1);

        assert.equal(finalStep.variables.result, item.expected);
        assert.equal(finalStep.variables.insertionIndex, item.expected);
        assert.equal(finalStep.variables.found, item.found);

        assert.ok(trace.steps.length > 1);
        assert.ok(trace.steps.length <= 250);
        assert.ok(finalStep.visualStates["array-main"]);
    });
}

test("Lower Bound rejects an unsorted array", async () => {
    const question = "Use Lower Bound to find target 3 in [1, 5, 2, 7].";

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
                    throw new Error("Local bound planner should handle this request.");
                }
            }
        ),
        /ascending sorted array/
    );
});
