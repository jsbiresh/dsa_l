import { VisualizationManager } from "../js/graphics/engine/visualization-manager.js";

const workspace = document.getElementById("workspace");
const status = document.getElementById("status");

const buttons = {
    previous: document.getElementById("previous"),
    play: document.getElementById("play"),
    pause: document.getElementById("pause"),
    next: document.getElementById("next"),
    restart: document.getElementById("restart")
};

const manager = new VisualizationManager(workspace);

let currentStep = 0;
let timer = null;
let transitionQueue = Promise.resolve();

const definitions = [
    {
        id: "array-main",
        structure: "Array",
        visualizerId: "array",
        initialState: {
            array: [
                { id: "a1", value: 9 },
                { id: "a2", value: 3 },
                { id: "a3", value: 7 },
                { id: "a4", value: 2 }
            ]
        }
    },
    {
        id: "list-main",
        structure: "Linked List",
        visualizerId: "linked-list",
        initialState: {
            headId: "n1",
            nodes: [
                { id: "n1", value: 10, nextId: "n2" },
                { id: "n2", value: 20, nextId: "n3" },
                { id: "n3", value: 30, nextId: null }
            ]
        }
    },
    {
        id: "tree-main",
        structure: "Binary Tree",
        visualizerId: "tree",
        initialState: {
            rootId: "t1",
            nodes: [
                { id: "t1", value: 20, leftId: "t2", rightId: "t3" },
                { id: "t2", value: 10, leftId: "t4", rightId: "t5" },
                { id: "t3", value: 30, leftId: null, rightId: null },
                { id: "t4", value: 5, leftId: null, rightId: null },
                { id: "t5", value: 15, leftId: null, rightId: null }
            ]
        }
    },
    {
        id: "graph-main",
        structure: "Graph",
        visualizerId: "graph",
        initialState: {
            vertices: [
                { id: "v1", label: "A" },
                { id: "v2", label: "B" },
                { id: "v3", label: "C" },
                { id: "v4", label: "D" },
                { id: "v5", label: "E" }
            ],
            edges: [
                { id: "e1", from: "v1", to: "v2", directed: true },
                { id: "e2", from: "v1", to: "v3", directed: true },
                { id: "e3", from: "v2", to: "v4", directed: true },
                { id: "e4", from: "v3", to: "v5", directed: true }
            ]
        }
    }
];

const initial = Object.fromEntries(
    definitions.map(item => [
        item.id,
        {
            operation: "render",
            state: structuredClone(item.initialState),
            metadata: {}
        }
    ])
);

const stepOne = structuredClone(initial);

stepOne["array-main"] = {
    operation: "compare",
    state: {
        array: [
            { id: "a1", value: 9 },
            { id: "a2", value: 3 },
            { id: "a3", value: 7 },
            { id: "a4", value: 2 }
        ]
    },
    metadata: { comparingIndexes: [0, 1] }
};

stepOne["list-main"].metadata = {
    activeNodeIds: ["n2"]
};

stepOne["tree-main"].metadata = {
    comparingNodeIds: ["t2", "t3"]
};

stepOne["graph-main"].metadata = {
    activeVertexIds: ["v1"],
    frontierVertexIds: ["v2", "v3"],
    activeEdgeIds: ["e1", "e2"]
};

const stepTwo = structuredClone(stepOne);

stepTwo["array-main"] = {
    operation: "swap",
    state: {
        array: [
            { id: "a2", value: 3 },
            { id: "a1", value: 9 },
            { id: "a4", value: 2 },
            { id: "a3", value: 7 }
        ]
    },
    metadata: {
        swappingIndexes: [0, 1],
        activeIndexes: [0, 1]
    }
};

stepTwo["list-main"] = {
    operation: "reverseLink",
    state: {
        headId: "n3",
        nodes: [
            { id: "n3", value: 30, nextId: "n2" },
            { id: "n2", value: 20, nextId: "n1" },
            { id: "n1", value: 10, nextId: null }
        ]
    },
    metadata: {
        updatedNodeIds: ["n3", "n2", "n1"],
        activeNodeIds: ["n3"]
    }
};

stepTwo["tree-main"].metadata = {
    visitedNodeIds: ["t1", "t2"],
    activeNodeIds: ["t2"]
};

stepTwo["graph-main"].metadata = {
    visitedVertexIds: ["v1"],
    activeVertexIds: ["v2"],
    traversedEdgeIds: ["e1"]
};

const stepThree = structuredClone(stepTwo);

stepThree["array-main"] = {
    operation: "markSorted",
    state: {
        array: [
            { id: "a4", value: 2 },
            { id: "a2", value: 3 },
            { id: "a3", value: 7 },
            { id: "a1", value: 9 }
        ]
    },
    metadata: {
        sortedIndexes: [0, 1, 2, 3]
    }
};

stepThree["list-main"].metadata = {
    updatedNodeIds: ["n3", "n2", "n1"]
};

stepThree["tree-main"].metadata = {
    visitedNodeIds: ["t1", "t2", "t3"],
    activeNodeIds: ["t3"]
};

stepThree["graph-main"].metadata = {
    visitedVertexIds: ["v1", "v2", "v3"],
    activeVertexIds: ["v3"],
    frontierVertexIds: ["v4", "v5"],
    traversedEdgeIds: ["e1", "e2"],
    activeEdgeIds: ["e4"]
};

const snapshots = [
    {
        action: "INITIALIZE",
        codeLine: null,
        variables: {},
        visualStates: initial
    },
    {
        action: "COMPARE",
        codeLine: 4,
        variables: { left: 0, right: 1 },
        explanation: "Compare the first two values.",
        visualStates: stepOne
    },
    {
        action: "UPDATE",
        codeLine: 7,
        variables: { left: 1, right: 2 },
        explanation: "Update the structures after the operation.",
        visualStates: stepTwo
    },
    {
        action: "COMPLETE",
        codeLine: 10,
        variables: { completed: true },
        explanation: "The example execution is complete.",
        visualStates: stepThree
    }
];

function updateControls() {
    buttons.previous.disabled = currentStep === 0;
    buttons.next.disabled = currentStep === snapshots.length - 1;
}

async function showStep(index, animate = true) {
    currentStep = Math.max(0, Math.min(index, snapshots.length - 1));

    const snapshot = snapshots[currentStep];

    await manager.renderStep(snapshot, { animate });

    status.textContent =
        `Step ${currentStep + 1}/${snapshots.length} — ${snapshot.action}` +
        (snapshot.variables.left !== undefined
            ? ` · left=${snapshot.variables.left}, right=${snapshot.variables.right}`
            : "");

    updateControls();
}

function queueStep(index, animate = true) {
    transitionQueue = transitionQueue
        .then(() => showStep(index, animate))
        .catch(error => {
            console.error(error);
            status.textContent = `Rendering error: ${error.message}`;
            stopPlayback();
        });

    return transitionQueue;
}

function stopPlayback() {
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }
}

buttons.next.addEventListener("click", () => {
    stopPlayback();
    queueStep(currentStep + 1);
});

buttons.previous.addEventListener("click", () => {
    stopPlayback();
    queueStep(currentStep - 1);
});

buttons.restart.addEventListener("click", () => {
    stopPlayback();
    queueStep(0, false);
});

buttons.pause.addEventListener("click", stopPlayback);

buttons.play.addEventListener("click", async () => {
    stopPlayback();
    await transitionQueue;

    timer = setInterval(() => {
        if (currentStep >= snapshots.length - 1) {
            stopPlayback();
            return;
        }

        queueStep(currentStep + 1);
    }, 1100);
});

try {
    await manager.configure(definitions);
    await showStep(0, false);

    status.textContent =
        "PASS: All four renderers initialized in one workspace.";

    console.log("Graphics integration initialized.", {
        renderers: manager.getConfiguredVisualizations(),
        snapshots: snapshots.length
    });

} catch (error) {
    status.textContent = `Initialization failed: ${error.message}`;
    console.error("Graphics integration test failed:", error);
}

window.addEventListener("beforeunload", () => {
    stopPlayback();
    manager.destroy();
});
