/**
 * DSA_L — Stack Model
 *
 * Pure, immutable Stack transitions.
 * items are stored bottom-to-top; the last item is the top.
 */

export const STACK_OPERATIONS = Object.freeze([
    "push",
    "pop",
    "peek",
    "size",
    "isEmpty",
    "isFull"
]);

function clone(value) {
    return structuredClone(value);
}

function requireCapacity(capacity) {
    if (!Number.isSafeInteger(capacity) || capacity < 1) {
        throw new RangeError("Stack capacity must be a positive safe integer.");
    }
}

export function createStackState({
    values = [],
    capacity = 8
} = {}) {
    requireCapacity(capacity);

    if (!Array.isArray(values)) {
        throw new TypeError("Initial Stack values must be an array.");
    }

    if (values.length > capacity) {
        throw new RangeError(
            "Initial Stack values cannot exceed the Stack capacity."
        );
    }

    const items = values.map((value, index) => ({
        id: `stack-item-${index}`,
        value: clone(value)
    }));

    const state = {
        items,
        topIndex: items.length - 1,
        size: items.length,
        capacity,
        nextItemId: items.length
    };

    validateStackState(state);
    return state;
}

export function validateStackState(state) {
    if (!state || typeof state !== "object" || Array.isArray(state)) {
        throw new TypeError("Stack state must be an object.");
    }

    if (!Array.isArray(state.items)) {
        throw new TypeError("Stack state.items must be an array.");
    }

    requireCapacity(state.capacity);

    if (!Number.isSafeInteger(state.size) || state.size < 0) {
        throw new TypeError("Stack size must be a non-negative safe integer.");
    }

    if (
        !Number.isSafeInteger(state.topIndex) ||
        state.topIndex < -1
    ) {
        throw new TypeError("Stack topIndex must be an integer >= -1.");
    }

    if (
        !Number.isSafeInteger(state.nextItemId) ||
        state.nextItemId < 0
    ) {
        throw new TypeError("Stack nextItemId must be a non-negative integer.");
    }

    if (state.size !== state.items.length) {
        throw new Error("Stack invariant violated: size must equal items.length.");
    }

    if (state.topIndex !== state.size - 1) {
        throw new Error(
            "Stack invariant violated: topIndex must equal size - 1."
        );
    }

    if (state.size > state.capacity) {
        throw new Error("Stack invariant violated: capacity exceeded.");
    }

    const ids = new Set();

    state.items.forEach((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new TypeError(`Stack item ${index} must be an object.`);
        }

        if (typeof item.id !== "string" || item.id.trim() === "") {
            throw new TypeError(`Stack item ${index} requires a non-empty ID.`);
        }

        if (ids.has(item.id)) {
            throw new Error(`Duplicate Stack item ID: ${item.id}`);
        }

        if (!Object.prototype.hasOwnProperty.call(item, "value")) {
            throw new Error(`Stack item ${item.id} is missing its value.`);
        }

        ids.add(item.id);
    });

    return true;
}

function createVariables(state) {
    const topItem = state.topIndex >= 0
        ? state.items[state.topIndex]
        : null;

    return {
        topIndex: state.topIndex,
        size: state.size,
        capacity: state.capacity,
        isEmpty: state.size === 0,
        isFull: state.size === state.capacity,
        topValue: topItem ? clone(topItem.value) : null
    };
}

function createTransition({
    state,
    result = null,
    ok = true,
    code = "OK",
    changed = false,
    event,
    explanation
}) {
    return {
        state,
        result,
        ok,
        code,
        changed,
        event: clone(event),
        explanation,
        variables: createVariables(state)
    };
}

/**
 * Apply one Stack operation without mutating the input state.
 *
 * @param {object} state Valid Stack snapshot.
 * @param {string} operation One of STACK_OPERATIONS.
 * @param {*} value Value supplied to push.
 * @returns {object} New snapshot and operation metadata.
 */
export function transitionStack(state, operation, value) {
    validateStackState(state);

    if (!STACK_OPERATIONS.includes(operation)) {
        throw new Error(`Unsupported Stack operation: ${operation}`);
    }

    const nextState = clone(state);
    const topItem = state.topIndex >= 0
        ? state.items[state.topIndex]
        : null;

    if (operation === "push") {
        if (state.size === state.capacity) {
            return createTransition({
                state: nextState,
                ok: false,
                code: "STACK_OVERFLOW",
                event: {
                    type: "stack.overflow",
                    entityIds: [],
                    payload: {
                        attemptedValue: clone(value),
                        capacity: state.capacity
                    }
                },
                explanation:
                    `Cannot push: the Stack is full (capacity ${state.capacity}).`
            });
        }

        const item = {
            id: `stack-item-${state.nextItemId}`,
            value: clone(value)
        };

        nextState.items.push(item);
        nextState.nextItemId += 1;
        nextState.size = nextState.items.length;
        nextState.topIndex = nextState.size - 1;

        return createTransition({
            state: nextState,
            result: clone(value),
            changed: true,
            event: {
                type: "stack.push",
                entityIds: [item.id],
                payload: {
                    itemId: item.id,
                    value: clone(value),
                    newTopIndex: nextState.topIndex
                }
            },
            explanation:
                `Push ${String(value)}: place the new item on top of the Stack.`
        });
    }

    if (operation === "pop") {
        if (state.size === 0) {
            return createTransition({
                state: nextState,
                ok: false,
                code: "STACK_UNDERFLOW",
                event: {
                    type: "stack.underflow",
                    entityIds: [],
                    payload: { attemptedOperation: "pop" }
                },
                explanation: "Cannot pop: the Stack is empty."
            });
        }

        const removedItem = nextState.items.pop();

        nextState.size = nextState.items.length;
        nextState.topIndex = nextState.size - 1;

        return createTransition({
            state: nextState,
            result: clone(removedItem.value),
            changed: true,
            event: {
                type: "stack.pop",
                entityIds: [removedItem.id],
                payload: {
                    itemId: removedItem.id,
                    value: clone(removedItem.value),
                    newTopIndex: nextState.topIndex
                }
            },
            explanation:
                `Pop ${String(removedItem.value)}: remove the top item from the Stack.`
        });
    }

    if (operation === "peek") {
        if (!topItem) {
            return createTransition({
                state: nextState,
                ok: false,
                code: "STACK_UNDERFLOW",
                event: {
                    type: "stack.underflow",
                    entityIds: [],
                    payload: { attemptedOperation: "peek" }
                },
                explanation: "Cannot peek: the Stack is empty."
            });
        }

        return createTransition({
            state: nextState,
            result: clone(topItem.value),
            event: {
                type: "stack.peek",
                entityIds: [topItem.id],
                payload: {
                    itemId: topItem.id,
                    value: clone(topItem.value)
                }
            },
            explanation:
                `Peek: inspect the top item (${String(topItem.value)}) without removing it.`
        });
    }

    if (operation === "size") {
        return createTransition({
            state: nextState,
            result: state.size,
            event: {
                type: "stack.size",
                entityIds: topItem ? [topItem.id] : [],
                payload: { size: state.size }
            },
            explanation: `Size: the Stack currently contains ${state.size} item(s).`
        });
    }

    if (operation === "isEmpty") {
        const result = state.size === 0;

        return createTransition({
            state: nextState,
            result,
            event: {
                type: "stack.is-empty",
                entityIds: [],
                payload: { result }
            },
            explanation: `isEmpty: ${result}.`
        });
    }

    const result = state.size === state.capacity;

    return createTransition({
        state: nextState,
        result,
        event: {
            type: "stack.is-full",
            entityIds: topItem ? [topItem.id] : [],
            payload: {
                result,
                size: state.size,
                capacity: state.capacity
            }
        },
        explanation: `isFull: ${result}.`
    });
}
