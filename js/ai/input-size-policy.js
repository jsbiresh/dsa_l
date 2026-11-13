
export const MINIMUM_GENERATED_INPUT_ITEMS = 8;

function hasExplicitInput(question, plan) {
    const text = String(question || "");

    // Explicit sample input from platforms such as LeetCode
    // and Codeforces.
    if (/^\s*(?:sample\s+)?input\s*:/im.test(text)) {
        return true;
    }

    // Explicit collection assignment.
    if (/\b(?:nums?|arr(?:ay)?|values?|input|nodes?|vertices|edges?|matrix|words?|items?)\s*[:=]\s*(?:\[[\s\S]*?\]|\{[\s\S]*?\}|["'][^"']*["'])/i.test(text)) {
        return true;
    }

    // Explicitly stated input cardinality.
    const explicitCountPatterns = [
        /\b(?:exactly|use|with|of|size(?:\s+of)?|length(?:\s+of)?)\s*(\d+)\s*(?:elements?|items?|numbers?|values?|nodes?|vertices?|edges?|entries?|words?|characters?)\b/i,
        /\b(?:array|list|graph|tree|heap|stack|queue|matrix|dataset)\s+of\s+(\d+)\b/i,
        /\bn\s*=\s*\d+\b/i
    ];

    if (explicitCountPatterns.some(pattern => pattern.test(text))) {
        return true;
    }

    // The planner may mark explicitly supplied inputs.
    return plan?.input?.source === "provided";
}

function arrayLength(state, keys) {
    for (const key of keys) {
        const value = state?.[key];

        if (Array.isArray(value)) {
            return value.length;
        }

        if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            return Object.keys(value).length;
        }
    }

    return null;
}

function countTreeNodes(node, visited = new Set()) {
    if (!node || typeof node !== "object" || visited.has(node)) {
        return 0;
    }

    visited.add(node);

    let count = 1;

    for (const key of ["left", "right", "child"]) {
        count += countTreeNodes(node[key], visited);
    }

    if (Array.isArray(node.children)) {
        for (const child of node.children) {
            count += countTreeNodes(child, visited);
        }
    }

    return count;
}

function countLinkedNodes(head) {
    let count = 0;
    let current = head;
    const visited = new Set();

    while (
        current &&
        typeof current === "object" &&
        !visited.has(current)
    ) {
        visited.add(current);
        count++;
        current = current.next ?? null;
    }

    return count;
}

function countMatrixCells(matrix) {
    if (!Array.isArray(matrix)) return null;

    return matrix.reduce(
        (total, row) => total + (
            Array.isArray(row) ? row.length : 1
        ),
        0
    );
}

function countHashEntries(state) {
    if (Array.isArray(state?.entries)) {
        return state.entries.length;
    }

    if (Array.isArray(state?.buckets)) {
        return state.buckets.reduce(
            (total, bucket) =>
                total + (Array.isArray(bucket) ? bucket.length : 0),
            0
        );
    }

    return null;
}

function countGraphVertices(state) {
    const direct = arrayLength(state, [
        "vertices",
        "nodes"
    ]);

    if (direct !== null) return direct;

    const adjacency = state?.adjacencyList ?? state?.adjacency;

    if (
        adjacency &&
        typeof adjacency === "object" &&
        !Array.isArray(adjacency)
    ) {
        return Object.keys(adjacency).length;
    }

    if (Array.isArray(state?.edges)) {
        const vertices = new Set();

        for (const edge of state.edges) {
            if (Array.isArray(edge)) {
                vertices.add(edge[0]);
                vertices.add(edge[1]);
            } else if (edge && typeof edge === "object") {
                if ("from" in edge) vertices.add(edge.from);
                if ("to" in edge) vertices.add(edge.to);
                if ("source" in edge) vertices.add(edge.source);
                if ("target" in edge) vertices.add(edge.target);
            }
        }

        return vertices.size;
    }

    return null;
}

export function getVisualizationItemCount(visualization) {
    const state = visualization?.initialState || {};
    const id = String(
        visualization?.visualizerId ||
        visualization?.structure ||
        ""
    ).toLowerCase();

    if (id.includes("matrix")) {
        return countMatrixCells(state.matrix);
    }

    if (id.includes("graph")) {
        return countGraphVertices(state);
    }

    if (id.includes("linked-list") || id.includes("linked list")) {
        const nodes = arrayLength(state, [
            "nodes",
            "values",
            "items",
            "elements"
        ]);

        if (nodes !== null) return nodes;

        return state.head ? countLinkedNodes(state.head) : null;
    }

    if (
        id.includes("tree") ||
        id.includes("trie")
    ) {
        const nodes = arrayLength(state, [
            "nodes",
            "words",
            "values",
            "items",
            "elements"
        ]);

        if (nodes !== null) return nodes;

        return state.root
            ? countTreeNodes(state.root)
            : null;
    }

    if (id.includes("hash")) {
        return countHashEntries(state);
    }

    if (
        id.includes("stack") ||
        id.includes("queue") ||
        id.includes("heap")
    ) {
        return arrayLength(state, [
            "items",
            "values",
            "elements",
            "array",
            "stack",
            "queue",
            "heap"
        ]);
    }

    return arrayLength(state, [
        "array",
        "values",
        "items",
        "elements",
        "nodes"
    ]);
}

/**
 * Enforce the minimum only for generated primary input data.
 * Explicit user-provided inputs are never padded or modified.
 */
export function assertMinimumGeneratedInputSize(plan, question) {
    if (hasExplicitInput(question, plan)) {
        return {
            exempt: true,
            reason: "Explicit input preserved."
        };
    }

    const visualizations = plan?.visualizations;

    if (!Array.isArray(visualizations) || visualizations.length === 0) {
        throw new Error(
            "Cannot verify input size: the plan has no visualizations."
        );
    }

    const primary = visualizations.filter(
        item => item.role === "primary"
    );

    const targets = primary.length
        ? primary
        : [visualizations[0]];

    for (const visualization of targets) {
        const count = getVisualizationItemCount(visualization);
        const name =
            visualization.structure ||
            visualization.visualizerId ||
            "Primary input";

        if (count === null) {
            throw new Error(
                `DSA_L cannot verify the number of input items for ${name}. ` +
                "The visualization state must expose its input collection."
            );
        }

        if (count < MINIMUM_GENERATED_INPUT_ITEMS) {
            throw new Error(
                `${name} has only ${count} generated input items. ` +
                `DSA_L requires at least ${MINIMUM_GENERATED_INPUT_ITEMS} ` +
                "items when the question does not provide explicit input."
            );
        }
    }

    return {
        exempt: false,
        minimum: MINIMUM_GENERATED_INPUT_ITEMS
    };
}
