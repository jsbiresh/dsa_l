import { validateVisualizationPlan } from "../visualization/visualization-plan.js";

const SAMPLE_VALUES = [8, 3, 5, 1, 9, 2, 7, 4, 6, 10, 0, 11, 13, 12, 15, 14];

function getRequestedSize(question) {
    const match =
        question.match(/\b(\d{1,2})\s*(?:elements?|items?|numbers?)\b/i) ||
        question.match(/\b(?:size|length)\s*(?:of|is|=)?\s*(\d{1,2})\b/i);

    return match ? Number(match[1] || match[2]) : 8;
}

function parseArray(question) {
    const match = question.match(/\[([^\]]+)\]/);
    if (!match) return null;

    const values = match[1].split(",").map(value => Number(value.trim()));

    return values.length > 0 && values.every(Number.isFinite)
        ? values
        : null;
}

function parseTarget(question) {
    const match =
        question.match(/\btarget\b\s*(?:=|:|is|of)?\s*(-?\d+(?:\.\d+)?)/i) ||
        question.match(/\bfind(?:\s+the)?(?:\s+number)?\s+(-?\d+(?:\.\d+)?)/i) ||
        question.match(/\bsearch(?:\s+for)?\s+(-?\d+(?:\.\d+)?)/i);

    return match ? Number(match[1]) : null;
}

function isAscending(values) {
    return values.every((value, index) =>
        index === 0 || values[index - 1] <= value
    );
}

function isDescending(values) {
    return values.every((value, index) =>
        index === 0 || values[index - 1] >= value
    );
}

export function buildDeterministicSearchingPlan(
    question,
    approach,
    availableVisualizers
) {
    const match = String(question).match(/\b(linear|binary)\s*search\b/i);
    if (!match) return null;

    const algorithm =
        match[1].toLowerCase() === "linear"
            ? "Linear Search"
            : "Binary Search";

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

    if (generated && (requestedSize < 1 || requestedSize > SAMPLE_VALUES.length)) {
        return null;
    }

    let values = suppliedValues ?? SAMPLE_VALUES.slice(0, requestedSize);

    if (
        values.length < 1 ||
        values.length > 16 ||
        !values.every(Number.isFinite)
    ) {
        return null;
    }

    const target = parseTarget(question);
    if (target === null || !Number.isFinite(target)) return null;

    const explicitlyDescending =
        /\b(descending|decreasing|highest to lowest|largest to smallest)\b/i
            .test(question);

    const explicitlyAscending =
        /\b(ascending|increasing|lowest to highest|smallest to largest)\b/i
            .test(question);

    let order = "original";

    if (algorithm === "Binary Search") {
        if (generated) {
            values = [...values].sort((a, b) => a - b);
            if (explicitlyDescending) values.reverse();
        }

        const ascending = isAscending(values);
        const descending = isDescending(values);

        if (explicitlyAscending && !ascending) {
            throw new Error(
                "Binary Search requires the supplied array to already be sorted in ascending order."
            );
        }

        if (explicitlyDescending && !descending) {
            throw new Error(
                "Binary Search requires the supplied array to already be sorted in descending order."
            );
        }

        if (!ascending && !descending) {
            throw new Error(
                "Binary Search requires an already sorted array. The supplied array is not sorted; DSA_L will not silently sort it."
            );
        }

        order = explicitlyDescending
            ? "descending"
            : explicitlyAscending
                ? "ascending"
                : descending && !ascending
                    ? "descending"
                    : "ascending";
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

    let code;

    if (algorithm === "Linear Search") {
        code = [
            "function linearSearch(values, target) {",
            "  for (let i = 0; i < values.length; i++) {",
            "    if (values[i] === target) {",
            "      return i;",
            "    }",
            "  }",
            "  return -1;",
            "}"
        ].join("\n");
    } else {
        const comparison = order === "descending" ? ">" : "<";

        code = [
            "function binarySearch(values, target) {",
            "  let low = 0;",
            "  let high = values.length - 1;",
            "  while (low <= high) {",
            "    const mid = Math.floor((low + high) / 2);",
            "    if (values[mid] === target) {",
            "      return mid;",
            "    }",
            `    if (values[mid] ${comparison} target) {`,
            "      low = mid + 1;",
            "    } else {",
            "      high = mid - 1;",
            "    }",
            "  }",
            "  return -1;",
            "}"
        ].join("\n");
    }

    addStep(
        "INITIALIZE",
        0,
        `Start ${algorithm} for target ${target} in an array of ${values.length} elements.`,
        { algorithm, target, length: values.length, order },
        "render"
    );

    let result = -1;

    if (algorithm === "Linear Search") {
        for (let i = 0; i < values.length; i++) {
            const current = values[i];
            comparisons++;

            addStep(
                "COMPARE_ELEMENT",
                2,
                `Compare values[${i}] = ${current} with target ${target}.`,
                { index: i, current, target },
                "compare",
                {
                    activeIndexes: [i],
                    comparingIndexes: [i]
                },
                { comparisons: 1 }
            );

            if (current === target) {
                result = i;

                addStep(
                    "TARGET_FOUND",
                    3,
                    `Target ${target} found at index ${i}.`,
                    { index: i, current, target, result },
                    "complete",
                    { activeIndexes: [i] },
                    { comparisons: 0 }
                );

                break;
            }
        }

        if (result === -1) {
            addStep(
                "TARGET_NOT_FOUND",
                6,
                `Target ${target} is not present in the array.`,
                { target, result: -1, comparisons },
                "complete",
                { activeIndexes: [] }
            );
        }
    } else {
        let low = 0;
        let high = values.length - 1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const current = values[mid];

            addStep(
                "SELECT_MIDDLE",
                4,
                `Current search interval is [${low}, ${high}]. Select middle index ${mid}.`,
                { low, high, mid, current, target },
                "highlight",
                { activeIndexes: [mid] }
            );

            comparisons++;

            addStep(
                "COMPARE_MIDDLE",
                5,
                `Compare middle value ${current} with target ${target}.`,
                { low, high, mid, current, target },
                "compare",
                {
                    activeIndexes: [mid],
                    comparingIndexes: [mid]
                },
                { comparisons: 1 }
            );

            if (current === target) {
                result = mid;

                addStep(
                    "TARGET_FOUND",
                    6,
                    `Target ${target} found at index ${mid}.`,
                    { low, high, mid, current, target, result },
                    "complete",
                    { activeIndexes: [mid] }
                );

                break;
            }

            const targetIsToRight =
                order === "descending"
                    ? current > target
                    : current < target;

            if (targetIsToRight) {
                low = mid + 1;
                addStep(
                    "MOVE_LOW",
                    9,
                    `Target must be in the right half. Move low to ${low}.`,
                    { low, high, mid, target },
                    "highlight",
                    {
                        activeIndexes: Array.from(
                            { length: Math.max(0, high - low + 1) },
                            (_, index) => low + index
                        )
                    }
                );
            } else {
                high = mid - 1;
                addStep(
                    "MOVE_HIGH",
                    11,
                    `Target must be in the left half. Move high to ${high}.`,
                    { low, high, mid, target },
                    "highlight",
                    {
                        activeIndexes: Array.from(
                            { length: Math.max(0, high - low + 1) },
                            (_, index) => low + index
                        )
                    }
                );
            }
        }

        if (result === -1) {
            addStep(
                "TARGET_NOT_FOUND",
                14,
                `Target ${target} is not present. The search interval is empty.`,
                { low, high, target, result: -1, comparisons },
                "complete",
                { activeIndexes: [] }
            );
        }
    }

    const complexity = algorithm === "Linear Search"
        ? {
            time: "O(1) best; O(n) worst and average",
            space: "O(1)"
        }
        : {
            time: "O(log n)",
            space: "O(1)"
        };

    return validateVisualizationPlan({
        schemaVersion: 1,
        requestSummary: `${algorithm} for ${target} in ${values.length} elements.`,
        selectedApproach: {
            pattern: approach.pattern,
            applicability: approach.applicability,
            reason: approach.reason ||
                `${algorithm} searches the array using a deterministic comparison strategy.`,
            conditions: approach.conditions || []
        },
        complexity,
        input: {
            source: generated ? "generated" : "provided",
            parameters: {
                array: [...values],
                target,
                algorithm,
                order,
                expectedResult: result
            },
            constraints: [
                "Numeric array",
                "Numeric target",
                algorithm === "Binary Search"
                    ? `Array must already be sorted in ${order} order`
                    : "Preserve original input order"
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
