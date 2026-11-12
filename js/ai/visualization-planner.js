/**
 * DSA_L — AI Visualization Planner
 *
 * Responsibilities:
 * 1. Interpret the selected algorithmic approach.
 * 2. Identify required input parameters.
 * 3. Generate sample data when parameters are missing.
 * 4. Create a structured visualization plan.
 * 5. Validate the plan against DSA_L contracts.
 *
 * AI-generated JavaScript is displayed only.
 * It is never executed.
 */

import { generateJSON } from "./ollama-client.js";

import {
    PATTERNS
} from "../registry/pattern-registry.js";

import {
    DATA_STRUCTURES
} from "../registry/data-structure-registry.js";

import {
    getVisualizationCapabilities,
    getVisualizersForStructure
} from "../visualization/visualizer-registry.js";

import {
    validateVisualizationPlan
} from "../visualization/visualization-plan.js";


/**
 * Planner generation settings.
 */
const PLANNER_CONFIG = Object.freeze({

    numCtx: 4096,

    numPredict: 2200,

    timeout: 300000,

    temperature: 0.1

});


/**
 * Generate a visualization plan for a selected approach.
 *
 * @param {object} options
 * @param {string} options.question
 * @param {object} options.analysis
 * @param {object} options.selectedApproach
 *
 * @returns {Promise<object>} Validated visualization plan.
 */
export async function createVisualizationPlan({
    question,
    analysis,
    selectedApproach
}) {

    validatePlannerInput({
        question,
        analysis,
        selectedApproach
    });

    const approach = resolveSelectedApproach(
        analysis,
        selectedApproach
    );

    const availableVisualizers = resolveAvailableVisualizers(
        approach
    );

    const systemPrompt = buildPlannerSystemPrompt({
        approach,
        availableVisualizers
    });

    const userPrompt = JSON.stringify({

        question,

        selectedApproach: {

            pattern: approach.pattern,

            applicability: approach.applicability,

            reason: approach.reason,

            conditions: approach.conditions,

            dataStructures: approach.dataStructures

        },

        availableVisualizers

    });

    const rawPlan = await generateJSON(
        systemPrompt,
        userPrompt,
        PLANNER_CONFIG
    );

    if (rawPlan?.error) {
        throw new Error(
            rawPlan.error.message ||
            "The AI could not create a visualization plan."
        );
    }

    const validatedPlan = validateVisualizationPlan(rawPlan);

    verifyPlanMatchesSelection(
        validatedPlan,
        approach
    );

    return validatedPlan;
}


/* ============================================
   INPUT VALIDATION
============================================ */

function validatePlannerInput({
    question,
    analysis,
    selectedApproach
}) {

    if (
        typeof question !== "string" ||
        !question.trim()
    ) {
        throw new Error(
            "A valid DSA question is required."
        );
    }

    if (!analysis || !Array.isArray(analysis.approaches)) {
        throw new Error(
            "A valid AI problem analysis is required."
        );
    }

    if (
        !selectedApproach ||
        typeof selectedApproach.pattern !== "string"
    ) {
        throw new Error(
            "Please select a valid algorithmic approach."
        );
    }

}


/* ============================================
   SELECTED APPROACH RESOLUTION
============================================ */

function resolveSelectedApproach(
    analysis,
    selectedApproach
) {

    const approach = analysis.approaches.find(
        candidate =>
            candidate.pattern === selectedApproach.pattern
    );

    if (!approach) {
        throw new Error(
            "The selected approach was not present in the AI analysis."
        );
    }

    if (!PATTERNS.includes(approach.pattern)) {
        throw new Error(
            "The selected pattern is not registered."
        );
    }

    if (!Array.isArray(approach.dataStructures)) {
        throw new Error(
            "The selected approach has no valid data structure information."
        );
    }

    for (const structure of approach.dataStructures) {

        if (!DATA_STRUCTURES.includes(structure.name)) {
            throw new Error(
                `Unregistered data structure: ${structure.name}`
            );
        }

    }

    // Keep educational knowledge in the analysis object,
    // but pass only execution-relevant information to the planner.
    return {
        pattern: approach.pattern,
        applicability: approach.applicability,
        reason: approach.reason,
        conditions: Array.isArray(approach.conditions)
            ? approach.conditions
            : [],
        dataStructures: approach.dataStructures.map(structure => ({
            name: structure.name,
            role: structure.role,
            reason: structure.reason
        }))
    };
}


/* ============================================
   VISUALIZER AVAILABILITY
============================================ */

function resolveAvailableVisualizers(approach) {

    const capabilities = getVisualizationCapabilities();

    const availableVisualizers = [];

    for (const structure of approach.dataStructures) {

        const matchingVisualizers =
            getVisualizersForStructure(structure.name);

        const implemented = matchingVisualizers.filter(
            visualizer => visualizer.status === "implemented"
        );

        if (implemented.length === 0) {

            const planned = capabilities.some(
                capability =>
                    capability.supportedStructures.includes(
                        structure.name
                    ) &&
                    capability.status === "planned"
            );

            const status = planned
                ? "registered but not implemented"
                : "not registered";

            throw new Error(
                `Cannot create this animation yet: ` +
                `${structure.name} visualizer is ${status}.`
            );

        }

        for (const visualizer of implemented) {

            availableVisualizers.push({

                id: visualizer.id,

                name: visualizer.name,

                structure: structure.name,

                status: visualizer.status,

                features: visualizer.features

            });

        }

    }

    return availableVisualizers;
}


/* ============================================
   AI PLANNER SYSTEM PROMPT
============================================ */

function buildPlannerSystemPrompt({
    approach,
    availableVisualizers
}) {

    return `
You are the visualization planning engine for DSA_L.

Your job is to prepare a complete, structured execution
plan for the algorithmic approach selected by the user.

You are NOT choosing a new approach.
The user has already selected one.

========================================
SELECTED APPROACH
========================================

${JSON.stringify(approach, null, 2)}

========================================
AVAILABLE PATTERN REGISTRY
========================================

${JSON.stringify(PATTERNS)}

========================================
AVAILABLE DATA STRUCTURE REGISTRY
========================================

${JSON.stringify(DATA_STRUCTURES)}

========================================
IMPLEMENTED VISUALIZERS
========================================

${JSON.stringify(availableVisualizers, null, 2)}

You may ONLY request visualizers listed above.

Do not request planned or unavailable visualizers.

========================================
YOUR RESPONSIBILITIES
========================================

1. Understand the original DSA question.

2. Follow the selected pattern and its conditions.

3. Determine the exact algorithmic procedure.

4. Extract all explicit input parameters.

5. Preserve all constraints stated in the question.

6. If required values are missing, generate a small
   illustrative sample dataset.

7. Clearly distinguish supplied values from generated values.

8. Use approximately 6 to 7 elements for a simple
   array-based demonstration, when appropriate.

9. Generate JavaScript source code representing the
   selected algorithm.

10. Generate an ordered sequence of execution steps.

11. Each execution step must contain:
    - Current action.
    - JavaScript code line.
    - Explanation.
    - Variable values.
    - Operation metrics.
    - Complete visualization state snapshots.

12. Keep execution plans concise.
    Prefer 6 to 15 meaningful steps for small examples.

13. Code line numbers are ZERO-BASED.

14. Every codeLine must point to a real line in code.source.

15. The steps must follow the algorithm's actual logical order.

16. State snapshots must represent the actual state after
    the corresponding operation.

17. Do not invent successful results or claim that an
    algorithm completed if its execution steps do not show it.

========================================
VISUALIZATION RULES
========================================

Only use the implemented visualization capabilities
provided in the request.

Currently, the Array visualizer supports:

- render
- compare
- highlight
- swap
- markSorted
- complete

For array visualization:

Every state must contain:

{
  "array": [
    {
      "id": "element-0",
      "value": 10
    }
  ]
}

Use stable element IDs.

Supported metadata:

{
  "activeIndexes": [],
  "comparingIndexes": [],
  "swappingIndexes": [],
  "sortedIndexes": []
}

Every execution step must provide a visual state
for every visualization in the plan.

Never invent unsupported operations.

========================================
CODE EXECUTION SAFETY
========================================

The JavaScript source is displayed in the DSA_L code panel.

It will NOT be executed by the application.

Do not generate eval(), new Function(), network calls,
filesystem access, browser APIs or external dependencies.

The visualization plan is interpreted separately
by the DSA_L execution runtime.

========================================
REQUIRED JSON FORMAT
========================================

Return ONLY valid JSON.

Use this structure:

{
  "schemaVersion": 1,

  "requestSummary": "Brief explanation",

  "selectedApproach": {
    "pattern": "${approach.pattern}",
    "applicability": "${approach.applicability}",
    "reason": "Why the approach works",
    "conditions": []
  },

  "complexity": {
    "time": "O(n)",
    "space": "O(1)"
  },

  "input": {
    "source": "provided",
    "parameters": {},
    "constraints": []
  },

  "code": {
    "language": "javascript",
    "source": "function example() {\\n  return true;\\n}"
  },

  "visualizations": [
    {
      "id": "main",
      "structure": "Array",
      "visualizerId": "array",
      "role": "primary",
      "initialState": {
        "array": [
          {
            "id": "element-0",
            "value": 10
          }
        ]
      }
    }
  ],

  "steps": [
    {
      "action": "COMPARE",
      "codeLine": 0,
      "explanation": "Comparing two values.",
      "variables": {},
      "metrics": {
        "comparisons": 1
      },
      "visualStates": {
        "main": {
          "operation": "compare",
          "state": {
            "array": [
              {
                "id": "element-0",
                "value": 10
              }
            ]
          },
          "metadata": {
            "comparingIndexes": [0]
          }
        }
      }
    }
  ],

  "confidence": 0.95
}

========================================
INPUT SOURCE VALUES
========================================

Use exactly one:

- provided: all parameters came from the question.
- generated: all parameters are illustrative.
- mixed: some parameters were supplied and others generated.

========================================
IMPORTANT FAILURE RULE
========================================

If the selected approach cannot be visualized using
the available implementations, return:

{
  "error": {
    "message": "Explain the missing capability."
  }
}

If constraints are missing or the selected conditional
approach cannot safely be applied, explain the issue.

Do not fabricate an executable visualization plan.


========================================
DSA_L VISUALIZATION OUTPUT CONTRACT
========================================

Only use visualizer IDs and data structures supplied in availableVisualizers.

Every visualization must contain:
{
  "id": "unique-id",
  "structure": "registered structure name",
  "visualizerId": "registered visualizer ID",
  "role": "primary",
  "initialState": {}
}

SUPPORTED DATA FORMATS

1. ARRAY — visualizerId: "array"

{
  "array": [
    {"id": "a1", "value": 10},
    {"id": "a2", "value": 20}
  ]
}

Array metadata:
- activeIndexes
- comparingIndexes
- swappingIndexes
- sortedIndexes

Allowed operations:
render, compare, highlight, swap, markSorted, complete.

2. LINKED LIST — visualizerId: "linked-list"

{
  "headId": "n1",
  "nodes": [
    {"id": "n1", "value": 10, "nextId": "n2"},
    {"id": "n2", "value": 20, "nextId": null}
  ]
}

Use explicit nextId references. Use null for the end of the list.
Every reference must point to an existing node.

Metadata:
- activeNodeIds
- comparingNodeIds
- updatedNodeIds

Allowed operations:
render, highlight, compare, updateLink, reverseLink,
insertNode, removeNode, complete.

3. BINARY TREE — visualizerId: "tree"

{
  "rootId": "n1",
  "nodes": [
    {"id": "n1", "value": 10, "leftId": "n2", "rightId": "n3"},
    {"id": "n2", "value": 5, "leftId": null, "rightId": null},
    {"id": "n3", "value": 15, "leftId": null, "rightId": null}
  ]
}

Every child reference must point to an existing node.
Each node must have at most one parent.
The structure must be a valid connected binary tree.

Metadata:
- activeNodeIds
- comparingNodeIds
- visitedNodeIds

Allowed operations:
render, highlight, compare, visit, complete.

4. GRAPH — visualizerId: "graph"

{
  "vertices": [
    {"id": "v1", "label": "A"},
    {"id": "v2", "label": "B"}
  ],
  "edges": [
    {"id": "e1", "from": "v1", "to": "v2", "directed": true}
  ]
}

Edges must reference existing vertices.
Optional edge properties: weight, directed.
Optional vertex properties: value, x, y.

Metadata:
- activeVertexIds
- visitedVertexIds
- frontierVertexIds
- activeEdgeIds
- traversedEdgeIds

Allowed operations:
render, highlight, compare, visit, enqueue, traverseEdge, complete.

========================================
MANDATORY SNAPSHOT RULES
========================================

1. Each execution step must contain a visualStates entry for EVERY
   configured visualization ID.

2. Each visualStates entry must contain:
{
  "operation": "one allowed operation",
  "state": {},
  "metadata": {}
}

3. Every state must be a complete snapshot, not a partial update.
   Previous and Next restore snapshots independently.

4. Preserve stable IDs between consecutive steps.
   Do not generate new IDs for unchanged elements.

5. Variables must contain the current values of relevant pointers,
   indices, counters, recursion parameters and temporary variables.

6. codeLine must be a zero-based line index into the supplied code.

7. Never use unsupported operation names such as "sort", "move",
   "delete" or "update" unless explicitly listed above.
   Use the closest registered operation.

8. The operation describes the visual action; the state contains
   the complete resulting structure.

9. Every step must explain WHY the operation is performed.

10. Do not generate AI JavaScript for execution. JavaScript is
    display-only. Generate structured states and explanations.

11. Do not invent additional visualizer IDs or capabilities.

12. Keep the execution trace within the configured maximum
    number of steps.


Return JSON only. No Markdown.
`;
}


/* ============================================
   PLAN CONSISTENCY CHECKS
============================================ */

function verifyPlanMatchesSelection(plan, approach) {

    if (plan.selectedApproach.pattern !== approach.pattern) {

        throw new Error(
            "The visualization plan does not match your selected pattern."
        );

    }

    const expectedStructures = new Set(
        approach.dataStructures.map(
            structure => structure.name
        )
    );

    const plannedStructures = new Set(
        plan.visualizations.map(
            visualization => visualization.structure
        )
    );

    for (const structure of expectedStructures) {

        if (!plannedStructures.has(structure)) {

            throw new Error(
                `Visualization plan omitted required structure: ${structure}.`
            );

        }

    }

}
