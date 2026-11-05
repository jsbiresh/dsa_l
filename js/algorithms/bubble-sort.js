/**
 * Bubble Sort
 *
 * Generates a deterministic execution trace for visualization.
 *
 * The algorithm is independent of the DOM and UI.
 * Every meaningful operation produces a state snapshot.
 */

export const BUBBLE_SORT_CODE = [
    "function bubbleSort(array) {",
    "    const arr = [...array];",
    "    const n = arr.length;",
    "    for (let i = 0; i < n - 1; i++) {",
    "        let swapped = false;",
    "        for (let j = 0; j < n - i - 1; j++) {",
    "            if (arr[j] > arr[j + 1]) {",
    "                const temp = arr[j];",
    "                arr[j] = arr[j + 1];",
    "                arr[j + 1] = temp;",
    "                swapped = true;",
    "            }",
    "        }",
    "        if (!swapped) break;",
    "    }",
    "    return arr;",
    "}"
].join("\n");


/**
 * Generate a Bubble Sort execution trace.
 *
 * @param {number[]} inputArray
 * @returns {object} Complete execution trace.
 */
export function createBubbleSortTrace(inputArray) {

    if (!Array.isArray(inputArray)) {
        throw new TypeError("Input must be an array.");
    }

    if (!inputArray.every(Number.isFinite)) {
        throw new TypeError("Bubble Sort currently supports finite numbers only.");
    }

    const arr = [...inputArray];

    const initialState = {
        array: [...arr]
    };

    const steps = [];

    const n = arr.length;

    let totalComparisons = 0;
    let totalSwaps = 0;

    /**
     * Record an independent execution snapshot.
     */
    function recordStep({
        action,
        codeLine,
        variables,
        explanation,
        metrics = {}
    }) {

        steps.push({
            action,

            state: {
                array: [...arr]
            },

            codeLine,

            variables: {
                ...variables
            },

            explanation,

            metrics
        });
    }

    /**
     * Bubble Sort implementation.
     */
    for (let i = 0; i < n - 1; i++) {

        let swapped = false;

        recordStep({
            action: "PASS_START",
            codeLine: 4,
            variables: {
                i,
                j: null,
                swapped
            },
            explanation: "Starting pass " + (i + 1) + "."
        });

        for (let j = 0; j < n - i - 1; j++) {

            const left = arr[j];
            const right = arr[j + 1];

            totalComparisons++;

            recordStep({
                action: "COMPARE",
                codeLine: 7,
                variables: {
                    i,
                    j,
                    left,
                    right,
                    swapped
                },
                explanation:
                    "Comparing " + left + " and " + right + ".",

                metrics: {
                    comparisons: 1,
                    arrayAccesses: 2,
                    reads: 2
                }
            });

            if (left > right) {

                const temp = arr[j];

                arr[j] = arr[j + 1];

                arr[j + 1] = temp;

                swapped = true;

                totalSwaps++;

                recordStep({
                    action: "SWAP",
                    codeLine: 10,
                    variables: {
                        i,
                        j,
                        left,
                        right,
                        temp,
                        swapped
                    },
                    explanation:
                        "Swapped " + left + " and " + right +
                        " because " + left + " is greater than " + right + ".",

                    metrics: {
                        swaps: 1,
                        assignments: 3,
                        writes: 2
                    }
                });

            } else {

                recordStep({
                    action: "NO_SWAP",
                    codeLine: 7,
                    variables: {
                        i,
                        j,
                        left,
                        right,
                        swapped
                    },
                    explanation:
                        "No swap required because " + left +
                        " is not greater than " + right + "."
                });
            }
        }

        recordStep({
            action: "PASS_COMPLETE",
            codeLine: 14,
            variables: {
                i,
                j: null,
                swapped
            },
            explanation:
                "Pass " + (i + 1) + " completed. " +
                (swapped
                    ? "At least one swap occurred."
                    : "No swaps occurred.")
        });

        if (!swapped) {

            recordStep({
                action: "EARLY_EXIT",
                codeLine: 14,
                variables: {
                    i,
                    swapped
                },
                explanation:
                    "No swaps occurred during this pass. " +
                    "The array is already sorted, so execution can stop."
            });

            break;
        }
    }

    recordStep({
        action: "COMPLETE",
        codeLine: 16,
        variables: {
            i: null,
            j: null
        },
        explanation: "Bubble Sort completed successfully."
    });

    return {
        algorithmName: "Bubble Sort",

        code: BUBBLE_SORT_CODE,

        initialState,

        steps,

        finalState: {
            array: [...arr]
        },

        summary: {
            inputSize: n,
            totalComparisons,
            totalSwaps,
            totalSteps: steps.length,
            timeComplexity: "O(n²)",
            spaceComplexity: "O(n)"
        }
    };
}