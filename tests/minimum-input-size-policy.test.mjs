import test from "node:test";
import assert from "node:assert/strict";

import {
    assertMinimumGeneratedInputSize,
    getVisualizationItemCount
} from "../js/ai/input-size-policy.js";

function createPlan(visualizations) {
    return {
        input: { source: "generated" },
        visualizations
    };
}

test("generated array requires at least 8 elements", () => {
    const plan = createPlan([{
        role: "primary",
        structure: "Array",
        visualizerId: "array",
        initialState: {
            array: [1, 2, 3, 4, 5, 6, 7].map(value => ({ value }))
        }
    }]);

    assert.throws(
        () => assertMinimumGeneratedInputSize(plan, "Sort an array"),
        /at least 8/
    );
});

test("generated array with 8 elements is accepted", () => {
    const plan = createPlan([{
        role: "primary",
        structure: "Array",
        visualizerId: "array",
        initialState: {
            array: Array.from({ length: 8 }, (_, value) => ({ value }))
        }
    }]);

    assert.doesNotThrow(
        () => assertMinimumGeneratedInputSize(plan, "Sort an array")
    );
});

test("explicit array input is preserved even when smaller than 8", () => {
    const plan = createPlan([{
        role: "primary",
        structure: "Array",
        visualizerId: "array",
        initialState: {
            array: [2, 7, 11, 15].map(value => ({ value }))
        }
    }]);

    assert.doesNotThrow(
        () => assertMinimumGeneratedInputSize(
            plan,
            "Given nums = [2, 7, 11, 15], find two numbers."
        )
    );

    assert.equal(plan.visualizations[0].initialState.array.length, 4);
});

test("explicit exact size is preserved", () => {
    const plan = createPlan([{
        role: "primary",
        structure: "Array",
        visualizerId: "array",
        initialState: {
            array: [1, 2, 3, 4].map(value => ({ value }))
        }
    }]);

    assert.doesNotThrow(
        () => assertMinimumGeneratedInputSize(
            plan,
            "Sort an array with exactly 4 elements."
        )
    );
});

test("generated graph requires at least 8 vertices", () => {
    const plan = createPlan([{
        role: "primary",
        structure: "Graph",
        visualizerId: "graph",
        initialState: {
            vertices: Array.from({ length: 7 }, (_, id) => ({ id })),
            edges: []
        }
    }]);

    assert.throws(
        () => assertMinimumGeneratedInputSize(plan, "Run BFS"),
        /at least 8/
    );
});

test("generated linked list with 8 nodes is accepted", () => {
    const plan = createPlan([{
        role: "primary",
        structure: "Linked List",
        visualizerId: "linked-list",
        initialState: {
            nodes: Array.from({ length: 8 }, (_, id) => ({ id }))
        }
    }]);

    assert.doesNotThrow(
        () => assertMinimumGeneratedInputSize(plan, "Reverse a linked list")
    );
});

test("auxiliary structures are not forced to contain 8 initial items", () => {
    const plan = createPlan([
        {
            role: "primary",
            structure: "Array",
            visualizerId: "array",
            initialState: {
                array: Array.from({ length: 8 }, (_, value) => ({ value }))
            }
        },
        {
            role: "support",
            structure: "Hash Map",
            visualizerId: "hash-map",
            initialState: {
                entries: []
            }
        }
    ]);

    assert.doesNotThrow(
        () => assertMinimumGeneratedInputSize(plan, "Run Two Sum")
    );
});

test("matrix counts cells rather than rows", () => {
    const matrix = [
        [1, 2, 3, 4],
        [5, 6, 7, 8]
    ];

    assert.equal(
        getVisualizationItemCount({
            visualizerId: "matrix",
            initialState: { matrix }
        }),
        8
    );
});
