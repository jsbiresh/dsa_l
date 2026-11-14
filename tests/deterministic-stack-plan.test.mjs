import test from "node:test";
import assert from "node:assert/strict";

import {
    createVisualizationPlan
} from "../js/ai/visualization-planner.js";

import {
    createExecutionTrace
} from "../js/visualization/visualization-runtime.js";

import {
    buildDeterministicStackPlan
} from "../js/ai/deterministic-stack-plan-builder.js";

const stackApproach = {
    pattern: "Simulation",
    applicability: "direct",
    reason: "Demonstrate the Last-In, First-Out Stack operations.",
    conditions: [],
    dataStructures: [{
        name: "Stack",
        role: "primary",
        reason: "The Stack is the structure being demonstrated."
    }]
};

async function createOfflineStackPlan(question) {
    let qwenCalled = false;

    const plan = await createVisualizationPlan(
        {
            question,
            analysis: {
                approaches: [stackApproach]
            },
            selectedApproach: stackApproach
        },
        {
            generateJSON: async () => {
                qwenCalled = true;
                throw new Error("Qwen must not be called for Stack walkthroughs.");
            }
        }
    );

    assert.equal(qwenCalled, false);
    return plan;
}

test("Stack operation walkthrough bypasses Qwen", async () => {
    const plan = await createOfflineStackPlan(
        "Demonstrate Stack operations: push(10), push(20), peek(), pop(), size(), isEmpty(), isFull()."
    );

    assert.equal(plan.planningSource, "deterministic_fallback");
    assert.equal(plan.selectedApproach.pattern, "Simulation");
    assert.equal(plan.visualizations[0].visualizerId, "stack");
    assert.equal(plan.visualizations[0].structure, "Stack");
    assert.equal(plan.input.source, "provided");
    assert.equal(plan.steps.length, 7);
});

test("Stack operations preserve the requested order and values", async () => {
    const plan = await createOfflineStackPlan(
        "Stack: push(10), push(20), peek(), pop(), size(), isEmpty()."
    );

    assert.deepEqual(
        plan.input.parameters.operations.map(item => item.operation),
        ["push", "push", "peek", "pop", "size", "isEmpty"]
    );

    assert.deepEqual(
        plan.input.parameters.operations
            .filter(item => item.operation === "push")
            .map(item => item.value),
        [10, 20]
    );
});

test("Stack snapshots track topIndex, size and item values", async () => {
    const plan = await createOfflineStackPlan(
        "Stack: push(10), push(20), pop()."
    );

    const states = plan.steps.map(
        step => step.visualStates["stack-main"].state
    );

    assert.equal(states[0].size, 1);
    assert.equal(states[0].topIndex, 0);

    assert.equal(states[1].size, 2);
    assert.equal(states[1].topIndex, 1);
    assert.equal(states[1].items[1].value, 20);

    assert.equal(states[2].size, 1);
    assert.equal(states[2].topIndex, 0);
    assert.equal(states[2].items[0].value, 10);
});

test("Stack execution trace preserves snapshots and animation events", async () => {
    const plan = await createOfflineStackPlan(
        "Stack: push(10), push(20), pop()."
    );

    const trace = createExecutionTrace(plan);

    assert.equal(trace.steps.length, 3);

    assert.equal(
        trace.steps[0].animationEvents[0].type,
        "stack.push"
    );

    assert.equal(
        trace.steps[1].animationEvents[0].type,
        "stack.push"
    );

    assert.equal(
        trace.steps[2].animationEvents[0].type,
        "stack.pop"
    );

    assert.equal(
        trace.steps[2].visualStates["stack-main"].state.size,
        1
    );

    assert.equal(
        trace.steps[2].visualStates["stack-main"].state.items[0].value,
        10
    );
});

test("Stack overflow produces an error step without changing the Stack", async () => {
    const plan = await createOfflineStackPlan(
        "Stack capacity 1: push(10), push(20)."
    );

    const first = plan.steps[0].visualStates["stack-main"].state;
    const secondStep = plan.steps[1];

    const afterRejectedPush =
        secondStep.visualStates["stack-main"].state;

    assert.equal(first.size, 1);
    assert.equal(afterRejectedPush.size, 1);
    assert.deepEqual(afterRejectedPush, first);

    assert.equal(
        secondStep.visualStates["stack-main"].operation,
        "overflow"
    );

    assert.equal(
        secondStep.animationEvents[0].type,
        "stack.overflow"
    );

    assert.equal(
        secondStep.variables.statusCode,
        "STACK_OVERFLOW"
    );
});

test("Stack underflow produces an error step without changing an empty Stack", async () => {
    const plan = await createOfflineStackPlan(
        "Demonstrate Stack pop() with capacity 3."
    );

    const step = plan.steps[0];

    assert.equal(
        step.visualStates["stack-main"].operation,
        "underflow"
    );

    assert.deepEqual(
        step.visualStates["stack-main"].state,
        plan.visualizations[0].initialState
    );

    assert.equal(
        step.animationEvents[0].type,
        "stack.underflow"
    );

    assert.equal(
        step.variables.statusCode,
        "STACK_UNDERFLOW"
    );
});

test("Stack natural push syntax accepts numeric values without parentheses", async () => {
    const plan = await createOfflineStackPlan(
        "Stack push 10, push 25, pop."
    );

    assert.deepEqual(
        plan.input.parameters.operations
            .filter(item => item.operation === "push")
            .map(item => item.value),
        [10, 25]
    );

    assert.equal(
        plan.steps[2].visualStates["stack-main"].state.items[0].value,
        10
    );
});

test("Stack capacity is respected", async () => {
    const plan = await createOfflineStackPlan(
        "Stack capacity 2: push(10), push(20), isFull()."
    );

    assert.equal(plan.input.parameters.capacity, 2);

    const finalStep = plan.steps.at(-1);

    assert.equal(
        finalStep.variables.result,
        true
    );
});

test("Generic Stack tutorial creates a deterministic sample walkthrough", async () => {
    const plan = await createOfflineStackPlan(
        "Explain how a Stack works."
    );

    assert.equal(plan.input.source, "generated");
    assert.equal(plan.input.parameters.capacity, 3);
    assert.deepEqual(
        plan.input.parameters.operations.map(item => item.operation),
        [
            "push",
            "push",
            "push",
            "isFull",
            "peek",
            "pop",
            "size",
            "isEmpty"
        ]
    );

    assert.ok(plan.steps.length <= 15);
});

test("Monotonic Stack algorithm requests are not mistaken for basic Stack tutorials", () => {
    const monotonicApproach = {
        ...stackApproach,
        pattern: "Monotonic Stack"
    };

    assert.equal(
        buildDeterministicStackPlan(
            "Explain the Monotonic Stack approach for Next Greater Element.",
            monotonicApproach
        ),
        null
    );
});

test("Stack plan steps have valid code lines and explanatory variables", async () => {
    const plan = await createOfflineStackPlan(
        "Stack: push(10), peek(), pop()."
    );

    const lineCount = plan.code.source.split("\n").length;

    for (const step of plan.steps) {
        assert.ok(step.codeLine >= 0);
        assert.ok(step.codeLine < lineCount);
        assert.equal(typeof step.explanation, "string");
        assert.ok(step.explanation.length > 0);
        assert.equal(typeof step.variables.size, "number");
        assert.equal(typeof step.variables.topIndex, "number");
        assert.equal(typeof step.variables.operationSucceeded, "boolean");
    }
});

test("Invalid Stack capacity is not accepted by the deterministic builder", () => {
    assert.equal(
        buildDeterministicStackPlan(
            "Stack capacity 0: push(10).",
            stackApproach
        ),
        null
    );

    assert.equal(
        buildDeterministicStackPlan(
            "Stack capacity 99: push(10).",
            stackApproach
        ),
        null
    );
});
