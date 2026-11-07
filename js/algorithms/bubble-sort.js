/**
 * Bubble Sort
 *
 * Generates a deterministic execution trace.
 *
 * Every array element has a stable ID.
 * This allows the visualizer to animate individual
 * elements even when duplicate values exist.
 */

export const BUBBLE_SORT_CODE = [
    "function bubbleSort(array) {",
    "    const arr = [...array];",
    "    const n = arr.length;",
    "    for (let i = 0; i < n - 1; i++) {",
    "        let swapped = false;",
    "        for (let j = 0; j < n - i - 1; j++) {",
    "            if (arr[j].value > arr[j + 1].value) {",
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
        throw new TypeError(
            "Bubble Sort currently supports finite numbers only."
        );
    }

    const arr = inputArray.map((value, index) => ({
        id: "element-" + index,
        value: value
    }));

    const initialState = {
        array: arr.map(item => ({ ...item }))
    };

    const steps = [];

    const n = arr.length;

    let totalComparisons = 0;
    let totalSwaps = 0;


    /**
     * Create an independent execution snapshot.
     */
    function recordStep({
        action,
        codeLine,
        variables,
        explanation,
        metrics = {},
        metadata = {}
    }) {

        steps.push({

            action,

            state: {
                array: arr.map(item => ({ ...item }))
            },

            codeLine,

            variables: {
                ...variables
            },

            explanation,

            metrics: {
                ...metrics
            },

            metadata: {
                ...metadata
            }

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

            explanation:
                "Starting pass " + (i + 1) + ".",

            metadata: {
                activeIndexes: []
            }

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
                    left: left.value,
                    right: right.value,
                    swapped
                },

                explanation:
                    "Comparing " + left.value +
                    " and " + right.value + ".",

                metrics: {
                    comparisons: 1,
                    arrayAccesses: 2,
                    reads: 2
                },

                metadata: {
                    comparingIndexes: [j, j + 1],
                    activeIndexes: [j, j + 1]
                }

            });


            if (left.value > right.value) {

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
                        left: left.value,
                        right: right.value,
                        temp: temp.value,
                        swapped
                    },

                    explanation:
                        "Swapped " + left.value +
                        " and " + right.value +
                        " because " + left.value +
                        " is greater than " + right.value + ".",

                    metrics: {
                        swaps: 1,
                        assignments: 3,
                        writes: 2
                    },

                    metadata: {
                        swappingIndexes: [j, j + 1],
                        activeIndexes: [j, j + 1]
                    }

                });

            } else {

                recordStep({

                    action: "NO_SWAP",

                    codeLine: 7,

                    variables: {
                        i,
                        j,
                        left: left.value,
                        right: right.value,
                        swapped
                    },

                    explanation:
                        "No swap required because " +
                        left.value + " is not greater than " +
                        right.value + ".",

                    metadata: {
                        comparingIndexes: [j, j + 1]
                    }

                });

            }

        }


        // The final element of this pass is sorted.
        const sortedIndexes = [];

        for (let index = n - i - 1; index < n; index++) {
            sortedIndexes.push(index);
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
                    : "No swaps occurred."),

            metadata: {
                sortedIndexes
            }

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
                    "The array is already sorted, so execution can stop.",

                metadata: {
                    sortedIndexes: arr.map((item, index) => index)
                }

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

        explanation:
            "Bubble Sort completed successfully.",

        metadata: {
            sortedIndexes: arr.map((item, index) => index)
        }

    });


    return {

        algorithmName: "Bubble Sort",

        code: BUBBLE_SORT_CODE,

        initialState,

        steps,

        finalState: {
            array: arr.map(item => ({ ...item }))
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