/**
 * DSA_L — Visualizer Registry
 *
 * Central catalogue of visualization capabilities.
 *
 * IMPORTANT:
 * This registry describes actual implementation availability.
 * The AI must not assume that a planned visualizer is executable.
 */

export const VISUALIZER_REGISTRY = Object.freeze([

    {
        id: "array",
        name: "Array",
        supportedStructures: [
            "Array"
        ],

        status: "implemented",

        features: [
            "element-rendering",
            "index-labels",
            "element-comparison",
            "active-element-highlighting",
            "comparison-highlighting",
            "swap-highlighting",
            "sorted-element-highlighting",
            "stable-element-identity",
            "physical-element-movement"
        ]
    },

    {
        id: "hash-map",
        name: "Hash Map",
        supportedStructures: [
            "Hash Map",
            "Hash Set"
        ],

        status: "planned",

        features: []
    },

    {
        id: "pointer",
        name: "Pointer",
        supportedStructures: [
            "Array",
            "Linked List",
            "String"
        ],

        status: "planned",

        features: []
    },

    {
        id: "stack",
        name: "Stack",

        supportedStructures: [
            "Stack",
            "Call Stack"
        ],

        status: "planned",

        features: []
    },

    {
        id: "queue",
        name: "Queue",

        supportedStructures: [
            "Queue",
            "Deque"
        ],

        status: "planned",

        features: []
    },

    {
        id: "linked-list",
        name: "Linked List",

        supportedStructures: [
            "Linked List"
        ],

        status: "planned",

        features: []
    },

    {
        id: "tree",
        name: "Tree",

        supportedStructures: [
            "Binary Tree",
            "Binary Search Tree",
            "N-ary Tree",
            "Trie"
        ],

        status: "planned",

        features: []
    },

    {
        id: "heap",
        name: "Heap",

        supportedStructures: [
            "Heap / Priority Queue"
        ],

        status: "planned",

        features: []
    },

    {
        id: "graph",
        name: "Graph",

        supportedStructures: [
            "Graph",
            "Graph Adjacency List",
            "Graph Adjacency Matrix"
        ],

        status: "planned",

        features: []
    },

    {
        id: "matrix",
        name: "Matrix",

        supportedStructures: [
            "Matrix"
        ],

        status: "planned",

        features: []
    }

]);

/**
 * Find a visualizer by ID.
 */
export function getVisualizerById(id) {

    return VISUALIZER_REGISTRY.find(
        visualizer => visualizer.id === id
    ) ?? null;

}

/**
 * Find visualizers capable of representing
 * a particular data structure.
 */
export function getVisualizersForStructure(structureName) {

    return VISUALIZER_REGISTRY.filter(
        visualizer =>
            visualizer.supportedStructures.includes(structureName)
    );

}

/**
 * Return only visualizers that are currently implemented.
 */
export function getImplementedVisualizers() {

    return VISUALIZER_REGISTRY.filter(
        visualizer => visualizer.status === "implemented"
    );

}

/**
 * Return visualization capabilities for AI planning.
 */
export function getVisualizationCapabilities() {

    return VISUALIZER_REGISTRY.map(visualizer => ({

        id: visualizer.id,

        name: visualizer.name,

        supportedStructures: visualizer.supportedStructures,

        status: visualizer.status,

        features: visualizer.features

    }));

}