import assert from "node:assert/strict";

import { PATTERNS } from "../js/registry/pattern-registry.js";

import {
    validateVisualizationPlan
} from "../js/visualization/visualization-plan.js";

import {
    createExecutionTrace
} from "../js/visualization/visualization-runtime.js";

import {
    StateRecorder
} from "../js/core/state-recorder.js";

import {
    dispatchAnimationEvents
} from "../js/visualization/animation-event-dispatcher.js";


const ARRAY_ID = "array-main";

const visualizations = [
    {
        id: ARRAY_ID,
        structure: "Array",
        visualizerId: "array",
        initialState: {
            array: [
                { id: "item-1", value: 4 },
                { id: "item-2", value: 8 }
            ]
        }
    }
];

const initialVisualStates = {
    [ARRAY_ID]: {
        operation: "render",
        state: {
            array: [
                { id: "item-1", value: 4 },
                { id: "item-2", value: 8 }
            ]
        },
        metadata: {}
    }
};

const eventOne = {
    id: "compare-items",
    schemaVersion: 1,
    type: "array.compare",
    target: {
        visualizationId: ARRAY_ID,
        entityIds: ["item-1", "item-2"]
    },
    animation: {
        kind: "highlight",
        durationMs: 250,
        easing: "ease-in-out"
    },
    payload: {
        leftIndex: 0,
        rightIndex: 1
    }
};

const eventTwo = {
    id: "move-item",
    schemaVersion: 1,
    type: "array.move",
    target: {
        visualizationId: ARRAY_ID,
        entityIds: ["item-1"]
    },
    animation: {
        kind: "move",
        durationMs: 400,
        easing: "ease-out"
    },
    payload: {
        fromIndex: 0,
        toIndex: 1
    }
};


function createPlan(animationEvents, includeEventField = true) {
    const secondStep = {
        action: "COMPARE_ITEMS",
        codeLine: 1,
        explanation: "Compare the two array elements.",
        variables: {
            left: 0,
            right: 1
        },
        metrics: {
            comparisons: 1
        },
        visualStates: structuredClone(initialVisualStates)
    };

    if (includeEventField) {
        secondStep.animationEvents = animationEvents;
    }

    return {
        schemaVersion: 1,
        requestSummary: "Animation event architecture test.",
        selectedApproach: {
            pattern: PATTERNS[0],
            applicability: "direct",
            reason: "A test plan for event preservation.",
            conditions: []
        },
        complexity: {
            time: "O(n)",
            space: "O(1)"
        },
        input: {
            source: "provided",
            parameters: {
                values: [4, 8]
            },
            constraints: []
        },
        code: {
            language: "javascript",
            source: [
                "const values = [4, 8];",
                "values[0] < values[1];"
            ].join("\n")
        },
        visualizations: structuredClone(visualizations),
        steps: [
            {
                action: "INITIALIZE_ARRAY",
                codeLine: 0,
                explanation: "Initialize the array.",
                variables: {
                    length: 2
                },
                metrics: {},
                visualStates: structuredClone(initialVisualStates)
            },
            secondStep
        ],
        confidence: 1
    };
}


// --------------------------------------------------
// 1. Valid events survive plan validation.
// --------------------------------------------------

const rawEvents = [
    structuredClone(eventOne),
    structuredClone(eventTwo)
];

const validatedPlan = validateVisualizationPlan(
    createPlan(rawEvents)
);

assert.equal(validatedPlan.steps[1].animationEvents.length, 2);

assert.deepEqual(
    validatedPlan.steps[1].animationEvents.map(event => event.id),
    ["compare-items", "move-item"]
);

assert.equal(
    validatedPlan.steps[1].animationEvents[0].target.visualizationId,
    ARRAY_ID
);

console.log("PASS: Ordered animation events survive plan validation.");


// --------------------------------------------------
// 2. Legacy plans without events remain valid.
// --------------------------------------------------

const legacyPlan = validateVisualizationPlan(
    createPlan(undefined, false)
);

assert.deepEqual(
    legacyPlan.steps[1].animationEvents,
    []
);

console.log("PASS: Existing plans without animation events remain compatible.");


// --------------------------------------------------
// 3. Invalid events are rejected.
// --------------------------------------------------

assert.throws(
    () => validateVisualizationPlan(
        createPlan([
            {
                ...eventOne,
                target: {
                    visualizationId: "unknown-visualization"
                }
            }
        ])
    ),
    /unknown visualization/
);

assert.throws(
    () => validateVisualizationPlan(
        createPlan([
            {
                ...eventOne,
                type: "invalid"
            }
        ])
    ),
    /Invalid animation event type/
);

assert.throws(
    () => validateVisualizationPlan(
        createPlan([
            {
                ...eventOne,
                animation: {
                    kind: "move",
                    durationMs: 20000
                }
            }
        ])
    ),
    /duration must be between/
);

assert.throws(
    () => validateVisualizationPlan(
        createPlan([
            eventOne,
            {
                ...eventTwo,
                id: eventOne.id
            }
        ])
    ),
    /Duplicate animation event ID/
);

assert.throws(
    () => validateVisualizationPlan(
        createPlan(
            Array.from(
                { length: 33 },
                (_, index) => ({
                    ...eventOne,
                    id: `event-${index}`
                })
            )
        )
    ),
    /cannot contain more than 32/
);

console.log("PASS: Invalid targets, types, durations, IDs and event counts are rejected.");


// --------------------------------------------------
// 4. Runtime carries events into the execution trace.
// --------------------------------------------------

const trace = createExecutionTrace(validatedPlan);

assert.deepEqual(
    trace.steps[1].animationEvents.map(event => event.type),
    ["array.compare", "array.move"]
);

console.log("PASS: Visualization runtime preserves animation events.");


// --------------------------------------------------
// 5. StateRecorder preserves independent event history.
// --------------------------------------------------

const recorder = new StateRecorder();

recorder.reset(
    trace.initialState,
    trace.initialVisualStates
);

trace.steps.forEach(step => recorder.record(step));

const initial = recorder.restart();

assert.deepEqual(initial.animationEvents, []);

const first = recorder.next();

assert.equal(first.action, "INITIALIZE_ARRAY");
assert.deepEqual(first.animationEvents, []);

const second = recorder.next();

assert.equal(second.action, "COMPARE_ITEMS");

assert.deepEqual(
    second.animationEvents.map(event => event.id),
    ["compare-items", "move-item"]
);

const previous = recorder.previous();

assert.equal(previous.action, "INITIALIZE_ARRAY");
assert.deepEqual(previous.animationEvents, []);

const forwardAgain = recorder.next();

assert.deepEqual(
    forwardAgain.animationEvents.map(event => event.id),
    ["compare-items", "move-item"]
);

console.log("PASS: Previous and Next restore the correct event history.");


// --------------------------------------------------
// 6. Returned history cannot mutate recorded events.
// --------------------------------------------------

forwardAgain.animationEvents[0].payload.leftIndex = 999;
forwardAgain.animationEvents.push({
    id: "tampered-event"
});

const protectedHistory = recorder.getCurrentStep();

assert.equal(
    protectedHistory.animationEvents[0].payload.leftIndex,
    0
);

assert.equal(protectedHistory.animationEvents.length, 2);

console.log("PASS: Recorded animation history is protected from external mutation.");


// --------------------------------------------------
// 7. Unsupported events safely fall back to snapshots.
// --------------------------------------------------

const fallbackCalls = [];

const fallbackRenderer = {
    canAnimateEvents() {
        return false;
    },

    async animateEvents() {
        throw new Error("This method must not be called.");
    },

    async render(state, metadata, options) {
        fallbackCalls.push({
            state,
            metadata,
            options
        });
    }
};

const fallbackResult = await dispatchAnimationEvents(
    fallbackRenderer,
    {
        events: [eventOne],
        state: initialVisualStates[ARRAY_ID].state,
        metadata: {},
        options: {
            animate: true
        }
    }
);

assert.equal(fallbackResult.mode, "snapshot");
assert.equal(fallbackResult.handled, false);
assert.equal(fallbackCalls.length, 1);
assert.equal(fallbackCalls[0].options.animate, true);

console.log("PASS: Unsupported animation events fall back to snapshot rendering.");


// --------------------------------------------------
// 8. Supported events animate and reconcile snapshots.
// --------------------------------------------------

const supportedCalls = [];

const supportedRenderer = {
    canAnimateEvents(events) {
        return events.every(event => event.type === "array.compare");
    },

    async animateEvents(events, context) {
        supportedCalls.push({
            type: "animation",
            events,
            context
        });

        return true;
    },

    async render(state, metadata, options) {
        supportedCalls.push({
            type: "reconcile",
            state,
            metadata,
            options
        });
    }
};

const supportedResult = await dispatchAnimationEvents(
    supportedRenderer,
    {
        events: [eventOne],
        state: initialVisualStates[ARRAY_ID].state,
        metadata: {
            activeIndexes: [0, 1]
        },
        options: {
            animate: true
        }
    }
);

assert.equal(supportedResult.mode, "events");
assert.equal(supportedResult.handled, true);

assert.deepEqual(
    supportedCalls.map(call => call.type),
    ["animation", "reconcile"]
);

assert.equal(
    supportedCalls[1].options.animate,
    false
);

console.log("PASS: Supported events execute before authoritative snapshot reconciliation.");


// --------------------------------------------------
// 9. Failed event animations recover through snapshots.
// --------------------------------------------------

let recoveryRenderCount = 0;

const failingRenderer = {
    canAnimateEvents() {
        return true;
    },

    async animateEvents() {
        throw new Error("Simulated renderer animation failure.");
    },

    async render() {
        recoveryRenderCount++;
    }
};

const recoveryResult = await dispatchAnimationEvents(
    failingRenderer,
    {
        events: [eventOne],
        state: initialVisualStates[ARRAY_ID].state,
        metadata: {},
        options: {
            animate: true
        }
    }
);

assert.equal(recoveryResult.mode, "snapshot");
assert.equal(recoveryRenderCount, 1);
assert.match(recoveryResult.error.message, /Simulated renderer/);

console.log("PASS: Failed event animations recover through snapshot rendering.");

console.log("\nANIMATION EVENT ARCHITECTURE TESTS PASSED.");
