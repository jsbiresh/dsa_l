import test from "node:test";
import assert from "node:assert/strict";

import { createVisualizationPlan } from "../js/ai/visualization-planner.js";
import { createExecutionTrace } from "../js/visualization/visualization-runtime.js";

const sortingApproach = {
    pattern: "Sorting",
    applicability: "direct",
    reason: "Sort the numeric array.",
    conditions: [],
    dataStructures: [
        {
            name: "Array",
            role: "primary",
            reason: "The input is an array."
        }
    ]
};

async function createOfflinePlan(question) {
    return createVisualizationPlan(
        {
            question,
            analysis: {
                approaches: [sortingApproach]
            },
            selectedApproach: sortingApproach
        },
        {
            generateJSON: async () => {
                throw new Error("Simulated Qwen planning failure");
            }
        }
    );
}

test("local fallback creates an 8-element Bubble Sort trace", async () => {
    const plan = await createOfflinePlan(
        "Sort an array with 8 elements in ascending order."
    );

    assert.equal(plan.planningSource, "deterministic_fallback");
    assert.equal(plan.selectedApproach.pattern, "Sorting");
    assert.equal(plan.input.source, "generated");
    assert.equal(plan.input.parameters.array.length, 8);
    assert.deepEqual(
        plan.visualizations[0].initialState.array.map(item => item.value),
        plan.input.parameters.array
    );

    assert.ok(plan.steps.length > 1);
    assert.ok(plan.steps.some(step =>
        step.visualStates["array-main"].operation === "compare"
    ));
    assert.ok(plan.steps.some(step =>
        step.visualStates["array-main"].operation === "swap"
    ));
    assert.ok(plan.steps.some(step =>
        step.visualStates["array-main"].operation === "markSorted"
    ));

    const trace = createExecutionTrace(plan);
    const finalValues = trace.steps.at(-1)
        .visualStates["array-main"].state.array
        .map(item => item.value);

    assert.deepEqual(finalValues, [...finalValues].sort((a, b) => a - b));
    assert.equal(trace.steps.length, plan.steps.length);
});

test("local fallback preserves explicit values and descending order", async () => {
    const plan = await createOfflinePlan(
        "Sort this array in descending order: [3, 1, 4, 2]"
    );

    assert.equal(plan.input.source, "provided");
    assert.deepEqual(plan.input.parameters.array, [3, 1, 4, 2]);
    assert.equal(plan.input.parameters.order, "descending");
    assert.deepEqual(
        plan.visualizations[0].initialState.array.map(item => item.value),
        [3, 1, 4, 2]
    );

    const trace = createExecutionTrace(plan);
    const finalValues = trace.steps.at(-1)
        .visualStates["array-main"].state.array
        .map(item => item.value);

    assert.deepEqual(finalValues, [4, 3, 2, 1]);
});

test("a 16-element request produces exactly 16 elements", async () => {
    const plan = await createOfflinePlan(
        "Sort an array with 16 elements in ascending order."
    );

    assert.equal(plan.input.parameters.array.length, 16);
    assert.equal(plan.visualizations[0].initialState.array.length, 16);

    const trace = createExecutionTrace(plan);
    const finalValues = trace.steps.at(-1)
        .visualStates["array-main"].state.array
        .map(item => item.value);

    assert.equal(finalValues.length, 16);
    assert.deepEqual(finalValues, [...finalValues].sort((a, b) => a - b));
    assert.ok(trace.steps.length < 250);
});

test("Selection Sort produces a correct execution trace", async () => {
    const approach = {
        ...sortingApproach,
        reason: "Select the next smallest element."
    };

    const plan = await createVisualizationPlan(
        {
            question: "Use Selection Sort ascending: [64, 25, 12, 22, 11]",
            analysis: { approaches: [approach] },
            selectedApproach: approach
        },
        {
            generateJSON: async () => {
                throw new Error("Simulated Qwen planning failure");
            }
        }
    );

    assert.equal(plan.input.parameters.algorithm, "Selection Sort");

    const trace = createExecutionTrace(plan);
    const finalValues = trace.steps.at(-1)
        .visualStates["array-main"].state.array
        .map(item => item.value);

    assert.deepEqual(finalValues, [11, 12, 22, 25, 64]);
    assert.ok(plan.steps.some(step => step.action === "FIND_MINIMUM"));
    assert.ok(plan.steps.some(step => step.action === "PLACE_SELECTED_VALUE"));
});

test("Insertion Sort produces a correct descending execution trace", async () => {
    const approach = {
        ...sortingApproach,
        reason: "Insert each value into its correct position."
    };

    const plan = await createVisualizationPlan(
        {
            question: "Use Insertion Sort descending: [3, 1, 4, 2]",
            analysis: { approaches: [approach] },
            selectedApproach: approach
        },
        {
            generateJSON: async () => {
                throw new Error("Simulated Qwen planning failure");
            }
        }
    );

    assert.equal(plan.input.parameters.algorithm, "Insertion Sort");

    const trace = createExecutionTrace(plan);
    const finalValues = trace.steps.at(-1)
        .visualStates["array-main"].state.array
        .map(item => item.value);

    assert.deepEqual(finalValues, [4, 3, 2, 1]);
    assert.ok(plan.steps.some(step => step.action === "COMPARE_ADJACENT"));
    assert.ok(plan.steps.some(step => step.action === "SHIFT_ELEMENT"));
});

test("Merge Sort produces a correct 8-element ascending trace", async () => {
    const approach = {
        ...sortingApproach,
        reason: "Divide the array and merge sorted halves."
    };

    const plan = await createVisualizationPlan(
        {
            question: "Use Merge Sort ascending on [8, 3, 5, 1, 9, 2, 7, 4]",
            analysis: { approaches: [approach] },
            selectedApproach: approach
        },
        {
            generateJSON: async () => {
                throw new Error("Simulated Qwen planning failure");
            }
        }
    );

    assert.equal(plan.input.parameters.algorithm, "Merge Sort");
    assert.equal(plan.complexity.time, "O(n log n)");
    assert.equal(plan.complexity.space, "O(n)");

    const trace = createExecutionTrace(plan);
    const finalValues = trace.steps.at(-1)
        .visualStates["array-main"].state.array
        .map(item => item.value);

    assert.deepEqual(finalValues, [1, 2, 3, 4, 5, 7, 8, 9]);
    assert.ok(plan.steps.some(step => step.action === "DIVIDE_ARRAY"));
    assert.ok(plan.steps.some(step => step.action === "COMPARE_MERGE_VALUES"));
    assert.ok(plan.steps.some(step => step.action === "WRITE_MERGED_VALUE"));
});

test("Merge Sort supports descending order and 16 elements", async () => {
    const approach = {
        ...sortingApproach,
        reason: "Divide and merge in descending order."
    };

    const plan = await createVisualizationPlan(
        {
            question: "Use Merge Sort descending on 16 elements.",
            analysis: { approaches: [approach] },
            selectedApproach: approach
        },
        {
            generateJSON: async () => {
                throw new Error("Simulated Qwen planning failure");
            }
        }
    );

    assert.equal(plan.input.parameters.array.length, 16);

    const trace = createExecutionTrace(plan);
    const finalValues = trace.steps.at(-1)
        .visualStates["array-main"].state.array
        .map(item => item.value);

    assert.deepEqual(finalValues, [...finalValues].sort((a, b) => b - a));
    assert.ok(trace.steps.length < 250);
});

test("Quick Sort produces a correct ascending execution trace", async () => {
    const approach = {
        ...sortingApproach,
        reason: "Partition around a pivot and recursively sort both sides."
    };

    const plan = await createVisualizationPlan(
        {
            question: "Use Quick Sort ascending on [8, 3, 5, 1, 9, 2, 7, 4]",
            analysis: { approaches: [approach] },
            selectedApproach: approach
        },
        {
            generateJSON: async () => {
                throw new Error("Simulated Qwen planning failure");
            }
        }
    );

    assert.equal(plan.input.parameters.algorithm, "Quick Sort");
    assert.equal(plan.input.parameters.pivotStrategy, "last element (Lomuto)");
    assert.ok(plan.steps.some(step => step.action === "SELECT_PIVOT"));
    assert.ok(plan.steps.some(step => step.action === "PARTITION_COMPARE"));
    assert.ok(plan.steps.some(step => step.action === "PLACE_PIVOT"));

    const trace = createExecutionTrace(plan);
    const finalValues = trace.steps.at(-1)
        .visualStates["array-main"].state.array
        .map(item => item.value);

    assert.deepEqual(finalValues, [1, 2, 3, 4, 5, 7, 8, 9]);
});

test("Quick Sort supports descending order with 16 elements", async () => {
    const approach = {
        ...sortingApproach,
        reason: "Partition the array in descending order."
    };

    const plan = await createVisualizationPlan(
        {
            question: "Use Quick Sort descending on 16 elements.",
            analysis: { approaches: [approach] },
            selectedApproach: approach
        },
        {
            generateJSON: async () => {
                throw new Error("Simulated Qwen planning failure");
            }
        }
    );

    assert.equal(plan.input.parameters.array.length, 16);

    const trace = createExecutionTrace(plan);
    const finalValues = trace.steps.at(-1)
        .visualStates["array-main"].state.array
        .map(item => item.value);

    assert.deepEqual(
        finalValues,
        [...finalValues].sort((a, b) => b - a)
    );
    assert.ok(trace.steps.length < 250);
});

test("Heap Sort produces a correct ascending execution trace", async () => {
    const approach = {
        ...sortingApproach,
        reason: "Build a max heap and repeatedly extract its root."
    };

    const plan = await createVisualizationPlan(
        {
            question: "Use Heap Sort ascending on [8, 3, 5, 1, 9, 2, 7, 4]",
            analysis: { approaches: [approach] },
            selectedApproach: approach
        },
        {
            generateJSON: async () => {
                throw new Error("Simulated Qwen planning failure");
            }
        }
    );

    assert.equal(plan.input.parameters.algorithm, "Heap Sort");
    assert.equal(plan.input.parameters.heapType, "max heap");
    assert.equal(plan.complexity.time, "O(n log n)");
    assert.equal(plan.complexity.space, "O(1)");

    const trace = createExecutionTrace(plan);
    const finalValues = trace.steps.at(-1)
        .visualStates["array-main"].state.array
        .map(item => item.value);

    assert.deepEqual(finalValues, [1, 2, 3, 4, 5, 7, 8, 9]);
    assert.ok(plan.steps.some(step => step.action === "COMPARE_LEFT_CHILD"));
    assert.ok(plan.steps.some(step => step.action === "HEAPIFY_SWAP"));
    assert.ok(plan.steps.some(step => step.action === "EXTRACT_ROOT"));
});

test("Heap Sort supports descending order with 16 elements", async () => {
    const approach = {
        ...sortingApproach,
        reason: "Build a min heap and extract the smallest values."
    };

    const plan = await createVisualizationPlan(
        {
            question: "Use Heap Sort descending on 16 elements.",
            analysis: { approaches: [approach] },
            selectedApproach: approach
        },
        {
            generateJSON: async () => {
                throw new Error("Simulated Qwen planning failure");
            }
        }
    );

    assert.equal(plan.input.parameters.array.length, 16);
    assert.equal(plan.input.parameters.heapType, "min heap");

    const trace = createExecutionTrace(plan);
    const finalValues = trace.steps.at(-1)
        .visualStates["array-main"].state.array
        .map(item => item.value);

    assert.deepEqual(
        finalValues,
        [...finalValues].sort((a, b) => b - a)
    );
    assert.ok(trace.steps.length < 250);
});
