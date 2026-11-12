/**
 * DSA_L — Visualization Plan Contract
 *
 * Defines and validates the structured instructions that
 * AI-generated visualization plans must follow.
 *
 * IMPORTANT:
 * - AI-generated JavaScript is never executed.
 * - Only registered visualization capabilities are accepted.
 * - Every execution step must contain a complete state snapshot.
 * - Code line references are zero-based.
 */

import { PATTERNS } from "../registry/pattern-registry.js";

import { DATA_STRUCTURES } from "../registry/data-structure-registry.js";

import {
    getVisualizerById
} from "./visualizer-registry.js";


export const PLAN_CONFIG = Object.freeze({
    schemaVersion: 1,
    maximumSteps: 250,
    maximumVisualizations: 6,
    maximumCodeLength: 20000
});


/**
 * Operations currently supported by each implemented visualizer.
 *
 * A planned visualizer cannot accept operations until
 * its implementation and capabilities are added.
 */
const VISUALIZER_OPERATIONS = Object.freeze({
    array: {
        render: ["element-rendering"],
        compare: ["element-comparison", "comparison-highlighting"],
        highlight: ["active-element-highlighting"],
        swap: ["swap-highlighting", "physical-element-movement"],
        markSorted: ["sorted-element-highlighting"],
        complete: ["element-rendering"]
    },

    "linked-list": {
        render: ["node-rendering", "pointer-connections"],
        highlight: ["active-node-highlighting"],
        compare: ["comparison-highlighting"],
        updateLink: ["link-updating"],
        reverseLink: ["link-updating"],
        insertNode: ["node-insertion", "node-rendering"],
        removeNode: ["node-removal"],
        complete: ["node-rendering"]
    },

    tree: {
        render: ["node-rendering", "parent-child-connections"],
        highlight: ["active-node-highlighting"],
        compare: ["comparison-highlighting"],
        visit: ["visited-node-highlighting"],
        complete: ["node-rendering"]
    },

    graph: {
        render: ["vertex-rendering", "edge-rendering"],
        highlight: ["active-vertex-highlighting"],
        compare: ["active-vertex-highlighting"],
        visit: ["visited-vertex-highlighting"],
        enqueue: ["frontier-highlighting"],
        traverseEdge: ["active-edge-highlighting"],
        complete: ["vertex-rendering"]
    }
});


export class VisualizationPlanError extends Error {

    constructor(message, code = "INVALID_PLAN") {
        super(message);

        this.name = "VisualizationPlanError";
        this.code = code;
    }

}


/**
 * Public validation entry point.
 *
 * @param {object} rawPlan AI-generated visualization plan.
 * @returns {object} Validated independent plan.
 */
export function validateVisualizationPlan(rawPlan) {

    requireObject(rawPlan, "Visualization plan");

    if (rawPlan.schemaVersion !== PLAN_CONFIG.schemaVersion) {
        fail(
            "Unsupported visualization plan version.",
            "UNSUPPORTED_VERSION"
        );
    }

    validateApproach(rawPlan.selectedApproach);

    validateComplexity(rawPlan.complexity);

    validateInput(rawPlan.input);

    const code = validateCode(rawPlan.code);

    const visualizations = validateVisualizations(
        rawPlan.visualizations
    );

    const steps = validateSteps(
        rawPlan.steps,
        visualizations,
        code.lineCount
    );

    return deepClone({

        schemaVersion: PLAN_CONFIG.schemaVersion,

        requestSummary: rawPlan.requestSummary,

        selectedApproach: rawPlan.selectedApproach,

        complexity: rawPlan.complexity,

        input: rawPlan.input,

        code: {
            language: "javascript",
            source: code.source,
            lineCount: code.lineCount
        },

        visualizations,

        steps,

        confidence: validateConfidence(rawPlan.confidence)

    });

}


/* ============================================
   APPROACH VALIDATION
============================================ */

function validateApproach(approach) {

    requireObject(approach, "Selected approach");

    if (
        typeof approach.pattern !== "string" ||
        !PATTERNS.includes(approach.pattern)
    ) {
        fail(
            "The selected pattern is not registered.",
            "UNKNOWN_PATTERN"
        );
    }

    if (
        !["direct", "conditional"].includes(
            approach.applicability
        )
    ) {
        fail("Invalid approach applicability.");
    }

    requireString(
        approach.reason,
        "Approach explanation"
    );

    if (!Array.isArray(approach.conditions)) {
        fail("Approach conditions must be an array.");
    }

    approach.conditions.forEach((condition, index) => {
        requireString(
            condition,
            `Approach condition ${index}`
        );
    });

}


/* ============================================
   COMPLEXITY VALIDATION
============================================ */

function validateComplexity(complexity) {

    requireObject(complexity, "Complexity");

    requireString(
        complexity.time,
        "Time complexity"
    );

    requireString(
        complexity.space,
        "Space complexity"
    );

}


/* ============================================
   INPUT VALIDATION
============================================ */

function validateInput(input) {

    requireObject(input, "Input parameters");

    if (
        !["provided", "generated", "mixed"].includes(
            input.source
        )
    ) {
        fail("Input source must be provided, generated or mixed.");
    }

    requireObject(
        input.parameters,
        "Input parameters.parameters"
    );

    if (!Array.isArray(input.constraints)) {
        fail("Input constraints must be an array.");
    }

}


/* ============================================
   CODE VALIDATION
============================================ */

function validateCode(code) {

    requireObject(code, "Algorithm code");

    if (code.language !== "javascript") {
        fail("Only JavaScript visualization code is supported.");
    }

    requireString(code.source, "JavaScript source");

    if (
        code.source.length >
        PLAN_CONFIG.maximumCodeLength
    ) {
        fail("Generated code exceeds the permitted length.");
    }

    const lineCount = code.source.split("\n").length;

    return {
        source: code.source,
        lineCount
    };

}


/* ============================================
   VISUALIZATION VALIDATION
============================================ */

function validateVisualizations(visualizations) {

    if (
        !Array.isArray(visualizations) ||
        visualizations.length === 0 ||
        visualizations.length >
            PLAN_CONFIG.maximumVisualizations
    ) {
        fail("Invalid number of requested visualizations.");
    }

    const identifiers = new Set();

    return visualizations.map((visualization, index) => {

        requireObject(
            visualization,
            `Visualization ${index}`
        );

        requireString(
            visualization.id,
            `Visualization ${index} ID`
        );

        if (identifiers.has(visualization.id)) {
            fail("Duplicate visualization identifier.");
        }

        identifiers.add(visualization.id);

        if (!DATA_STRUCTURES.includes(visualization.structure)) {
            fail(
                `Unknown data structure: ${visualization.structure}`,
                "UNKNOWN_DATA_STRUCTURE"
            );
        }

        const visualizer = getVisualizerById(
            visualization.visualizerId
        );

        if (!visualizer) {
            fail("Requested visualizer does not exist.");
        }

        if (visualizer.status !== "implemented") {
            fail(
                `${visualizer.name} visualizer is not implemented yet.`,
                "UNSUPPORTED_VISUALIZER"
            );
        }

        if (
            !visualizer.supportedStructures.includes(
                visualization.structure
            )
        ) {
            fail(
                `${visualizer.name} cannot visualize ${visualization.structure}.`
            );
        }

        validateOperationRegistry(visualizer);

        requireObject(
            visualization.initialState,
            "Visualization initial state"
        );

        validateVisualState(
            visualizer.id,
            visualization.initialState
        );

        return {
            id: visualization.id,
            structure: visualization.structure,
            visualizerId: visualization.visualizerId,
            role: visualization.role || "primary",
            initialState: deepClone(visualization.initialState)
        };

    });

}


/* ============================================
   OPERATION VALIDATION
============================================ */

function validateOperationRegistry(visualizer) {

    if (!VISUALIZER_OPERATIONS[visualizer.id]) {
        fail(
            `No operation contract exists for ${visualizer.name}.`
        );
    }

}


/* ============================================
   EXECUTION STEP VALIDATION
============================================ */

function validateSteps(
    steps,
    visualizations,
    codeLineCount
) {

    if (
        !Array.isArray(steps) ||
        steps.length === 0 ||
        steps.length > PLAN_CONFIG.maximumSteps
    ) {
        fail("Invalid number of execution steps.");
    }

    const visualizationMap = new Map(
        visualizations.map(item => [item.id, item])
    );

    return steps.map((step, index) => {

        requireObject(step, `Execution step ${index}`);

        requireString(
            step.action,
            `Execution step ${index} action`
        );

        requireString(
            step.explanation,
            `Execution step ${index} explanation`
        );

        if (
            !Number.isInteger(step.codeLine) ||
            step.codeLine < 0 ||
            step.codeLine >= codeLineCount
        ) {
            fail(
                `Execution step ${index} has an invalid code line.`
            );
        }

        requireObject(
            step.variables,
            `Execution step ${index} variables`
        );

        validateMetrics(step.metrics);

        requireObject(
            step.visualStates,
            `Execution step ${index} visual states`
        );

        const visualStates = {};

        const stateEntries = Object.entries(step.visualStates);

        if (stateEntries.length === 0) {
            fail(`Execution step ${index} has no visual states.`);
        }

        if (stateEntries.length !== visualizations.length) {
            fail(
                `Execution step ${index} must contain a snapshot for every configured visualization.`
            );
        }

        for (const [visualizationId, visualState] of stateEntries) {

            const visualization =
                visualizationMap.get(visualizationId);

            if (!visualization) {
                fail(
                    `Unknown visualization ID: ${visualizationId}`
                );
            }

            requireObject(
                visualState,
                `Visual state ${visualizationId}`
            );

            const operation = visualState.operation;

            const supportedOperations =
                VISUALIZER_OPERATIONS[
                    visualization.visualizerId
                ];

            if (
                !Object.prototype.hasOwnProperty.call(
                    supportedOperations,
                    operation
                )
            ) {
                fail(
                    `Unsupported operation '${operation}' for ${visualization.visualizerId}.`,
                    "UNSUPPORTED_OPERATION"
                );
            }

            const visualizer = getVisualizerById(
                visualization.visualizerId
            );

            const requiredFeatures =
                supportedOperations[operation];

            const missingFeature = requiredFeatures.find(
                feature => !visualizer.features.includes(feature)
            );

            if (missingFeature) {
                fail(
                    `Visualizer capability missing: ${missingFeature}.`
                );
            }

            requireObject(
                visualState.state,
                `Visual state ${visualizationId}.state`
            );

            validateVisualState(
                visualization.visualizerId,
                visualState.state
            );

            visualStates[visualizationId] = {

                operation,

                state: deepClone(visualState.state),

                metadata: visualState.metadata
                    ? deepClone(visualState.metadata)
                    : {}

            };

        }

        return {

            action: step.action,

            codeLine: step.codeLine,

            explanation: step.explanation,

            variables: deepClone(step.variables),

            metrics: deepClone(step.metrics || {}),

            visualStates

        };

    });

}


/* ============================================
   VISUAL STATE VALIDATION
============================================ */

function validateVisualState(visualizerId, state) {
    if (visualizerId === "array") {
        if (!Array.isArray(state.array)) {
            fail("Array visualization requires state.array.");
        }

        state.array.forEach((item, index) => {
            if (
                typeof item === "number" &&
                Number.isFinite(item)
            ) return;

            if (
                typeof item === "string" ||
                typeof item === "boolean"
            ) return;

            if (
                item &&
                typeof item === "object" &&
                Object.prototype.hasOwnProperty.call(item, "value")
            ) return;

            fail(`Invalid array element at index ${index}.`);
        });

        return;
    }

    if (visualizerId === "linked-list") {
        if (!Array.isArray(state.nodes)) {
            fail("Linked List visualization requires state.nodes.");
        }

        const ids = new Set();

        state.nodes.forEach((node, index) => {
            requireObject(node, `Linked List node ${index}`);
            requireString(String(node.id ?? ""), `Linked List node ${index} ID`);

            if (ids.has(String(node.id))) {
                fail(`Duplicate Linked List node ID: ${node.id}`);
            }

            ids.add(String(node.id));

            if (!Object.prototype.hasOwnProperty.call(node, "value")) {
                fail(`Linked List node ${node.id} is missing its value.`);
            }
        });

        state.nodes.forEach(node => {
            const nextId = node.nextId !== undefined
                ? node.nextId
                : node.next;

            if (
                nextId !== undefined &&
                nextId !== null &&
                !ids.has(String(nextId))
            ) {
                fail(`Linked List node ${node.id} references an unknown next node.`);
            }
        });

        if (
            state.headId !== undefined &&
            state.headId !== null &&
            !ids.has(String(state.headId))
        ) {
            fail("Linked List headId references an unknown node.");
        }

        return;
    }

    if (visualizerId === "tree") {
        if (!Array.isArray(state.nodes)) {
            fail("Binary Tree visualization requires state.nodes.");
        }

        const ids = new Set();

        state.nodes.forEach((node, index) => {
            requireObject(node, `Tree node ${index}`);
            requireString(String(node.id ?? ""), `Tree node ${index} ID`);

            if (ids.has(String(node.id))) {
                fail(`Duplicate tree node ID: ${node.id}`);
            }

            ids.add(String(node.id));

            if (!Object.prototype.hasOwnProperty.call(node, "value")) {
                fail(`Tree node ${node.id} is missing its value.`);
            }
        });

        state.nodes.forEach(node => {
            for (const childId of [node.leftId, node.rightId]) {
                if (
                    childId !== undefined &&
                    childId !== null &&
                    !ids.has(String(childId))
                ) {
                    fail(`Tree node ${node.id} references an unknown child.`);
                }
            }
        });

        if (
            state.rootId !== undefined &&
            state.rootId !== null &&
            !ids.has(String(state.rootId))
        ) {
            fail("Binary Tree rootId references an unknown node.");
        }

        return;
    }

    if (visualizerId === "graph") {
        if (!Array.isArray(state.vertices) || !Array.isArray(state.edges)) {
            fail("Graph visualization requires vertices and edges arrays.");
        }

        const ids = new Set();

        state.vertices.forEach((vertex, index) => {
            requireObject(vertex, `Graph vertex ${index}`);
            requireString(String(vertex.id ?? ""), `Graph vertex ${index} ID`);

            if (ids.has(String(vertex.id))) {
                fail(`Duplicate graph vertex ID: ${vertex.id}`);
            }

            ids.add(String(vertex.id));
        });

        state.edges.forEach((edge, index) => {
            requireObject(edge, `Graph edge ${index}`);

            if (
                !ids.has(String(edge.from)) ||
                !ids.has(String(edge.to))
            ) {
                fail(`Graph edge ${index} references an unknown vertex.`);
            }

            if (
                edge.weight !== undefined &&
                typeof edge.weight !== "string" &&
                (typeof edge.weight !== "number" || !Number.isFinite(edge.weight))
            ) {
                fail(`Graph edge ${index} has an invalid weight.`);
            }
        });

        return;
    }

    fail(`No visual state validator exists for '${visualizerId}'.`);
}


/* ============================================
   METRICS VALIDATION
============================================ */

function validateMetrics(metrics) {

    requireObject(metrics || {}, "Execution metrics");

    for (const [name, value] of Object.entries(metrics || {})) {

        if (
            typeof value !== "number" ||
            !Number.isFinite(value) ||
            value < 0
        ) {
            fail(`Invalid execution metric: ${name}`);
        }

    }

}


/* ============================================
   GENERAL VALIDATION HELPERS
============================================ */

function requireObject(value, label) {

    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        fail(`${label} must be an object.`);
    }

}

function requireString(value, label) {

    if (
        typeof value !== "string" ||
        value.trim().length === 0
    ) {
        fail(`${label} must be a non-empty string.`);
    }

}

function validateConfidence(value) {

    if (value === undefined) {
        return null;
    }

    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1
    ) {
        fail("Invalid visualization confidence.");
    }

    return value;

}

function deepClone(value) {

    return structuredClone(value);

}

function fail(message, code = "INVALID_PLAN") {

    throw new VisualizationPlanError(message, code);

}