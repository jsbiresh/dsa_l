import assert from "node:assert/strict";
import { PATTERNS } from "../js/registry/pattern-registry.js";

const TEST_PATTERN =
    PATTERNS.find(pattern => /^(BFS|Breadth[- ]First Search|Graph Traversal)$/i.test(pattern))
    ?? PATTERNS[0];

if (!TEST_PATTERN) {
    throw new Error("Pattern Registry contains no registered patterns.");
}

import {
    validateVisualizationPlan
} from "../js/visualization/visualization-plan.js";

import {
    createExecutionTrace
} from "../js/visualization/visualization-runtime.js";

import {
    StateRecorder
} from "../js/core/state-recorder.js";

const visualizations = [
    {
        id: "array-main",
        structure: "Array",
        visualizerId: "array",
        initialState: {
            array: [
                { id: "a1", value: 8 },
                { id: "a2", value: 3 }
            ]
        }
    },
    {
        id: "list-main",
        structure: "Linked List",
        visualizerId: "linked-list",
        initialState: {
            headId: "n1",
            nodes: [
                { id: "n1", value: 8, nextId: "n2" },
                { id: "n2", value: 3, nextId: null }
            ]
        }
    },
    {
        id: "tree-main",
        structure: "Binary Tree",
        visualizerId: "tree",
        initialState: {
            rootId: "t1",
            nodes: [
                {
                    id: "t1",
                    value: 8,
                    leftId: "t2",
                    rightId: "t3"
                },
                {
                    id: "t2",
                    value: 3,
                    leftId: null,
                    rightId: null
                },
                {
                    id: "t3",
                    value: 12,
                    leftId: null,
                    rightId: null
                }
            ]
        }
    },
    {
        id: "graph-main",
        structure: "Graph",
        visualizerId: "graph",
        initialState: {
            vertices: [
                { id: "v1", label: "A" },
                { id: "v2", label: "B" }
            ],
            edges: [
                {
                    id: "e1",
                    from: "v1",
                    to: "v2",
                    directed: true
                }
            ]
        }
    }
];

const firstStates = structuredClone(
    Object.fromEntries(
        visualizations.map(item => [
            item.id,
            {
                operation: "render",
                state: item.initialState,
                metadata: {}
            }
        ])
    )
);

const updatedStates = structuredClone(firstStates);

updatedStates["array-main"].state.array[0].value = 3;
updatedStates["list-main"].state.nodes[0].value = 3;
updatedStates["tree-main"].state.nodes[1].value = 8;
updatedStates["graph-main"].metadata.visitedVertexIds = ["v1"];

const rawPlan = {
    schemaVersion: 1,

    selectedApproach: {
        pattern: TEST_PATTERN,
        applicability: "direct",
        reason: "Breadth-first exploration visits adjacent vertices.",
        conditions: []
    },

    complexity: {
        time: "O(V + E)",
        space: "O(V)"
    },

    input: {
        source: "provided",
        parameters: {},
        constraints: []
    },

    code: {
        language: "javascript",
        source: [
            "function traverse(graph) {",
            "  return graph;",
            "}"
        ].join("\n")
    },

    visualizations,

    steps: [
        {
            action: "INITIAL_VISIT",
            codeLine: 1,
            explanation: "Begin processing the first vertex.",
            variables: {
                currentVertex: "A",
                visitedCount: 1
            },
            metrics: {
                visits: 1
            },
            visualStates: firstStates
        },
        {
            action: "UPDATE_STATE",
            codeLine: 1,
            explanation: "The execution advances to the updated state.",
            variables: {
                currentVertex: "B",
                visitedCount: 2
            },
            metrics: {
                visits: 2
            },
            visualStates: updatedStates
        }
    ],

    confidence: 0.99
};

// 1. Validate the complete plan.
const validated = validateVisualizationPlan(rawPlan);

assert.equal(validated.visualizations.length, 4);

// 2. Convert it into an execution trace.
const trace = createExecutionTrace(validated);

assert.equal(trace.steps.length, 2);
assert.equal(Object.keys(trace.steps[0].visualStates).length, 4);

// 3. Record initial and subsequent snapshots.
const recorder = new StateRecorder();

recorder.reset(
    trace.initialState,
    trace.initialVisualStates
);

trace.steps.forEach(step => recorder.record(step));

// 4. Rewind to the initial snapshot.
const initial = recorder.restart();

assert.equal(initial.codeLine, null);
assert.equal(initial.visualStates["list-main"].state.nodes[0].value, 8);

// 5. Move forward and inspect every visualization.
const forward = recorder.next();

assert.equal(forward.codeLine, 1);
assert.equal(forward.variables.currentVertex, "A");

assert.equal(forward.visualStates["array-main"].state.array[0].value, 8);
assert.equal(forward.visualStates["list-main"].state.nodes[0].value, 8);

// 6. Advance to the second snapshot.
const second = recorder.next();

assert.equal(second.variables.currentVertex, "B");
assert.equal(second.visualStates["array-main"].state.array[0].value, 3);
assert.deepEqual(
    second.visualStates["graph-main"].metadata.visitedVertexIds,
    ["v1"]
);

// 7. Go backwards and verify exact restoration.
const backward = recorder.previous();

assert.equal(backward.variables.currentVertex, "A");
assert.equal(backward.visualStates["array-main"].state.array[0].value, 8);
assert.equal(backward.visualStates["list-main"].state.nodes[0].value, 8);
assert.equal(backward.visualStates["tree-main"].state.nodes[1].value, 3);

// 8. Verify independent snapshot copies.
second.visualStates["array-main"].state.array[0].value = 999;

assert.equal(
    recorder.getCurrentStep().visualStates["array-main"].state.array[0].value,
    8
);

console.log("PASS: Four visualization types validated.");
console.log("PASS: Multi-structure execution trace generated.");
console.log("PASS: Initial and forward snapshots recorded.");
console.log("PASS: Backward navigation restores all structures.");
console.log("PASS: Variables and code-line history preserved.");
console.log("PASS: Historical snapshots are independently cloned.");
console.log("\nMULTI-VISUALIZATION INTEGRATION TEST PASSED.");
