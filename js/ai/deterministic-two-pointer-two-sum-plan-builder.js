import { validateVisualizationPlan } from "../visualization/visualization-plan.js";

function parseNumbers(question) {
    const text = String(question);

    const match =
        text.match(/\b(?:nums|values|arr|array)\s*=\s*\[([^\]]+)\]/i) ||
        text.match(/\[\s*([^\]]+)\]/);

    if (!match) return null;

    const values = match[1].split(",").map(value => Number(value.trim()));

    return values.length >= 2 && values.every(Number.isFinite)
        ? values
        : null;
}

function parseTarget(question) {
    const text = String(question);

    const match =
        text.match(/\btarget\b\s*(?:=|:|is|of)?\s*(-?\d+(?:\.\d+)?)/i) ||
        text.match(/\bsum\b\s*(?:is|of|=|:|equals?)\s*(-?\d+(?:\.\d+)?)/i);

    return match ? Number(match[1]) : null;
}

function isSortedAscending(values) {
    return values.every(
        (value, index) => index === 0 || values[index - 1] <= value
    );
}

export function buildDeterministicTwoPointerTwoSumPlan(
    question,
    approach,
    availableVisualizers
) {
    if (approach?.pattern !== "Two Pointers") return null;

    const structures = new Set(
        (approach.dataStructures || []).map(item => item.name)
    );

    const visualizers = new Set(
        (availableVisualizers || []).map(item => item.id)
    );

    if (!structures.has("Array") || !visualizers.has("array")) {
        return null;
    }

    const nums = parseNumbers(question);
    const target = parseTarget(question);

    // This deterministic builder requires an explicit, numeric input and target.
    if (!nums || target === null || !Number.isFinite(target)) {
        return null;
    }

    if (!isSortedAscending(nums)) {
        throw new Error(
            "Two Pointers Two Sum requires a sorted array. " +
            "The supplied array is not sorted; use Hashing or sort it " +
            "while preserving original indices."
        );
    }

    const array = nums.map((value, index) => ({
        id: `element-${index}`,
        value
    }));

    const code = [
        "function twoSumSorted(nums, target) {",
        "  let left = 0;",
        "  let right = nums.length - 1;",
        "  while (left < right) {",
        "    const sum = nums[left] + nums[right];",
        "    if (sum === target) {",
        "      return [left, right];",
        "    }",
        "    if (sum < target) {",
        "      left++;",
        "    } else {",
        "      right--;",
        "    }",
        "  }",
        "  return [];",
        "}"
    ].join("\n");

    const steps = [];
    let left = 0;
    let right = nums.length - 1;
    let comparisons = 0;
    let pointerMoves = 0;
    let result = null;

    function addStep(
        action,
        codeLine,
        explanation,
        variables,
        operation,
        activeIndexes,
        metrics = {}
    ) {
        steps.push({
            action,
            codeLine,
            explanation,
            variables,
            metrics: {
                comparisons,
                pointerMoves,
                ...metrics
            },
            visualStates: {
                "array-main": {
                    operation,
                    state: {
                        array: array.map(item => ({ ...item }))
                    },
                    metadata: {
                        activeIndexes
                    }
                }
            }
        });
    }

    function currentVariables(extra = {}) {
        return {
            algorithm: "Two Pointers - Two Sum",
            left,
            right,
            leftValue: left < nums.length ? nums[left] : null,
            rightValue: right >= 0 ? nums[right] : null,
            target,
            ...extra
        };
    }

    addStep(
        "INITIALIZE",
        1,
        `Initialize left = 0 and right = ${right} for the sorted array.`,
        currentVariables(),
        "render",
        [left, right]
    );

    while (left < right) {
        const leftValue = nums[left];
        const rightValue = nums[right];
        const sum = leftValue + rightValue;

        comparisons++;

        addStep(
            "COMPARE_SUM",
            4,
            `Compare nums[${left}] + nums[${right}] = ${leftValue} + ${rightValue} = ${sum} with target ${target}.`,
            currentVariables({
                leftValue,
                rightValue,
                sum,
                found: false
            }),
            "compare",
            [left, right]
        );

        if (sum === target) {
            result = [left, right];

            addStep(
                "COMPLETE",
                6,
                `Found ${leftValue} + ${rightValue} = ${target}. Their indices are ${left} and ${right}.`,
                currentVariables({
                    leftValue,
                    rightValue,
                    sum,
                    result,
                    resultValues: [leftValue, rightValue],
                    found: true
                }),
                "complete",
                [left, right]
            );

            break;
        }

        if (sum < target) {
            left++;
            pointerMoves++;

            addStep(
                "MOVE_LEFT_POINTER",
                9,
                `The sum ${sum} is smaller than ${target}. Move left rightward to increase the sum.`,
                currentVariables({
                    previousLeft: left - 1,
                    found: false
                }),
                "highlight",
                left < right ? [left, right] : [left]
            );
        } else {
            right--;
            pointerMoves++;

            addStep(
                "MOVE_RIGHT_POINTER",
                11,
                `The sum ${sum} is greater than ${target}. Move right leftward to decrease the sum.`,
                currentVariables({
                    previousRight: right + 1,
                    found: false
                }),
                "highlight",
                left < right ? [left, right] : [left]
            );
        }
    }

    if (!result) {
        addStep(
            "NOT_FOUND",
            14,
            `No pair in the supplied sorted array adds up to ${target}.`,
            currentVariables({
                result: [],
                resultValues: [],
                found: false
            }),
            "complete",
            left <= right ? [left] : []
        );
    }

    const rawPlan = {
        schemaVersion: 1,
        requestSummary:
            `Two Sum using Two Pointers on ${nums.length} sorted input values.`,
        selectedApproach: {
            pattern: "Two Pointers",
            applicability: approach.applicability,
            reason: approach.reason,
            conditions: Array.isArray(approach.conditions)
                ? [...approach.conditions]
                : []
        },
        complexity: {
            time: "O(n)",
            space: "O(1)"
        },
        input: {
            source: "provided",
            parameters: {
                nums: [...nums],
                target
            },
            constraints: [
                "The input array must be sorted in non-decreasing order.",
                "The explicitly supplied input values and target are preserved."
            ]
        },
        code: {
            language: "javascript",
            source: code
        },
        visualizations: [
            {
                id: "array-main",
                structure: "Array",
                visualizerId: "array",
                role: "primary",
                initialState: {
                    array: array.map(item => ({ ...item }))
                }
            }
        ],
        steps,
        confidence: 1
    };

    return validateVisualizationPlan(rawPlan);
}
