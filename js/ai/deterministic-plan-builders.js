import { validateVisualizationPlan } from "../visualization/visualization-plan.js";

const SAMPLE_VALUES = [8, 3, 5, 1, 9, 2, 7, 4, 6, 10, 0, 11, 13, 12, 15, 14];

function getRequestedSize(question) {
    const match =
        question.match(/\b(\d{1,2})\s*(?:elements?|items?|numbers?)\b/i) ||
        question.match(/\b(?:size|length)\s*(?:of|is|=)?\s*(\d{1,2})\b/i);

    return match ? Number(match[1] || match[2]) : 8;
}

function parseNumericArray(question) {
    const match = question.match(
        /\[\s*(-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?)+)\s*\]/
    );

    if (!match) return null;

    const values = match[1].split(",").map(Number);

    return values.every(Number.isFinite) ? values : null;
}

export function buildDeterministicBubbleSortPlan(
    question,
    approach,
    availableVisualizers
) {
    if (
        approach?.pattern !== "Sorting" ||
        !Array.isArray(approach.dataStructures) ||
        !Array.isArray(availableVisualizers)
    ) {
        return null;
    }

    const structures = new Set(
        approach.dataStructures.map(item => item.name)
    );
    const visualizers = new Set(
        availableVisualizers.map(item => item.id)
    );

    if (!structures.has("Array") || !visualizers.has("array")) {
        return null;
    }

    const suppliedValues = parseNumericArray(question);
    const generated = suppliedValues === null;
    const requestedSize = getRequestedSize(question);

    // Never silently return fewer values than the user requested.
    if (generated && requestedSize > SAMPLE_VALUES.length) {
        return null;
    }

    const nums = suppliedValues ?? SAMPLE_VALUES.slice(
        0,
        requestedSize
    );

    if (
        nums.length < 2 ||
        nums.length > 16 ||
        !nums.every(Number.isFinite)
    ) {
        return null;
    }

    const descending =
        /\b(descending|decreasing|highest to lowest|largest to smallest)\b/i
            .test(question);

    const order = descending ? "descending" : "ascending";
    const comparison = descending ? "<" : ">";

    const arrayState = {
        array: nums.map((value, index) => ({
            id: `element-${index}`,
            value
        }))
    };

    // Preserve the unsorted input for the initial visualization.
    const initialArrayState = {
        array: arrayState.array.map(item => ({ ...item }))
    };

    const code = [
        "function bubbleSort(values) {",
        "  for (let end = values.length - 1; end > 0; end--) {",
        "    let swapped = false;",
        "    for (let j = 0; j < end; j++) {",
        `      if (values[j] ${comparison} values[j + 1]) {`,
        "        [values[j], values[j + 1]] = [values[j + 1], values[j]];",
        "        swapped = true;",
        "      }",
        "    }",
        "    if (!swapped) break;",
        "  }",
        "  return values;",
        "}"
    ].join("\n");

    const steps = [];
    const sortedIndexes = new Set();

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
        metadata,
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
        `Start Bubble Sort in ${order} order using ${nums.length} values.`,
        { order, length: nums.length },
        "render",
        {}
    );

    for (let end = nums.length - 1; end > 0; end--) {
        let swapped = false;

        for (let j = 0; j < end; j++) {
            const left = arrayState.array[j].value;
            const right = arrayState.array[j + 1].value;
            const shouldSwap = descending ? left < right : left > right;

            addStep(
                "COMPARE_ELEMENTS",
                4,
                `Compare ${left} and ${right}. ${
                    shouldSwap
                        ? "They are out of order."
                        : "They are already in the correct relative order."
                }`,
                { passEnd: end, leftIndex: j, rightIndex: j + 1, left, right },
                "compare",
                {
                    activeIndexes: [j, j + 1],
                    comparingIndexes: [j, j + 1]
                },
                { comparisons: 1 }
            );

            if (shouldSwap) {
                [
                    arrayState.array[j],
                    arrayState.array[j + 1]
                ] = [
                    arrayState.array[j + 1],
                    arrayState.array[j]
                ];

                swapped = true;

                addStep(
                    "SWAP_ELEMENTS",
                    5,
                    `Swap ${left} and ${right} because they are in the wrong order.`,
                    { passEnd: end, leftIndex: j, rightIndex: j + 1 },
                    "swap",
                    {
                        activeIndexes: [j, j + 1],
                        swappingIndexes: [j, j + 1]
                    },
                    { swaps: 1 }
                );
            }
        }

        sortedIndexes.add(end);

        if (!swapped) {
            for (let index = 0; index < end; index++) {
                sortedIndexes.add(index);
            }
        }

        addStep(
            "MARK_SORTED",
            1,
            `Pass complete. Position ${end} is now in its final sorted position.`,
            { passEnd: end, sortedIndexes: [...sortedIndexes].sort((a, b) => a - b) },
            "markSorted",
            {
                sortedIndexes: [...sortedIndexes].sort((a, b) => a - b)
            }
        );

        if (!swapped) break;
    }

    for (let index = 0; index < nums.length; index++) {
        sortedIndexes.add(index);
    }

    addStep(
        "SORT_COMPLETE",
        11,
        `Bubble Sort completed. The array is sorted in ${order} order.`,
        {
            order,
            result: arrayState.array.map(item => item.value)
        },
        "complete",
        {
            sortedIndexes: [...sortedIndexes].sort((a, b) => a - b)
        }
    );

    const rawPlan = {
        schemaVersion: 1,
        requestSummary:
            `Bubble Sort ${nums.length} numeric values in ${order} order.`,
        selectedApproach: {
            pattern: "Sorting",
            applicability: approach.applicability,
            reason: approach.reason || "Bubble Sort repeatedly compares adjacent values and swaps out-of-order pairs.",
            conditions: Array.isArray(approach.conditions)
                ? [...approach.conditions]
                : []
        },
        complexity: {
            time: "O(n²) worst case; O(n) best case",
            space: "O(1)"
        },
        input: {
            source: generated ? "generated" : "provided",
            parameters: {
                array: [...nums],
                order,
                algorithm: "Bubble Sort"
            },
            constraints: [
                "Numeric array",
                "Bubble Sort",
                `Sort in ${order} order`,
                ...(generated ? ["Illustrative sample values generated because no values were supplied."] : [])
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
                initialState: initialArrayState
            }
        ],
        steps,
        confidence: 1
    };

    return validateVisualizationPlan(rawPlan);
}

/**
 * Builds deterministic Selection Sort or Insertion Sort plans.
 * Both use the existing Array visualization contract.
 */
function buildAdditionalSortingPlan(
    question,
    approach,
    availableVisualizers,
    algorithm
) {
    if (
        approach?.pattern !== "Sorting" ||
        !Array.isArray(approach.dataStructures) ||
        !Array.isArray(availableVisualizers)
    ) {
        return null;
    }

    const hasArray = approach.dataStructures.some(
        item => item.name === "Array"
    );
    const hasArrayVisualizer = availableVisualizers.some(
        item => item.id === "array"
    );

    if (!hasArray || !hasArrayVisualizer) return null;

    const suppliedValues = parseNumericArray(question);
    const generated = suppliedValues === null;
    const requestedSize = getRequestedSize(question);

    if (generated && requestedSize > SAMPLE_VALUES.length) return null;

    const nums = suppliedValues ?? SAMPLE_VALUES.slice(0, requestedSize);

    if (nums.length < 2 || nums.length > 16 || !nums.every(Number.isFinite)) {
        return null;
    }

    const descending =
        /\b(descending|decreasing|highest to lowest|largest to smallest)\b/i
            .test(question);

    const order = descending ? "descending" : "ascending";
    const arrayState = {
        array: nums.map((value, index) => ({
            id: `element-${index}`,
            value
        }))
    };

    const initialArrayState = {
        array: arrayState.array.map(item => ({ ...item }))
    };

    const steps = [];
    const code = algorithm === "Selection Sort"
        ? [
            "function selectionSort(values) {",
            "  for (let i = 0; i < values.length - 1; i++) {",
            "    let minIndex = i;",
            "    for (let j = i + 1; j < values.length; j++) {",
            `      if (${descending ? "values[j] > values[minIndex]" : "values[j] < values[minIndex]"}) {`,
            "        minIndex = j;",
            "      }",
            "    }",
            "    if (minIndex !== i) {",
            "      [values[i], values[minIndex]] = [values[minIndex], values[i]];",
            "    }",
            "  }",
            "  return values;",
            "}"
        ].join("\n")
        : [
            "function insertionSort(values) {",
            "  for (let i = 1; i < values.length; i++) {",
            "    let j = i;",
            `    while (j > 0 && ${descending ? "values[j - 1] < values[j]" : "values[j - 1] > values[j]"}) {`,
            "      [values[j - 1], values[j]] = [values[j], values[j - 1]];",
            "      j--;",
            "    }",
            "  }",
            "  return values;",
            "}"
        ].join("\n");

    function addStep(action, codeLine, explanation, variables,
                     operation, metadata, metrics = {}) {
        steps.push({
            action,
            codeLine,
            explanation,
            variables,
            metrics,
            visualStates: {
                "array-main": {
                    operation,
                    state: {
                        array: arrayState.array.map(item => ({ ...item }))
                    },
                    metadata
                }
            }
        });
    }

    addStep(
        "INITIALIZE",
        0,
        `Start ${algorithm} in ${order} order with ${nums.length} elements.`,
        { order, length: nums.length },
        "render",
        {}
    );

    if (algorithm === "Selection Sort") {
        for (let i = 0; i < nums.length - 1; i++) {
            let minIndex = i;

            for (let j = i + 1; j < nums.length; j++) {
                const previousMin = minIndex;
                const left = arrayState.array[j].value;
                const right = arrayState.array[minIndex].value;

                const better = descending
                    ? left > right
                    : left < right;

                if (better) minIndex = j;

                addStep(
                    "FIND_MINIMUM",
                    4,
                    better
                        ? `${left} is a better candidate than ${right}. Update the selected minimum.`
                        : `${left} is not a better candidate than ${right}. Keep the current minimum.`,
                    { position: i, index: j, minIndex, candidate: left },
                    "compare",
                    {
                        activeIndexes: [j, minIndex],
                        comparingIndexes: [j, previousMin]
                    },
                    { comparisons: 1 }
                );
            }

            if (minIndex !== i) {
                const oldValue = arrayState.array[i].value;
                const newValue = arrayState.array[minIndex].value;

                [
                    arrayState.array[i],
                    arrayState.array[minIndex]
                ] = [
                    arrayState.array[minIndex],
                    arrayState.array[i]
                ];

                addStep(
                    "PLACE_SELECTED_VALUE",
                    9,
                    `Place ${newValue} at position ${i} by swapping it with ${oldValue}.`,
                    { position: i, minIndex, placedValue: newValue },
                    "swap",
                    {
                        activeIndexes: [i, minIndex],
                        swappingIndexes: [i, minIndex]
                    },
                    { swaps: 1 }
                );
            }

            addStep(
                "MARK_POSITION_SORTED",
                1,
                `Position ${i} is now in its final sorted position.`,
                { sortedPosition: i },
                "markSorted",
                {
                    sortedIndexes: Array.from({ length: i + 1 }, (_, k) => k)
                }
            );
        }
    } else {
        // Insertion Sort using adjacent swaps.
        // This preserves the same in-place O(1)-space algorithm.
        for (let i = 1; i < nums.length; i++) {
            let j = i;

            while (j > 0) {
                const left = arrayState.array[j - 1].value;
                const right = arrayState.array[j].value;

                const shouldSwap = descending
                    ? left < right
                    : left > right;

                addStep(
                    "COMPARE_ADJACENT",
                    3,
                    shouldSwap
                        ? `${left} and ${right} are out of order. Move ${right} left into the sorted prefix.`
                        : `${left} and ${right} are in the correct relative order. The current insertion is complete.`,
                    { insertionIndex: i, leftIndex: j - 1, rightIndex: j, left, right },
                    "compare",
                    {
                        activeIndexes: [j - 1, j],
                        comparingIndexes: [j - 1, j]
                    },
                    { comparisons: 1 }
                );

                if (!shouldSwap) break;

                [
                    arrayState.array[j - 1],
                    arrayState.array[j]
                ] = [
                    arrayState.array[j],
                    arrayState.array[j - 1]
                ];

                addStep(
                    "SHIFT_ELEMENT",
                    4,
                    `Move ${right} one position left using an adjacent swap.`,
                    { insertionIndex: i, fromIndex: j, toIndex: j - 1 },
                    "swap",
                    {
                        activeIndexes: [j - 1, j],
                        swappingIndexes: [j - 1, j]
                    },
                    { swaps: 1 }
                );

                j--;
            }
        }
    }

    const allIndexes = Array.from(
        { length: nums.length },
        (_, index) => index
    );

    addStep(
        "MARK_ALL_SORTED",
        algorithm === "Selection Sort" ? 12 : 8,
        `All elements are now sorted in ${order} order.`,
        {
            order,
            result: arrayState.array.map(item => item.value)
        },
        "markSorted",
        { sortedIndexes: allIndexes }
    );

    addStep(
        "SORT_COMPLETE",
        algorithm === "Selection Sort" ? 12 : 8,
        `${algorithm} completed successfully.`,
        {
            order,
            result: arrayState.array.map(item => item.value)
        },
        "complete",
        { sortedIndexes: allIndexes }
    );

    const rawPlan = {
        schemaVersion: 1,
        requestSummary: `${algorithm} ${nums.length} elements in ${order} order.`,
        selectedApproach: {
            pattern: "Sorting",
            applicability: approach.applicability,
            reason: approach.reason || `${algorithm} sorts an array by repeatedly selecting or inserting elements into their correct positions.`,
            conditions: Array.isArray(approach.conditions)
                ? [...approach.conditions]
                : []
        },
        complexity: {
            time: "O(n²)",
            space: "O(1)"
        },
        input: {
            source: generated ? "generated" : "provided",
            parameters: {
                array: [...nums],
                order,
                algorithm
            },
            constraints: [
                "Numeric array",
                algorithm,
                `Sort in ${order} order`
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
                initialState: initialArrayState
            }
        ],
        steps,
        confidence: 1
    };

    return validateVisualizationPlan(rawPlan);
}

export function buildDeterministicSortingPlan(
    question,
    approach,
    availableVisualizers
) {
    if (/\bheap\s*sort\b/i.test(question)) {
        return buildDeterministicHeapSortPlan(
            question, approach, availableVisualizers
        );
    }

    if (/\bquick\s*sort\b/i.test(question)) {
        return buildDeterministicQuickSortPlan(
            question, approach, availableVisualizers
        );
    }

    if (/\bmerge\s*sort\b/i.test(question)) {
        return buildDeterministicMergeSortPlan(
            question, approach, availableVisualizers
        );
    }

    if (/\bselection\s*sort\b/i.test(question)) {
        return buildAdditionalSortingPlan(
            question, approach, availableVisualizers, "Selection Sort"
        );
    }

    if (/\binsertion\s*sort\b/i.test(question)) {
        return buildAdditionalSortingPlan(
            question, approach, availableVisualizers, "Insertion Sort"
        );
    }

    return buildDeterministicBubbleSortPlan(
        question, approach, availableVisualizers
    );
}


function buildDeterministicHeapSortPlan(question, approach, availableVisualizers) {
    if (
        approach?.pattern !== "Sorting" ||
        !approach.dataStructures?.some(item => item.name === "Array") ||
        !availableVisualizers?.some(item => item.id === "array")
    ) {
        return null;
    }

    const suppliedValues = parseNumericArray(question);
    const generated = suppliedValues === null;
    const requestedSize = getRequestedSize(question);

    if (generated && requestedSize > SAMPLE_VALUES.length) return null;

    const nums = suppliedValues ?? SAMPLE_VALUES.slice(0, requestedSize);

    if (nums.length < 2 || nums.length > 16 || !nums.every(Number.isFinite)) {
        return null;
    }

    const descending =
        /\b(descending|decreasing|highest to lowest|largest to smallest)\b/i
            .test(question);

    const order = descending ? "descending" : "ascending";

    // Ascending: max heap. Descending: min heap.
    const array = nums.map((value, index) => ({
        id: `element-${index}`,
        value
    }));

    const initialState = {
        array: array.map(item => ({ ...item }))
    };

    const code = [
        "function heapSort(values) {",
        "  const n = values.length;",
        "  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {",
        "    heapify(values, n, i);",
        "  }",
        "  for (let end = n - 1; end > 0; end--) {",
        "    [values[0], values[end]] = [values[end], values[0]];",
        "    heapify(values, end, 0);",
        "  }",
        "  return values;",
        "}",
        "",
        "function heapify(values, size, root) {",
        "  while (true) {",
        "    let selected = root;",
        "    const left = 2 * root + 1;",
        "    const right = 2 * root + 2;",
        `    if (left < size && values[left] ${descending ? "<" : ">"} values[selected]) selected = left;`,
        `    if (right < size && values[right] ${descending ? "<" : ">"} values[selected]) selected = right;`,
        "    if (selected === root) break;",
        "    [values[root], values[selected]] = [values[selected], values[root]];",
        "    root = selected;",
        "  }",
        "}"
    ].join("\n");

    const steps = [];
    const sortedIndexes = new Set();

    function snapshot() {
        return {
            array: array.map(item => ({ ...item }))
        };
    }

    function addStep(action, codeLine, explanation, variables,
                     operation, metadata, metrics = {}) {
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

    function shouldMoveChild(childValue, selectedValue) {
        return descending
            ? childValue < selectedValue
            : childValue > selectedValue;
    }

    function heapify(size, initialRoot) {
        let root = initialRoot;

        while (true) {
            let selected = root;
            const left = 2 * root + 1;
            const right = 2 * root + 2;

            if (left < size) {
                const child = array[left].value;
                const current = array[selected].value;
                const moveChild = shouldMoveChild(child, current);

                addStep(
                    "COMPARE_LEFT_CHILD",
                    16,
                    `Compare left child ${child} at index ${left} with ${current} at index ${selected}.`,
                    { root, left, selected, child, current, heapSize: size },
                    "compare",
                    {
                        activeIndexes: [root, left, selected],
                        comparingIndexes: [left, selected]
                    },
                    { comparisons: 1 }
                );

                if (moveChild) selected = left;
            }

            if (right < size) {
                const child = array[right].value;
                const current = array[selected].value;
                const moveChild = shouldMoveChild(child, current);

                addStep(
                    "COMPARE_RIGHT_CHILD",
                    17,
                    `Compare right child ${child} at index ${right} with the current candidate ${current}.`,
                    { root, right, selected, child, current, heapSize: size },
                    "compare",
                    {
                        activeIndexes: [root, right, selected],
                        comparingIndexes: [right, selected]
                    },
                    { comparisons: 1 }
                );

                if (moveChild) selected = right;
            }

            if (selected === root) break;

            const parentValue = array[root].value;
            const childValue = array[selected].value;

            [
                array[root],
                array[selected]
            ] = [
                array[selected],
                array[root]
            ];

            addStep(
                "HEAPIFY_SWAP",
                19,
                `Move ${childValue} to heap position ${root} and ${parentValue} to position ${selected}.`,
                { root, selected, parentValue, childValue, heapSize: size },
                "swap",
                {
                    activeIndexes: [root, selected],
                    swappingIndexes: [root, selected]
                },
                { swaps: 1 }
            );

            root = selected;
        }
    }

    addStep(
        "INITIALIZE",
        0,
        `Start Heap Sort in ${order} order. The array represents a binary heap.`,
        {
            order,
            length: nums.length,
            heapType: descending ? "min heap" : "max heap"
        },
        "render",
        {}
    );

    // Build the initial max heap or min heap.
    for (let i = Math.floor(array.length / 2) - 1; i >= 0; i--) {
        addStep(
            "BUILD_HEAP",
            2,
            `Restore the heap property starting at parent index ${i}.`,
            { root: i, heapSize: array.length },
            "highlight",
            {
                activeIndexes: [i, 2 * i + 1, 2 * i + 2]
                    .filter(index => index < array.length)
            }
        );

        heapify(array.length, i);
    }

    addStep(
        "HEAP_BUILT",
        4,
        `The ${descending ? "min" : "max"} heap has been constructed.`,
        { heapSize: array.length },
        "highlight",
        {
            activeIndexes: [0],
        }
    );

    // Repeatedly move the root to the end of the active heap.
    for (let end = array.length - 1; end > 0; end--) {
        const rootValue = array[0].value;
        const endValue = array[end].value;

        [
            array[0],
            array[end]
        ] = [
            array[end],
            array[0]
        ];

        addStep(
            "EXTRACT_ROOT",
            6,
            `Move root value ${rootValue} to final position ${end}, then reduce the active heap.`,
            { rootValue, endValue, finalIndex: end, newHeapSize: end },
            "swap",
            {
                activeIndexes: [0, end],
                swappingIndexes: [0, end]
            },
            { swaps: 1 }
        );

        sortedIndexes.add(end);

        addStep(
            "MARK_EXTRACTED",
            6,
            `Position ${end} now contains a finalized sorted value.`,
            { sortedIndexes: [...sortedIndexes].sort((a, b) => a - b) },
            "markSorted",
            {
                sortedIndexes: [...sortedIndexes].sort((a, b) => a - b)
            }
        );

        heapify(end, 0);
    }

    sortedIndexes.add(0);

    const result = array.map(item => item.value);

    addStep(
        "SORT_COMPLETE",
        9,
        `Heap Sort completed successfully in ${order} order.`,
        { order, result },
        "complete",
        {
            sortedIndexes: Array.from(
                { length: array.length },
                (_, index) => index
            )
        }
    );

    const rawPlan = {
        schemaVersion: 1,
        requestSummary: `Heap Sort ${nums.length} elements in ${order} order.`,
        selectedApproach: {
            pattern: "Sorting",
            applicability: approach.applicability,
            reason: approach.reason || "Heap Sort builds a binary heap and repeatedly extracts its root.",
            conditions: approach.conditions || []
        },
        complexity: {
            time: "O(n log n)",
            space: "O(1)"
        },
        input: {
            source: generated ? "generated" : "provided",
            parameters: {
                array: [...nums],
                order,
                algorithm: "Heap Sort",
                heapType: descending ? "min heap" : "max heap"
            },
            constraints: [
                "Numeric array",
                "Heap Sort",
                "Binary heap represented by array indexes",
                `Sort in ${order} order`
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
                initialState
            }
        ],
        steps,
        confidence: 1
    };

    return validateVisualizationPlan(rawPlan);
}

function buildDeterministicMergeSortPlan(question, approach, availableVisualizers) {
    if (
        approach?.pattern !== "Sorting" ||
        !approach.dataStructures?.some(item => item.name === "Array") ||
        !availableVisualizers?.some(item => item.id === "array")
    ) return null;

    const supplied = parseNumericArray(question);
    const generated = supplied === null;
    const requestedSize = getRequestedSize(question);

    if (generated && requestedSize > SAMPLE_VALUES.length) return null;

    const nums = supplied ?? SAMPLE_VALUES.slice(0, requestedSize);
    if (nums.length < 2 || nums.length > 16 || !nums.every(Number.isFinite)) return null;

    const descending =
        /\b(descending|decreasing|highest to lowest|largest to smallest)\b/i.test(question);
    const order = descending ? "descending" : "ascending";

    const array = nums.map((value, index) => ({
        id: `element-${index}`,
        value
    }));

    const initialState = {
        array: array.map(item => ({ ...item }))
    };

    const code = [
        "function mergeSort(values, start = 0, end = values.length - 1) {",
        "  if (start >= end) return;",
        "  const mid = Math.floor((start + end) / 2);",
        "  mergeSort(values, start, mid);",
        "  mergeSort(values, mid + 1, end);",
        "  const left = values.slice(start, mid + 1);",
        "  const right = values.slice(mid + 1, end + 1);",
        "  let i = 0, j = 0, k = start;",
        "  while (i < left.length && j < right.length) {",
        `    if (left[i] ${descending ? ">=" : "<="} right[j]) {`,
        "      values[k++] = left[i++];",
        "    } else {",
        "      values[k++] = right[j++];",
        "    }",
        "  }",
        "  while (i < left.length) values[k++] = left[i++];",
        "  while (j < right.length) values[k++] = right[j++];",
        "}"
    ].join("\n");

    const steps = [];
    const sortedIndexes = new Set();

    function addStep(action, codeLine, explanation, variables, operation, metadata, metrics = {}) {
        steps.push({
            action,
            codeLine,
            explanation,
            variables,
            metrics,
            visualStates: {
                "array-main": {
                    operation,
                    state: {
                        array: array.map(item => ({ ...item }))
                    },
                    metadata
                }
            }
        });
    }

    addStep(
        "INITIALIZE", 0,
        `Start Merge Sort in ${order} order with ${nums.length} values.`,
        { order, length: nums.length }, "render", {}
    );

    function mergeRange(start, end) {
        if (start >= end) return;

        const mid = Math.floor((start + end) / 2);

        addStep(
            "DIVIDE_ARRAY", 2,
            `Divide range [${start}, ${end}] at midpoint ${mid}.`,
            { start, mid, end },
            "highlight",
            {
                activeIndexes: Array.from(
                    { length: end - start + 1 },
                    (_, index) => start + index
                )
            }
        );

        mergeRange(start, mid);
        mergeRange(mid + 1, end);

        const left = array.slice(start, mid + 1);
        const right = array.slice(mid + 1, end + 1);
        let i = 0;
        let j = 0;
        let k = start;

        addStep(
            "BEGIN_MERGE", 5,
            `Merge sorted ranges [${start}, ${mid}] and [${mid + 1}, ${end}].`,
            { start, mid, end }, "highlight",
            {
                activeIndexes: Array.from(
                    { length: end - start + 1 },
                    (_, index) => start + index
                )
            }
        );

        while (i < left.length && j < right.length) {
            const leftValue = left[i].value;
            const rightValue = right[j].value;
            const takeLeft = descending
                ? leftValue >= rightValue
                : leftValue <= rightValue;

            addStep(
                "COMPARE_MERGE_VALUES", 9,
                `Compare ${leftValue} with ${rightValue} from the two sorted halves.`,
                { leftValue, rightValue, destination: k },
                "compare",
                {
                    activeIndexes: [start + i, mid + 1 + j],
                    comparingIndexes: [start + i, mid + 1 + j]
                },
                { comparisons: 1 }
            );

            const selected = takeLeft ? left[i++] : right[j++];
            array[k] = selected;

            addStep(
                "WRITE_MERGED_VALUE", takeLeft ? 10 : 12,
                `Write ${selected.value} into array index ${k}.`,
                { value: selected.value, destination: k },
                "highlight",
                { activeIndexes: [k] },
                { writes: 1 }
            );
            k++;
        }

        while (i < left.length) {
            const selected = left[i++];
            array[k] = selected;

            addStep(
                "COPY_LEFT_REMAINDER", 16,
                `Copy remaining left value ${selected.value} into index ${k}.`,
                { value: selected.value, destination: k },
                "highlight", { activeIndexes: [k] }, { writes: 1 }
            );
            k++;
        }

        while (j < right.length) {
            const selected = right[j++];
            array[k] = selected;

            addStep(
                "COPY_RIGHT_REMAINDER", 17,
                `Copy remaining right value ${selected.value} into index ${k}.`,
                { value: selected.value, destination: k },
                "highlight", { activeIndexes: [k] }, { writes: 1 }
            );
            k++;
        }

        for (let index = start; index <= end; index++) {
            sortedIndexes.add(index);
        }

        addStep(
            "MERGE_COMPLETE", 17,
            `Range [${start}, ${end}] is now merged and sorted.`,
            { start, end },
            "markSorted",
            { sortedIndexes: [...sortedIndexes].sort((a, b) => a - b) }
        );
    }

    mergeRange(0, array.length - 1);

    addStep(
        "SORT_COMPLETE", 17,
        `Merge Sort completed in ${order} order.`,
        { order, result: array.map(item => item.value) },
        "complete",
        {
            sortedIndexes: Array.from(
                { length: array.length },
                (_, index) => index
            )
        }
    );

    return validateVisualizationPlan({
        schemaVersion: 1,
        requestSummary: `Merge Sort ${nums.length} values in ${order} order.`,
        selectedApproach: {
            pattern: "Sorting",
            applicability: approach.applicability,
            reason: approach.reason || "Merge Sort divides the array and merges sorted halves.",
            conditions: approach.conditions || []
        },
        complexity: {
            time: "O(n log n)",
            space: "O(n)"
        },
        input: {
            source: generated ? "generated" : "provided",
            parameters: { array: [...nums], order, algorithm: "Merge Sort" },
            constraints: ["Numeric array", "Merge Sort", `Sort in ${order} order`]
        },
        code: { language: "javascript", source: code },
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


function buildDeterministicQuickSortPlan(question, approach, availableVisualizers) {
    if (
        approach?.pattern !== "Sorting" ||
        !approach.dataStructures?.some(item => item.name === "Array") ||
        !availableVisualizers?.some(item => item.id === "array")
    ) return null;

    const supplied = parseNumericArray(question);
    const generated = supplied === null;
    const requestedSize = getRequestedSize(question);

    if (generated && requestedSize > SAMPLE_VALUES.length) return null;

    const nums = supplied ?? SAMPLE_VALUES.slice(0, requestedSize);
    if (nums.length < 2 || nums.length > 16 || !nums.every(Number.isFinite)) return null;

    const descending =
        /\b(descending|decreasing|highest to lowest|largest to smallest)\b/i.test(question);
    const order = descending ? "descending" : "ascending";

    const array = nums.map((value, index) => ({
        id: `element-${index}`,
        value
    }));

    const initialState = {
        array: array.map(item => ({ ...item }))
    };

    const code = [
        "function quickSort(values, low = 0, high = values.length - 1) {",
        "  if (low >= high) return;",
        "  const pivot = values[high];",
        "  let boundary = low;",
        "  for (let j = low; j < high; j++) {",
        `    if (values[j] ${descending ? ">=" : "<="} pivot) {`,
        "      [values[boundary], values[j]] = [values[j], values[boundary]];",
        "      boundary++;",
        "    }",
        "  }",
        "  [values[boundary], values[high]] = [values[high], values[boundary]];",
        "  quickSort(values, low, boundary - 1);",
        "  quickSort(values, boundary + 1, high);",
        "}"
    ].join("\n");

    const steps = [];
    const sortedIndexes = new Set();

    function addStep(action, codeLine, explanation, variables, operation, metadata, metrics = {}) {
        steps.push({
            action,
            codeLine,
            explanation,
            variables,
            metrics,
            visualStates: {
                "array-main": {
                    operation,
                    state: {
                        array: array.map(item => ({ ...item }))
                    },
                    metadata
                }
            }
        });
    }

    addStep(
        "INITIALIZE", 0,
        `Start Quick Sort using Lomuto partitioning in ${order} order.`,
        { order, length: nums.length, pivotStrategy: "last element" },
        "render", {}
    );

    function quickSort(low, high) {
        if (low >= high) {
            if (low === high) sortedIndexes.add(low);
            return;
        }

        const pivot = array[high].value;
        let boundary = low;

        addStep(
            "SELECT_PIVOT", 2,
            `Choose ${pivot} at index ${high} as the pivot for range [${low}, ${high}].`,
            { low, high, pivot },
            "highlight",
            { activeIndexes: [high] }
        );

        for (let j = low; j < high; j++) {
            const current = array[j].value;
            const belongsBefore = descending
                ? current >= pivot
                : current <= pivot;

            if (belongsBefore && boundary !== j) {
                [
                    array[boundary],
                    array[j]
                ] = [
                    array[j],
                    array[boundary]
                ];

                addStep(
                    "PARTITION_SWAP", 6,
                    `Compare ${current} with pivot ${pivot}; swap it into index ${boundary}.`,
                    { low, high, pivot, current, j, boundary },
                    "swap",
                    {
                        activeIndexes: [boundary, j, high],
                        swappingIndexes: [boundary, j]
                    },
                    { comparisons: 1, swaps: 1 }
                );
            } else {
                addStep(
                    "PARTITION_COMPARE", 5,
                    belongsBefore
                        ? `${current} belongs before the pivot and is already correctly placed.`
                        : `${current} belongs on the other side of pivot ${pivot}.`,
                    { low, high, pivot, current, j, boundary },
                    "compare",
                    {
                        activeIndexes: [j, high],
                        comparingIndexes: [j, high]
                    },
                    { comparisons: 1 }
                );
            }

            if (belongsBefore) boundary++;
        }

        if (boundary !== high) {
            [
                array[boundary],
                array[high]
            ] = [
                array[high],
                array[boundary]
            ];

            addStep(
                "PLACE_PIVOT", 10,
                `Place pivot ${pivot} at its final index ${boundary}.`,
                { low, high, pivot, pivotIndex: boundary },
                "swap",
                {
                    activeIndexes: [boundary, high],
                    swappingIndexes: [boundary, high]
                },
                { swaps: 1 }
            );
        } else {
            addStep(
                "PLACE_PIVOT", 10,
                `Pivot ${pivot} is already at its final index ${boundary}.`,
                { low, high, pivot, pivotIndex: boundary },
                "highlight",
                { activeIndexes: [boundary] }
            );
        }

        sortedIndexes.add(boundary);

        addStep(
            "PIVOT_FINALIZED", 11,
            `Pivot ${pivot} is finalized. Continue with the left and right partitions.`,
            { low, high, pivot, pivotIndex: boundary },
            "markSorted",
            { sortedIndexes: [...sortedIndexes].sort((a, b) => a - b) }
        );

        quickSort(low, boundary - 1);
        quickSort(boundary + 1, high);
    }

    quickSort(0, array.length - 1);

    addStep(
        "SORT_COMPLETE", 13,
        `Quick Sort completed in ${order} order.`,
        { order, result: array.map(item => item.value) },
        "complete",
        {
            sortedIndexes: Array.from(
                { length: array.length },
                (_, index) => index
            )
        }
    );

    return validateVisualizationPlan({
        schemaVersion: 1,
        requestSummary: `Quick Sort ${nums.length} values in ${order} order.`,
        selectedApproach: {
            pattern: "Sorting",
            applicability: approach.applicability,
            reason: approach.reason || "Quick Sort partitions the array around a pivot and recursively sorts both partitions.",
            conditions: approach.conditions || []
        },
        complexity: {
            time: "O(n log n) average; O(n²) worst case",
            space: "O(log n) average; O(n) worst case"
        },
        input: {
            source: generated ? "generated" : "provided",
            parameters: {
                array: [...nums],
                order,
                algorithm: "Quick Sort",
                pivotStrategy: "last element (Lomuto)"
            },
            constraints: ["Numeric array", "Lomuto partitioning", `Sort in ${order} order`]
        },
        code: { language: "javascript", source: code },
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
