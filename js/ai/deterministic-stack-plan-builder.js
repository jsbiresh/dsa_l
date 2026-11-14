import { validateVisualizationPlan } from "../visualization/visualization-plan.js";
import {
    createStackState,
    transitionStack
} from "../graphics/models/stack-model.js";

const DEFAULT_OPERATIONS = Object.freeze([
    { operation: "push", value: 10 },
    { operation: "push", value: 20 },
    { operation: "push", value: 30 },
    { operation: "isFull" },
    { operation: "peek" },
    { operation: "pop" },
    { operation: "size" },
    { operation: "isEmpty" }
]);

const MAX_CAPACITY = 16;
const MAX_OPERATIONS = 40;

function parseValue(rawValue) {
    const value = rawValue.trim();

    if (/^-?\d+(?:\.\d+)?$/.test(value)) {
        const number = Number(value);
        return Number.isFinite(number)
            ? { valid: true, value: number }
            : { valid: false };
    }

    if (/^(true|false|null)$/i.test(value)) {
        return {
            valid: true,
            value: value.toLowerCase() === "null"
                ? null
                : value.toLowerCase() === "true"
        };
    }

    if (
        value.startsWith('"') &&
        value.endsWith('"')
    ) {
        try {
            const parsed = JSON.parse(value);
            return typeof parsed === "string"
                ? { valid: true, value: parsed }
                : { valid: false };
        } catch {
            return { valid: false };
        }
    }

    if (
        value.startsWith("'") &&
        value.endsWith("'") &&
        value.length >= 2
    ) {
        return {
            valid: true,
            value: value.slice(1, -1)
        };
    }

    return { valid: false };
}

function parseOperations(question) {
    const operations = [];
    const expression =
        /\b(push|pop|peek|top|size|isEmpty|isFull)\b\s*(?:\(\s*([^)]*)\s*\))?/gi;

    let match;
    let generatedPushValue = 10;

    while ((match = expression.exec(question)) !== null) {
        const name = match[1].toLowerCase();

        const operation = name === "top"
            ? "peek"
            : name === "isempty"
                ? "isEmpty"
                : name === "isfull"
                    ? "isFull"
                    : name;

        if (operation === "push") {
            let rawValue = match[2];

            // Also accept natural syntax such as "push 25".
            if (rawValue === undefined || !rawValue.trim()) {
                const remaining = question.slice(
                    expression.lastIndex
                );

                const argumentMatch = remaining.match(
                    /^\s*(-?\d+(?:\.\d+)?|true|false|null|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/i
                );

                if (argumentMatch) {
                    rawValue = argumentMatch[1];
                    expression.lastIndex += argumentMatch[0].length;
                }
            }

            if (rawValue === undefined || !rawValue.trim()) {
                operations.push({
                    operation,
                    value: generatedPushValue
                });
                generatedPushValue += 10;
            } else {
                const parsed = parseValue(rawValue);

                if (!parsed.valid) {
                    return null;
                }

                operations.push({
                    operation,
                    value: parsed.value
                });
            }
        } else {
            operations.push({ operation });
        }

        if (operations.length > MAX_OPERATIONS) {
            return null;
        }
    }

    return operations;
}

function resolveCapacity(question, isGenerated) {
    const match = question.match(
        /\bcapacity\b\s*(?:of|=|:)?\s*(\d+)\b/i
    );

    if (!match) {
        return isGenerated ? 3 : 8;
    }

    const capacity = Number(match[1]);

    if (
        !Number.isSafeInteger(capacity) ||
        capacity < 1 ||
        capacity > MAX_CAPACITY
    ) {
        return null;
    }

    return capacity;
}

function isStackOnlyApproach(approach) {
    if (
        !approach ||
        !Array.isArray(approach.dataStructures) ||
        approach.dataStructures.length !== 1
    ) {
        return false;
    }

    return approach.dataStructures[0].name === "Stack";
}

function isStackTutorialRequest(question, approach, operations) {
    if (!isStackOnlyApproach(approach)) {
        return false;
    }

    // Monotonic Stack algorithm problems require their own
    // algorithm-specific planner, not a basic Stack walkthrough.
    if (approach.pattern === "Monotonic Stack") {
        return false;
    }

    if (operations.length > 0) {
        return true;
    }

    return (
        /\bstack\b/i.test(question) &&
        /\b(?:explain|demonstrate|visualize|show|teach|implement)\b/i
            .test(question)
    );
}

function buildCode(capacity, operations) {
    const lines = [
        "const stack = [];",
        `const capacity = ${capacity};`,
        "",
        "function push(value) {",
        '  if (stack.length === capacity) return "OVERFLOW";',
        "  stack.push(value);",
        "}",
        "",
        "function pop() {",
        '  if (stack.length === 0) return "UNDERFLOW";',
        "  return stack.pop();",
        "}",
        "",
        "function peek() {",
        '  if (stack.length === 0) return "UNDERFLOW";',
        "  return stack[stack.length - 1];",
        "}",
        "",
        "function size() { return stack.length; }",
        "function isEmpty() { return stack.length === 0; }",
        "function isFull() { return stack.length === capacity; }",
        "",
        "// Execute the requested Stack operations:"
    ];

    const operationCallLines = operations.map(request => {
        const call = request.operation === "push"
            ? `push(${JSON.stringify(request.value)});`
            : `${request.operation}();`;

        const lineIndex = lines.length;
        lines.push(call);

        return lineIndex;
    });

    return {
        source: lines.join("\n"),
        operationCallLines
    };
}

function getAnimation(operation, ok) {
    if (!ok) {
        return {
            kind: "shake",
            durationMs: 280,
            easing: "ease-in-out"
        };
    }

    if (operation === "push" || operation === "pop") {
        return {
            kind: operation,
            durationMs: 420,
            easing: "ease-in-out"
        };
    }

    return {
        kind: "highlight",
        durationMs: 220,
        easing: "ease-in-out"
    };
}

export function buildDeterministicStackPlan(question, approach) {
    const normalizedQuestion = String(question || "").trim();

    if (!normalizedQuestion) {
        return null;
    }

    const parsedOperations = parseOperations(normalizedQuestion);

    if (parsedOperations === null) {
        return null;
    }

    if (
        !isStackTutorialRequest(
            normalizedQuestion,
            approach,
            parsedOperations
        )
    ) {
        return null;
    }

    const explicitlySpecifiedOperations = parsedOperations.length > 0;

    const operations = explicitlySpecifiedOperations
        ? parsedOperations
        : structuredClone(DEFAULT_OPERATIONS);

    const capacity = resolveCapacity(
        normalizedQuestion,
        !explicitlySpecifiedOperations
    );

    if (capacity === null || operations.length === 0) {
        return null;
    }

    const initialState = createStackState({ capacity });
    const workingState = structuredClone(initialState);
    const { source: code, operationCallLines } = buildCode(capacity, operations);

    const steps = [];

    operations.forEach((request, index) => {
        const transition = transitionStack(
            workingState,
            request.operation,
            request.value
        );

        // Carry the complete resulting snapshot into the next transition.
        Object.assign(workingState, structuredClone(transition.state));

        const visualOperation = !transition.ok
            ? request.operation === "push"
                ? "overflow"
                : "underflow"
            : request.operation;

        const itemId = transition.event.entityIds[0] || null;

        const result = transition.result === undefined
            ? null
            : structuredClone(transition.result);

        const variables = {
            ...transition.variables,
            operation: request.operation,
            operationSucceeded: transition.ok,
            result,
            statusCode: transition.code,
            ...(request.operation === "push"
                ? { value: structuredClone(request.value) }
                : {})
        };

        const metadata = {
            operation: request.operation,
            status: transition.ok ? "success" : "error",
            statusCode: transition.code,
            message: transition.explanation,
            result,
            activeItemId: itemId
        };

        const event = {
            id: `stack-step-${index}-${transition.event.type}`,
            type: transition.event.type,
            target: {
                visualizationId: "stack-main",
                entityIds: transition.event.entityIds
            },
            animation: getAnimation(request.operation, transition.ok),
            payload: structuredClone(transition.event.payload)
        };

        steps.push({
            action: request.operation === "push"
                ? `push(${String(request.value)})`
                : `${request.operation}()`,
            // Highlight the actual operation invocation in the source code.
            codeLine: operationCallLines[index],
            explanation: transition.explanation,
            variables,
            metrics: {},
            visualStates: {
                "stack-main": {
                    operation: visualOperation,
                    state: structuredClone(workingState),
                    metadata
                }
            },
            animationEvents: [event]
        });
    });

    const rawPlan = {
        schemaVersion: 1,
        requestSummary:
            `Stack operation walkthrough with ${operations.length} operations.`,
        selectedApproach: {
            pattern: approach.pattern,
            applicability: approach.applicability,
            reason: approach.reason,
            conditions: [...(approach.conditions || [])]
        },
        complexity: {
            time: "O(1) per Stack operation",
            space: "O(capacity)"
        },
        input: {
            source: explicitlySpecifiedOperations
                ? "provided"
                : "generated",
            parameters: {
                capacity,
                operations: structuredClone(operations)
            },
            constraints: [
                `Stack capacity is ${capacity}.`,
                "The top item is stored at items[topIndex].",
                "The input operation order is preserved.",
                "Overflow and underflow leave the Stack unchanged."
            ]
        },
        code: {
            language: "javascript",
            source: code
        },
        visualizations: [{
            id: "stack-main",
            structure: "Stack",
            visualizerId: "stack",
            role: "primary",
            initialState
        }],
        steps,
        confidence: 1
    };

    return validateVisualizationPlan(rawPlan);
}
