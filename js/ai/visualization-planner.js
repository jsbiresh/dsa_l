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

import {
    hashKey
} from "../graphics/models/hash-map-model.js";
import { buildDeterministicSortingPlan } from "./deterministic-plan-builders.js";
import { buildDeterministicSearchingPlan } from "./deterministic-search-plan-builders.js";


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
export async function createVisualizationPlan(
    { question, analysis, selectedApproach },
    dependencies = {}
) {
    validatePlannerInput({
        question,
        analysis,
        selectedApproach
    });

    const approach = resolveSelectedApproach(
        analysis,
        selectedApproach
    );

    const availableVisualizers = resolveAvailableVisualizers(approach);

    // Explicitly named sorting algorithms have validated local builders.
    // Prefer them to model-generated plans for deterministic execution.
    if (/\b(?:bubble|selection|insertion|merge|quick|heap)\s*sort\b/i.test(question)) {
        const localPlan = buildDeterministicSortingPlan(
            question,
            approach,
            availableVisualizers
        );

        if (localPlan) {
            verifyPlanMatchesSelection(localPlan, approach);

            return {
                ...localPlan,
                planningSource: "deterministic_fallback",
                planningWarning: "Explicitly named sorting algorithm handled by the validated local planner."
            };
        }
    }

    // Explicitly named searching algorithms use validated local builders.
    if (/\b(?:linear|binary)\s*search\b/i.test(question)) {
        const localPlan = buildDeterministicSearchingPlan(
            question,
            approach,
            availableVisualizers
        );

        if (localPlan) {
            verifyPlanMatchesSelection(localPlan, approach);

            return {
                ...localPlan,
                planningSource: "deterministic_fallback",
                planningWarning: "Explicitly named searching algorithm handled by the validated local planner."
            };
        }
    }

    const systemPrompt = buildPlannerSystemPrompt({
        approach,
        availableVisualizers
    });

    const userPrompt = JSON.stringify({
        question,
        selectedApproach: approach,
        availableVisualizers
    });

    const plannerGenerateJSON =
        typeof dependencies.generateJSON === "function"
            ? dependencies.generateJSON
            : generateJSON;

    try {
        const rawPlan = await plannerGenerateJSON(
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

        verifyPlanMatchesSelection(validatedPlan, approach);

        return {
            ...validatedPlan,
            planningSource: "qwen",
            planningWarning: ""
        };
    } catch (error) {
        console.warn(
            "Qwen planning failed. Trying deterministic fallback.",
            error
        );

        const fallbackPlan =
            buildDeterministicSearchingPlan(
                question,
                approach,
                availableVisualizers
            ) ||
            buildDeterministicSortingPlan(
                question,
                approach,
                availableVisualizers
            ) ||
            buildDeterministicTwoSumPlan(
                question,
                approach,
                availableVisualizers
            );

        if (!fallbackPlan) {
            throw error;
        }

        verifyPlanMatchesSelection(fallbackPlan, approach);

        return {
            ...fallbackPlan,
            planningSource: "deterministic_fallback",
            planningWarning: error.message
        };
    }
}


/**
 * Supports only explicit numeric Two Sum inputs using the
 * curated Hashing approach and implemented Array + Hash Map renderers.
 */
export function buildDeterministicTwoSumPlan(
    question,
    approach,
    availableVisualizers
) {
    if (
        approach?.pattern !== "Hashing" ||
        !Array.isArray(approach.dataStructures)
    ) {
        return null;
    }

    const structures = new Set(
        approach.dataStructures.map(item => item.name)
    );

    const visualizers = new Set(
        availableVisualizers.map(item => item.id)
    );

    if (
        !structures.has("Array") ||
        !structures.has("Hash Map") ||
        !visualizers.has("array") ||
        !visualizers.has("hash-map")
    ) {
        return null;
    }

    const arrayMatch = question.match(
        /\[\s*(-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?)+)\s*\]/
    );

    const targetMatch = question.match(
        /\btarget\b\s*(?:=|:|is|of)?\s*(-?\d+(?:\.\d+)?)/i
    );

    if (!arrayMatch || !targetMatch) return null;

    const nums = arrayMatch[1].split(",").map(Number);
    const target = Number(targetMatch[1]);

    if (
        nums.length < 2 ||
        nums.length > 50 ||
        !nums.every(Number.isFinite) ||
        !Number.isFinite(target)
    ) {
        return null;
    }

    const capacity = 5;
    const entries = [];
    const seen = new Map();
    const steps = [];

    const arrayState = {
        array: nums.map((value, index) => ({
            id: `element-${index}`,
            value
        }))
    };

    const code = [
        "const seen = new Map();",
        "for (let i = 0; i < nums.length; i++) {",
        "  const current = nums[i];",
        "  const complement = target - current;",
        "  if (seen.has(complement)) {",
        "    return [seen.get(complement), i];",
        "  }",
        "  seen.set(current, i);",
        "}",
        "return [];"
    ].join("\n");

    function addStep(
        action,
        codeLine,
        explanation,
        variables,
        arrayOperation,
        arrayMetadata,
        hashOperation,
        hashMetadata,
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
                    operation: arrayOperation,
                    state: structuredClone(arrayState),
                    metadata: structuredClone(arrayMetadata)
                },
                "hash-main": {
                    operation: hashOperation,
                    state: {
                        capacity,
                        entries: entries.map(entry => ({ ...entry }))
                    },
                    metadata: structuredClone(hashMetadata)
                }
            }
        });
    }

    addStep(
        "INITIALIZE",
        0,
        "Create an empty Hash Map to store previously visited values and their original indices.",
        { target },
        "render",
        {},
        "render",
        {}
    );

    let answer = null;

    for (let i = 0; i < nums.length; i++) {
        const current = nums[i];
        const complement = target - current;
        const currentBucket = hashKey(current, capacity);
        const complementBucket = hashKey(complement, capacity);

        const currentBucketEntries = entries.filter(
            entry => hashKey(entry.key, capacity) === currentBucket
        );

        addStep(
            "HASH_CURRENT_VALUE",
            2,
            `Calculate hash(${current}) = ${currentBucket}.`,
            { index: i, current, target },
            "highlight",
            { activeIndexes: [i] },
            "hash",
            {
                activeKey: current,
                activeBucketIndex: currentBucket,
                ...(currentBucketEntries.length
                    ? { collisionBucketIndex: currentBucket }
                    : {})
            },
            { hashCalculations: 1 }
        );

        const matchingEntry = seen.has(complement)
            ? entries.find(entry => entry.key === complement)
            : null;

        const complementBucketEntries = entries.filter(
            entry => hashKey(entry.key, capacity) === complementBucket
        );

        addStep(
            "LOOKUP_COMPLEMENT",
            4,
            matchingEntry
                ? `Complement ${complement} was found in bucket ${complementBucket}.`
                : `Complement ${complement} is not present in bucket ${complementBucket}.`,
            { index: i, current, complement, target },
            "highlight",
            { activeIndexes: [i] },
            "lookup",
            {
                activeKey: complement,
                lookupKey: complement,
                activeBucketIndex: complementBucket,
                ...(matchingEntry
                    ? { activeEntryIds: [matchingEntry.id] }
                    : {
                        comparingEntryIds:
                            complementBucketEntries.map(entry => entry.id)
                    })
            },
            { lookups: 1 }
        );

        if (matchingEntry) {
            answer = [matchingEntry.value, i];

            addStep(
                "COMPLETE",
                5,
                `Found ${complement} at index ${matchingEntry.value}. ${complement} + ${current} = ${target}.`,
                {
                    index: i,
                    current,
                    complement,
                    matchingIndex: matchingEntry.value,
                    result: answer
                },
                "complete",
                { activeIndexes: answer },
                "complete",
                {
                    activeBucketIndex: complementBucket,
                    activeEntryIds: [matchingEntry.id]
                },
                { lookups: 1 }
            );

            break;
        }

        const existing = entries.find(entry => entry.key === current);

        if (existing) {
            existing.value = i;
            seen.set(current, i);

            addStep(
                "UPDATE_EXISTING_KEY",
                7,
                `Update the stored index for key ${current} to ${i}.`,
                { index: i, current },
                "highlight",
                { activeIndexes: [i] },
                "update",
                {
                    activeKey: current,
                    activeBucketIndex: currentBucket,
                    updatedEntryIds: [existing.id]
                },
                { updates: 1 }
            );
        } else {
            const entry = {
                id: `entry-${i}`,
                key: current,
                value: i
            };

            entries.push(entry);
            seen.set(current, i);

            addStep(
                "INSERT_VALUE",
                7,
                currentBucketEntries.length
                    ? `Insert ${current} into bucket ${currentBucket}. Separate chaining preserves the colliding entries.`
                    : `Insert ${current} with original index ${i} into bucket ${currentBucket}.`,
                { index: i, current },
                "highlight",
                { activeIndexes: [i] },
                "insert",
                {
                    activeKey: current,
                    activeBucketIndex: currentBucket,
                    ...(currentBucketEntries.length
                        ? { collisionBucketIndex: currentBucket }
                        : {}),
                    insertedEntryIds: [entry.id]
                },
                { insertions: 1 }
            );
        }
    }

    if (!answer) return null;

    const rawPlan = {
        schemaVersion: 1,
        requestSummary: `Two Sum using Hashing on ${nums.length} input values.`,
        selectedApproach: {
            pattern: "Hashing",
            applicability: approach.applicability,
            reason: approach.reason,
            conditions: [...approach.conditions]
        },
        complexity: {
            time: "O(n) average",
            space: "O(n)"
        },
        input: {
            source: "provided",
            parameters: { nums, target },
            constraints: [
                "The input contains exactly one valid solution."
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
                initialState: arrayState
            },
            {
                id: "hash-main",
                structure: "Hash Map",
                visualizerId: "hash-map",
                role: "auxiliary",
                initialState: {
                    capacity,
                    entries: []
                }
            }
        ],
        steps,
        confidence: 1
    };

    const validatedPlan = validateVisualizationPlan(rawPlan);
    verifyPlanMatchesSelection(validatedPlan, approach);

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

The Hash Map visualizer supports:

- render
- hash
- lookup
- insert
- update
- delete
- complete

For Hash Map visualization, use fixed-capacity buckets with separate
chaining. Each key-value entry must have a stable string ID. Hash Map
states must contain capacity and a complete entries array.

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

2. HASH MAP — visualizerId: "hash-map"

{
  "capacity": 5,
  "entries": [
    {"id": "entry-1", "key": 2, "value": 0},
    {"id": "entry-2", "key": 7, "value": 1}
  ]
}

Hash Map rules:
- capacity must be an integer from 1 through 32.
- entries must be a complete snapshot of all current key-value pairs.
- every entry requires a unique stable string ID.
- keys must be strings or finite numbers.
- values must be strings, finite numbers, booleans or null.
- keys must be unique. Update an existing entry instead of duplicating it.
- numeric keys use ((trunc(key) % capacity) + capacity) % capacity.
- string keys use a deterministic polynomial hash. For each Unicode
  code point, hash = (hash * 31 + codePoint) modulo 2^32.
  The bucket index is hash modulo capacity.
- colliding keys must remain separate entries. Never overwrite or discard
  an entry just because another key maps to the same bucket.
- preserve entry IDs across snapshots when the key remains present.

Hash Map metadata:
- activeBucketIndex
- collisionBucketIndex
- activeKey
- lookupKey
- activeEntryIds
- comparingEntryIds
- insertedEntryIds
- updatedEntryIds
- visitedEntryIds
- explanation

Allowed operations:
render, hash, lookup, insert, update, delete, complete.

3. LINKED LIST — visualizerId: "linked-list"

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

4. BINARY TREE — visualizerId: "tree"

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

5. GRAPH — visualizerId: "graph"

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
