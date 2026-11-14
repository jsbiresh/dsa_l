import test from "node:test";
import assert from "node:assert/strict";

import {
    createStackState,
    validateStackState,
    transitionStack
} from "../js/graphics/models/stack-model.js";

test("creates an empty Stack with correct indexes", () => {
    const state = createStackState({ capacity: 3 });

    assert.deepEqual(state.items, []);
    assert.equal(state.size, 0);
    assert.equal(state.topIndex, -1);
    assert.equal(state.capacity, 3);
    assert.equal(validateStackState(state), true);
});

test("creates a Stack from initial values in bottom-to-top order", () => {
    const state = createStackState({
        values: [10, 20, 30],
        capacity: 4
    });

    assert.deepEqual(state.items.map(item => item.value), [10, 20, 30]);
    assert.equal(state.topIndex, 2);
    assert.equal(state.size, 3);
    assert.equal(state.items[2].value, 30);
});

test("push adds a new stable item to the top", () => {
    const initial = createStackState({ values: [10], capacity: 3 });
    const transition = transitionStack(initial, "push", 20);

    assert.equal(transition.ok, true);
    assert.equal(transition.changed, true);
    assert.equal(transition.state.size, 2);
    assert.equal(transition.state.topIndex, 1);
    assert.equal(transition.state.items[1].value, 20);
    assert.equal(transition.event.type, "stack.push");
    assert.equal(transition.state.items[1].id, "stack-item-1");

    // The input snapshot must remain unchanged.
    assert.equal(initial.size, 1);
    assert.equal(initial.items.length, 1);
});

test("pop removes and returns only the top item", () => {
    const initial = createStackState({
        values: [10, 20, 30],
        capacity: 3
    });

    const transition = transitionStack(initial, "pop");

    assert.equal(transition.ok, true);
    assert.equal(transition.result, 30);
    assert.equal(transition.state.size, 2);
    assert.equal(transition.state.topIndex, 1);
    assert.deepEqual(
        transition.state.items.map(item => item.value),
        [10, 20]
    );
    assert.equal(transition.event.type, "stack.pop");
    assert.equal(initial.size, 3);
});

test("pop on an empty Stack reports underflow without mutation", () => {
    const initial = createStackState({ capacity: 2 });
    const transition = transitionStack(initial, "pop");

    assert.equal(transition.ok, false);
    assert.equal(transition.code, "STACK_UNDERFLOW");
    assert.equal(transition.changed, false);
    assert.equal(transition.event.type, "stack.underflow");
    assert.deepEqual(transition.state, initial);
});

test("push on a full Stack reports overflow without mutation", () => {
    const initial = createStackState({
        values: [10, 20],
        capacity: 2
    });

    const transition = transitionStack(initial, "push", 30);

    assert.equal(transition.ok, false);
    assert.equal(transition.code, "STACK_OVERFLOW");
    assert.equal(transition.changed, false);
    assert.equal(transition.event.type, "stack.overflow");
    assert.deepEqual(transition.state, initial);
});

test("peek returns the top value without removing it", () => {
    const initial = createStackState({
        values: [10, 20],
        capacity: 3
    });

    const transition = transitionStack(initial, "peek");

    assert.equal(transition.result, 20);
    assert.equal(transition.changed, false);
    assert.equal(transition.event.type, "stack.peek");
    assert.deepEqual(transition.state, initial);
});

test("peek on an empty Stack reports underflow", () => {
    const initial = createStackState({ capacity: 2 });
    const transition = transitionStack(initial, "peek");

    assert.equal(transition.ok, false);
    assert.equal(transition.code, "STACK_UNDERFLOW");
    assert.equal(transition.event.payload.attemptedOperation, "peek");
});

test("size returns the current number of items", () => {
    const state = createStackState({
        values: ["A", "B"],
        capacity: 4
    });

    const transition = transitionStack(state, "size");

    assert.equal(transition.result, 2);
    assert.equal(transition.changed, false);
    assert.equal(transition.event.type, "stack.size");
});

test("isEmpty correctly identifies empty and non-empty Stacks", () => {
    const empty = createStackState({ capacity: 2 });
    const nonEmpty = createStackState({
        values: [1],
        capacity: 2
    });

    assert.equal(transitionStack(empty, "isEmpty").result, true);
    assert.equal(transitionStack(nonEmpty, "isEmpty").result, false);
});

test("isFull correctly identifies full and non-full Stacks", () => {
    const full = createStackState({
        values: [1, 2],
        capacity: 2
    });
    const nonFull = createStackState({
        values: [1],
        capacity: 2
    });

    assert.equal(transitionStack(full, "isFull").result, true);
    assert.equal(transitionStack(nonFull, "isFull").result, false);
});

test("item IDs remain unique after a pop followed by a push", () => {
    const initial = createStackState({
        values: [10, 20],
        capacity: 3
    });

    const afterPop = transitionStack(initial, "pop").state;
    const afterPush = transitionStack(afterPop, "push", 30).state;

    assert.deepEqual(
        afterPush.items.map(item => item.id),
        ["stack-item-0", "stack-item-2"]
    );
});

test("rejects invalid capacity and too many initial values", () => {
    assert.throws(
        () => createStackState({ capacity: 0 }),
        /capacity/i
    );

    assert.throws(
        () => createStackState({ values: [1, 2], capacity: 1 }),
        /exceed/i
    );
});

test("rejects inconsistent Stack snapshots", () => {
    const invalid = {
        items: [{ id: "one", value: 1 }],
        topIndex: -1,
        size: 1,
        capacity: 3,
        nextItemId: 1
    };

    assert.throws(
        () => validateStackState(invalid),
        /topIndex/i
    );
});

test("rejects unsupported operations", () => {
    const state = createStackState();

    assert.throws(
        () => transitionStack(state, "enqueue", 10),
        /Unsupported Stack operation/
    );
});
