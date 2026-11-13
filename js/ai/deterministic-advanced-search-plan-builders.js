import { validateVisualizationPlan } from "../visualization/visualization-plan.js";

const SAMPLE_VALUES = [
    1, 2, 2, 2, 4, 5, 7, 9,
    11, 13, 15, 17, 19, 21, 23, 25
];

function parseArray(question) {
    const match = String(question).match(/\[([^\]]*)\]/);
    if (!match) return null;

    const contents = match[1].trim();
    if (!contents) return [];

    const values = contents.split(",").map(value => Number(value.trim()));

    return values.every(Number.isFinite) ? values : null;
}

function parseTarget(question) {
    const patterns = [
        /\btarget\b\s*(?:=|:|is|of)?\s*(-?\d+(?:\.\d+)?)/i,
        /\b(?:lower|upper)\s*bound\b\s*(?:of|for)?\s*(-?\d+(?:\.\d+)?)/i,
        /\bfind(?:\s+the)?(?:\s+number)?\s+(-?\d+(?:\.\d+)?)/i
    ];

    for (const pattern of patterns) {
        const match = String(question).match(pattern);
        if (match) return Number(match[1]);
    }

    return null;
}

function getRequestedSize(question) {
    const match =
        String(question).match(/\b(\d{1,2})\s*(?:elements?|items?|numbers?)\b/i) ||
        String(question).match(/\b(?:size|length)\s*(?:of|is|=)?\s*(\d{1,2})\b/i);

    return match ? Number(match[1] || match[2]) : 8;
}

function isAscending(values) {
    return values.every((value, index) =>
        index === 0 || values[index - 1] <= value
    );
}

export function buildDeterministicBoundSearchPlan(
    question,
    approach,
    availableVisualizers
) {
    const match = String(question).match(/\b(lower|upper)\s*bound\b/i);
    if (!match) return null;

    const algorithm =
        match[1].toLowerCase() === "lower"
            ? "Lower Bound"
            : "Upper Bound";

    const structures = new Set(
        (approach?.dataStructures || []).map(item => item.name)
    );

    const visualizers = new Set(
        (availableVisualizers || []).map(item => item.id)
    );

    if (!structures.has("Array") || !visualizers.has("array")) {
        return null;
    }

    const suppliedValues = parseArray(question);
    const generated = suppliedValues === null;
    const requestedSize = getRequestedSize(question);

    if (
        generated &&
        (requestedSize < 1 || requestedSize > SAMPLE_VALUES.length)
    ) {
        return null;
    }

    const values = suppliedValues ?? SAMPLE_VALUES.slice(0, requestedSize);
    const target = parseTarget(question);

    if (
        values.length < 1 ||
        values.length > 16 ||
        !values.every(Number.isFinite)
    ) {
        return null;
    }

    if (target === null || !Number.isFinite(target)) {
        return null;
    }

    if (!isAscending(values)) {
        throw new Error(
            `${algorithm} requires an ascending sorted array. DSA_L will not silently sort the supplied input.`
        );
    }

    const arrayState = {
        array: values.map((value, index) => ({
            id: `element-${index}`,
            value
        }))
    };

    const initialState = {
        array: arrayState.array.map(item => ({ ...item }))
    };

    const code = algorithm === "Lower Bound"
        ? [
            "function lowerBound(values, target) {",
            "  let low = 0;",
            "  let high = values.length;",
            "  while (low < high) {",
            "    const mid = Math.floor((low + high) / 2);",
            "    if (values[mid] >= target) {",
            "      high = mid;",
            "    } else {",
            "      low = mid + 1;",
            "    }",
            "  }",
            "  return low;",
            "}"
        ].join("\n")
        : [
            "function upperBound(values, target) {",
            "  let low = 0;",
            "  let high = values.length;",
            "  while (low < high) {",
            "    const mid = Math.floor((low + high) / 2);",
            "    if (values[mid] > target) {",
            "      high = mid;",
            "    } else {",
            "      low = mid + 1;",
            "    }",
            "  }",
            "  return low;",
            "}"
        ].join("\n");

    const steps = [];
    let comparisons = 0;

    function snapshot() {
        return {
            array: arrayState.array.map(item => ({ ...item }))
        };
    }

    function addStep(
        action,
        codeLine,
        explanation,
        variables,
        operation,
        metadata = {},
        metrics = {}
    ) {
        steps.push({
            action,
            codeLine,
            explanation,
            variables,
            metrics,
            visualStates: {
                "array-main": {
                    operation,
                    state: snapshot(),
                    metadata
                }
            }
        });
    }

    addStep(
        "INITIALIZE",
        0,
        `Start ${algorithm} for target ${target}. The search interval is [0, ${values.length}).`,
        {
            algorithm,
            target,
            low: 0,
            high: values.length,
            intervalConvention: "half-open"
        },
        "render"
    );

    let low = 0;
    let high = values.length;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const current = values[mid];

        addStep(
            "SELECT_MIDDLE",
            4,
            `Search interval [${low}, ${high}). Select middle index ${mid}, containing ${current}.`,
            { low, high, mid, current, target },
            "highlight",
            { activeIndexes: [mid] }
        );

        comparisons++;

        const moveHigh = algorithm === "Lower Bound"
            ? current >= target
            : current > target;

        addStep(
            "COMPARE_MIDDLE",
            5,
            algorithm === "Lower Bound"
                ? `Check whether ${current} >= ${target}.`
                : `Check whether ${current} > ${target}.`,
            { low, high, mid, current, target, moveHigh },
            "compare",
            {
                activeIndexes: [mid],
                comparingIndexes: [mid]
            },
            { comparisons: 1 }
        );

        if (moveHigh) {
            high = mid;

            addStep(
                "MOVE_HIGH",
                6,
                `${current} satisfies the bound condition. Move high to ${high}.`,
                { low, high, mid, current, target },
                "highlight",
                {
                    activeIndexes: Array.from(
                        { length: high - low },
                        (_, index) => low + index
                    )
                }
            );
        } else {
            low = mid + 1;

            addStep(
                "MOVE_LOW",
                8,
                `${current} does not satisfy the bound condition. Move low to ${low}.`,
                { low, high, mid, current, target },
                "highlight",
                {
                    activeIndexes: Array.from(
                        { length: high - low },
                        (_, index) => low + index
                    )
                }
            );
        }
    }

    const result = low;

    const found = algorithm === "Lower Bound"
        ? result < values.length && values[result] === target
        : result > 0 && values[result - 1] === target;

    addStep(
        "BOUND_FOUND",
        11,
        algorithm === "Lower Bound"
            ? `Lower Bound is index ${result}: the first position whose value is greater than or equal to ${target}.`
            : `Upper Bound is index ${result}: the first position whose value is greater than ${target}.`,
        {
            algorithm,
            target,
            result,
            insertionIndex: result,
            found,
            comparisons
        },
        "complete",
        {
            activeIndexes: result < values.length
                ? [result]
                : result > 0
                    ? [result - 1]
                    : []
        }
    );

    return validateVisualizationPlan({
        schemaVersion: 1,
        requestSummary: `${algorithm} for ${target} in an ascending array of ${values.length} elements.`,
        selectedApproach: {
            pattern: approach.pattern,
            applicability: approach.applicability,
            reason: approach.reason ||
                `${algorithm} uses binary search over a half-open interval to find an insertion boundary.`,
            conditions: [
                "Input must be sorted in ascending order."
            ]
        },
        complexity: {
            time: "O(log n)",
            space: "O(1)"
        },
        input: {
            source: generated ? "generated" : "provided",
            parameters: {
                array: [...values],
                target,
                algorithm,
                order: "ascending",
                expectedResult: result,
                found
            },
            constraints: [
                "Numeric array",
                "Numeric target",
                "Array must be sorted in ascending order",
                "The result is a zero-based insertion boundary in the range [0, array.length]"
            ]
        },
        code: {
            language: "javascript",
            source: code
        },
        visualizations: [{
            id: "array-main",
            structure: "Array",
            visualizerId: "array",
            role: "primary",
            initialState
        }],
        steps,
        confidence: 1
    });
}
