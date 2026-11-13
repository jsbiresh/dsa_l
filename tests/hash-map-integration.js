
import {
    VisualizationManager
} from "../js/graphics/engine/visualization-manager.js";

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

const input = [2, 7, 12, 18];
const target = 20;
const capacity = 5;

const arrayState = {
    array: input.map((value, index) => ({
        id: `a${index}`,
        value
    }))
};

const entries = {
    two: { id: "entry-2", key: 2, value: 0 },
    seven: { id: "entry-7", key: 7, value: 1 },
    twelve: { id: "entry-12", key: 12, value: 2 }
};

const definitions = [
    {
        id: "array-main",
        structure: "Array",
        visualizerId: "array",
        initialState: arrayState
    },
    {
        id: "hash-main",
        structure: "Hash Map",
        visualizerId: "hash-map",
        initialState: {
            capacity,
            entries: []
        }
    }
];

function hashState(currentEntries) {
    return {
        capacity,
        entries: currentEntries.map(entry => ({ ...entry }))
    };
}

function snapshot(
    action,
    arrayOperation,
    arrayMetadata,
    hashOperation,
    currentEntries,
    hashMetadata,
    explanation,
    variables = {}
) {
    return {
        action,
        codeLine: 0,
        explanation,
        variables,

        visualStates: {
            "array-main": {
                operation: arrayOperation,
                state: structuredClone(arrayState),
                metadata: arrayMetadata
            },

            "hash-main": {
                operation: hashOperation,
                state: hashState(currentEntries),
                metadata: {
                    ...hashMetadata,
                    explanation
                }
            }
        }
    };
}

const snapshots = [
    snapshot(
        "INITIALIZE",
        "render",
        {},
        "render",
        [],
        {},
        "Start with an empty Hash Map.",
        { target }
    ),

    snapshot(
        "HASH CURRENT VALUE",
        "highlight",
        { activeIndexes: [0] },
        "hash",
        [],
        {
            activeKey: 2,
            activeBucketIndex: 2
        },
        "2 % 5 = 2. The current value maps to bucket 2.",
        { index: 0, current: 2, complement: 18 }
    ),

    snapshot(
        "LOOKUP COMPLEMENT",
        "highlight",
        { activeIndexes: [0] },
        "lookup",
        [],
        {
            activeKey: 18,
            lookupKey: 18,
            activeBucketIndex: 3
        },
        "18 % 5 = 3. Bucket 3 is empty, so the complement is absent.",
        { index: 0, current: 2, complement: 18 }
    ),

    snapshot(
        "INSERT VALUE",
        "highlight",
        { activeIndexes: [0] },
        "insert",
        [entries.two],
        {
            activeKey: 2,
            activeBucketIndex: 2,
            insertedEntryIds: ["entry-2"]
        },
        "Insert key 2 with its original array index 0.",
        { index: 0, current: 2 }
    ),

    snapshot(
        "HASH CURRENT VALUE",
        "highlight",
        { activeIndexes: [1] },
        "hash",
        [entries.two],
        {
            activeKey: 7,
            activeBucketIndex: 2,
            collisionBucketIndex: 2
        },
        "7 % 5 = 2. Bucket 2 already contains key 2.",
        { index: 1, current: 7, complement: 13 }
    ),

    snapshot(
        "LOOKUP COMPLEMENT",
        "highlight",
        { activeIndexes: [1] },
        "lookup",
        [entries.two],
        {
            activeKey: 13,
            lookupKey: 13,
            activeBucketIndex: 3
        },
        "13 % 5 = 3. The complement is not present.",
        { index: 1, current: 7, complement: 13 }
    ),

    snapshot(
        "INSERT WITH COLLISION",
        "highlight",
        { activeIndexes: [1] },
        "insert",
        [entries.two, entries.seven],
        {
            activeKey: 7,
            activeBucketIndex: 2,
            collisionBucketIndex: 2,
            insertedEntryIds: ["entry-7"]
        },
        "Insert key 7 into bucket 2. Separate chaining preserves key 2.",
        { index: 1, current: 7 }
    ),

    snapshot(
        "HASH CURRENT VALUE",
        "highlight",
        { activeIndexes: [2] },
        "hash",
        [entries.two, entries.seven],
        {
            activeKey: 12,
            activeBucketIndex: 2,
            collisionBucketIndex: 2
        },
        "12 % 5 = 2. The bucket already contains two entries.",
        { index: 2, current: 12, complement: 8 }
    ),

    snapshot(
        "LOOKUP COMPLEMENT",
        "highlight",
        { activeIndexes: [2] },
        "lookup",
        [entries.two, entries.seven],
        {
            activeKey: 8,
            lookupKey: 8,
            activeBucketIndex: 3
        },
        "8 % 5 = 3. The complement is not present.",
        { index: 2, current: 12, complement: 8 }
    ),

    snapshot(
        "INSERT WITH COLLISION",
        "highlight",
        { activeIndexes: [2] },
        "insert",
        [entries.two, entries.seven, entries.twelve],
        {
            activeKey: 12,
            activeBucketIndex: 2,
            collisionBucketIndex: 2,
            insertedEntryIds: ["entry-12"]
        },
        "Insert key 12 into bucket 2. All three entries are preserved.",
        { index: 2, current: 12 }
    ),

    snapshot(
        "HASH CURRENT VALUE",
        "highlight",
        { activeIndexes: [3] },
        "hash",
        [entries.two, entries.seven, entries.twelve],
        {
            activeKey: 18,
            activeBucketIndex: 3
        },
        "18 % 5 = 3. Calculate the complement: 20 - 18 = 2.",
        { index: 3, current: 18, complement: 2 }
    ),

    snapshot(
        "LOOKUP SUCCESS",
        "highlight",
        { activeIndexes: [3] },
        "lookup",
        [entries.two, entries.seven, entries.twelve],
        {
            activeKey: 2,
            lookupKey: 2,
            activeBucketIndex: 2,
            activeEntryIds: ["entry-2"]
        },
        "Key 2 is found in bucket 2. Its stored index is 0.",
        { index: 3, current: 18, complement: 2, matchingIndex: 0 }
    ),

    snapshot(
        "COMPLETE",
        "complete",
        { activeIndexes: [0, 3] },
        "complete",
        [entries.two, entries.seven, entries.twelve],
        {
            activeBucketIndex: 2,
            activeEntryIds: ["entry-2"]
        },
        "Target 20 found: input[0] + input[3] = 2 + 18 = 20.",
        {
            result: [0, 3],
            values: [2, 18],
            target
        }
    )
];

let currentStep = 0;
let timer = null;
let playing = false;
let transitionQueue = Promise.resolve();

function updateControls() {
    buttons.previous.disabled = currentStep === 0;
    buttons.next.disabled = currentStep === snapshots.length - 1;
    buttons.play.disabled =
        currentStep === snapshots.length - 1;
}

async function showStep(index, animate = true) {
    currentStep = Math.max(
        0,
        Math.min(index, snapshots.length - 1)
    );

    const current = snapshots[currentStep];

    await manager.renderStep(current, { animate });

    const variables = Object.entries(current.variables)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(" · ");

    status.textContent =
        `Step ${currentStep + 1}/${snapshots.length} · ${current.action}` +
        ` — ${current.explanation}` +
        (variables ? ` · ${variables}` : "");

    updateControls();
}

function queueStep(index, animate = true) {
    transitionQueue = transitionQueue
        .then(() => showStep(index, animate))
        .catch(error => {
            console.error("Hash Map playback error:", error);
            status.textContent = `FAIL: ${error.message}`;
            stopPlayback();
        });

    return transitionQueue;
}

function stopPlayback() {
    playing = false;

    if (timer !== null) {
        clearTimeout(timer);
        timer = null;
    }
}

async function playNext() {
    if (!playing) return;

    if (currentStep >= snapshots.length - 1) {
        stopPlayback();
        return;
    }

    await queueStep(currentStep + 1);

    if (playing) {
        timer = setTimeout(playNext, 1200);
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

    if (currentStep >= snapshots.length - 1) {
        await queueStep(0, false);
    }

    playing = true;
    await playNext();
});

try {
    await manager.configure(definitions);

    await showStep(0, false);

    status.textContent =
        `PASS: Array + Hash Map initialized. ` +
        `${snapshots.length} Two Sum snapshots ready.`;

    console.log("Hash Map browser integration initialized.", {
        visualizations: manager.getConfiguredVisualizations(),
        snapshots: snapshots.length
    });

} catch (error) {
    status.textContent = `FAIL: ${error.message}`;
    console.error("Hash Map integration initialization failed:", error);
}
