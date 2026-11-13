import assert from "node:assert/strict";

import { PATTERNS } from "../js/registry/pattern-registry.js";

import {
    validateVisualizationPlan,
    VisualizationPlanError
} from "../js/visualization/visualization-plan.js";

const hashingPattern = PATTERNS.find(
    pattern => pattern.toLowerCase().includes("hash")
);

assert.ok(hashingPattern, "Hashing pattern must exist in registry.");

const arrayState = {
    array: [
        { id: "a0", value: 2 },
        { id: "a1", value: 7 },
        { id: "a2", value: 12 },
        { id: "a3", value: 18 }
    ]
};

const emptyHashMap = {
    capacity: 5,
    entries: []
};

const populatedHashMap = {
    capacity: 5,
    entries: [
        { id: "entry-2", key: 2, value: 0 },
        { id: "entry-7", key: 7, value: 1 },
        { id: "entry-12", key: 12, value: 2 }
    ]
};

function createPlan({
    hashOperation = "insert",
    hashState = populatedHashMap,
    hashMetadata = {},
    arrayOperation = "highlight"
} = {}) {
    return {
        schemaVersion: 1,

        requestSummary: "Find two numbers adding up to 20.",

        selectedApproach: {
            pattern: hashingPattern,
            applicability: "direct",
            reason: "A Hash Map provides constant-time average lookup.",
            conditions: []
        },

        complexity: {
            time: "O(n) average",
            space: "O(n)"
        },

        input: {
            source: "provided",
            parameters: {
                nums: [2, 7, 12, 18],
                target: 20
            },
            constraints: []
        },

        code: {
            language: "javascript",
            source: "const seen = new Map();"
        },

        visualizations: [
            {
                id: "array-main",
                structure: "Array",
                visualizerId: "array",
                role: "primary",
                initialState: arrayState
            },
            {
                id: "hash-main",
                structure: "Hash Map",
                visualizerId: "hash-map",
                role: "auxiliary",
                initialState: emptyHashMap
            }
        ],

        steps: [
            {
                action: "HASH_MAP_TEST",
                codeLine: 0,
                explanation: "Validate the Array and Hash Map snapshots.",
                variables: {
                    target: 20
                },
                visualStates: {
                    "array-main": {
                        operation: arrayOperation,
                        state: arrayState,
                        metadata: {
                            activeIndexes: [0]
                        }
                    },

                    "hash-main": {
                        operation: hashOperation,
                        state: hashState,
                        metadata: hashMetadata
                    }
                }
            }
        ]
    };
}

// Both visualizers must be accepted together.
const validated = validateVisualizationPlan(createPlan());

assert.equal(validated.visualizations.length, 2);
assert.equal(validated.visualizations[1].visualizerId, "hash-map");

console.log("PASS: Array + Hash Map plan accepted.");

// Every registered Hash Map operation must validate.
for (const operation of [
    "render",
    "hash",
    "lookup",
    "insert",
    "update",
    "delete",
    "complete"
]) {
    const result = validateVisualizationPlan(
        createPlan({ hashOperation: operation })
    );

    assert.equal(
        result.steps[0].visualStates["hash-main"].operation,
        operation
    );
}

console.log("PASS: All seven Hash Map operations accepted.");

// Invalid capacity rejected.
assert.throws(
    () => validateVisualizationPlan(
        createPlan({
            hashState: {
                capacity: 0,
                entries: []
            }
        })
    ),
    VisualizationPlanError
);

console.log("PASS: Invalid Hash Map capacity rejected.");

// Duplicate Hash Map keys rejected.
assert.throws(
    () => validateVisualizationPlan(
        createPlan({
            hashState: {
                capacity: 5,
                entries: [
                    { id: "e1", key: 2, value: 0 },
                    { id: "e2", key: 2, value: 1 }
                ]
            }
        })
    ),
    VisualizationPlanError
);

console.log("PASS: Duplicate Hash Map keys rejected.");

// Invalid operation rejected.
assert.throws(
    () => validateVisualizationPlan(
        createPlan({ hashOperation: "sort" })
    ),
    error =>
        error instanceof VisualizationPlanError &&
        error.code === "UNSUPPORTED_OPERATION"
);

console.log("PASS: Unsupported Hash Map operation rejected.");

// Hash Map entries must not be silently discarded.
const collisionPlan = validateVisualizationPlan(
    createPlan({
        hashOperation: "insert",
        hashState: populatedHashMap,
        hashMetadata: {
            activeBucketIndex: 2,
            collisionBucketIndex: 2,
            insertedEntryIds: ["entry-12"]
        }
    })
);

assert.equal(
    collisionPlan.steps[0]
        .visualStates["hash-main"]
        .state.entries.length,
    3
);

console.log("PASS: Three colliding entries survive plan validation.");

console.log("\nHASH MAP PLAN VALIDATION TESTS PASSED.");
