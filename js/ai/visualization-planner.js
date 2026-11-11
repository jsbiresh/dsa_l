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

    return approach;
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
