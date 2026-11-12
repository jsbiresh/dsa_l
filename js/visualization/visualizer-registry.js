/**
 * DSA_L — Visualizer Registry
 * Only fully implemented renderers are marked implemented.
 */

export const VISUALIZER_REGISTRY = Object.freeze([
    {
        id: "array",
        name: "Array",
        supportedStructures: ["Array"],
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
        supportedStructures: ["Hash Map", "Hash Set"],
        status: "planned",
        features: []
    },
    {
        id: "pointer",
        name: "Pointer",
        supportedStructures: ["Array", "Linked List", "String"],
        status: "planned",
        features: []
    },
    {
        id: "stack",
        name: "Stack",
        supportedStructures: ["Stack", "Call Stack"],
        status: "planned",
        features: []
    },
    {
        id: "queue",
        name: "Queue",
        supportedStructures: ["Queue", "Deque"],
        status: "planned",
        features: []
    },
    {
        id: "linked-list",
        name: "Linked List",
        supportedStructures: ["Linked List"],
        status: "implemented",
        features: [
            "node-rendering",
            "pointer-connections",
            "head-pointer",
            "active-node-highlighting",
            "comparison-highlighting",
            "link-updating",
            "node-insertion",
            "node-removal",
            "physical-node-movement",
            "null-termination"
        ]
    },
    {
        id: "tree",
        name: "Binary Tree",
        supportedStructures: ["Binary Tree", "Binary Search Tree"],
        status: "implemented",
        features: [
            "node-rendering",
            "parent-child-connections",
            "level-based-layout",
            "active-node-highlighting",
            "visited-node-highlighting",
            "comparison-highlighting",
            "physical-node-movement"
        ]
    },
    {
        id: "heap",
        name: "Heap",
        supportedStructures: ["Heap/Priority Queue"],
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
        status: "implemented",
        features: [
            "vertex-rendering",
            "edge-rendering",
            "directed-edge-rendering",
            "weighted-edge-labels",
            "automatic-layout",
            "custom-positions",
            "active-vertex-highlighting",
            "visited-vertex-highlighting",
            "frontier-highlighting",
            "active-edge-highlighting",
            "traversed-edge-highlighting"
        ]
    },
    {
        id: "matrix",
        name: "Matrix",
        supportedStructures: ["Matrix"],
        status: "planned",
        features: []
    }
]);

export function getVisualizerById(id) {
    return VISUALIZER_REGISTRY.find(
        visualizer => visualizer.id === id
    ) ?? null;
}

export function getVisualizersForStructure(structureName) {
    return VISUALIZER_REGISTRY.filter(
        visualizer => visualizer.supportedStructures.includes(structureName)
    );
}

export function getImplementedVisualizers() {
    return VISUALIZER_REGISTRY.filter(
        visualizer => visualizer.status === "implemented"
    );
}

export function getVisualizationCapabilities() {
    return VISUALIZER_REGISTRY.map(visualizer => ({
        id: visualizer.id,
        name: visualizer.name,
        supportedStructures: visualizer.supportedStructures,
        status: visualizer.status,
        features: visualizer.features
    }));
}
