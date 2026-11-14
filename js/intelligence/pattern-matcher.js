import { getPatternKnowledge } from "../knowledge/pattern-knowledge-base.js";

/**
 * DSA_L — Deterministic Pattern Matcher
 *
 * Only curated rules are allowed to make deterministic recommendations.
 * Unmatched problems remain unmatched; the engine does not guess.
 */

const MATCH_RULES = Object.freeze([

  {
    pattern: "Hashing",

    requires: ["targetSumPair", "arrayInput"],

    reason:
      "For each array value, calculate its required complement (target - value) and look it up in a Hash Map. This avoids repeatedly scanning every possible pair.",

    conditions: [
      "No sorted-input requirement is needed.",
      "For a single-use pair, check the complement before recording the current value so the same element is not used twice.",
      "Store original indices as map values when the question asks for indices."
    ],

    structures: [
      {
        name: "Array",
        role: "input",
        reason: "The original sequence of numbers is the input."
      },
      {
        name: "Hash Map",
        role: "auxiliary",
        reason: "Stores previously encountered values and their indices so complements can be found efficiently."
      }
    ]
  },

  {
    pattern: "Two Pointers",

    requires: ["targetSumPair", "arrayInput", "sortedInput"],

    reason:
      "Because the input is sorted, the sum of the leftmost and rightmost values tells us which pointer can safely move. This allows the search space to shrink without checking every pair.",

    conditions: [
      "The input must be sorted.",
      "When the input must be sorted first, account for sorting cost.",
      "When original indices are required, preserve the index mapping before sorting."
    ],

    structures: [
      {
        name: "Array",
        role: "input",
        reason: "The sorted sequence supports indexed access from both ends."
      }
    ]
  },

  {
    pattern: "Monotonic Stack",

    requires: ["nextGreater", "arrayInput"],

    reason:
      "A decreasing stack keeps unresolved candidates in order. When a larger value appears, it resolves the next-greater answer for smaller values on the stack.",

    conditions: [
      "Choose the stack's monotonic order to match the required comparison.",
      "Handle equal values according to whether the question requires strictly greater or greater-than-or-equal."
    ],

    structures: [
      {
        name: "Array",
        role: "input",
        reason: "Contains the sequence whose next-greater relationships must be found."
      },
      {
        name: "Stack",
        role: "auxiliary",
        reason: "Maintains unresolved indices or values in monotonic order."
      }
    ]
  },

  {
    pattern: "Stack Operations",

    requires: ["stackOperationRequest"],

    reason:
      "A Stack follows Last-In, First-Out order. Push, pop and peek operate at the top, making a Stack the direct structure for this walkthrough.",

    conditions: [
      "Push inserts a value at the top.",
      "Pop removes the most recently inserted value.",
      "Peek reads the top value without removing it.",
      "An empty Stack produces underflow for pop and peek.",
      "A bounded Stack produces overflow when capacity is reached."
    ],

    structures: [
      {
        name: "Stack",
        role: "primary",
        reason:
          "The Stack is the main structure being demonstrated. Its items, top index, size and capacity are tracked in every execution snapshot."
      }
    ]
  },


  {
    pattern: "Breadth-First Search (BFS)",

    requires: ["graphInput", "shortestPath", "unweightedGraph"],

    reason:
      "BFS explores vertices in increasing order of edge distance. In an unweighted graph, the first discovery of a vertex gives a path with the minimum number of edges.",

    conditions: [
      "The graph must be unweighted, or all edges must have equal cost.",
      "Use a FIFO queue.",
      "Mark vertices visited when they are discovered to avoid duplicate processing."
    ],

    structures: [
      {
        name: "Graph",
        role: "input",
        reason: "Represents the vertices and connections of the problem."
      },
      {
        name: "Graph Adjacency List",
        role: "primary",
        reason: "Stores the neighbours of each vertex for efficient traversal in a sparse graph."
      },
      {
        name: "Queue",
        role: "auxiliary",
        reason: "Maintains the frontier in first-in-first-out order."
      }
    ]
  },

  {
    pattern: "Heap / Priority Queue",

    requires: ["topK", "arrayInput"],

    reason:
      "A heap can repeatedly expose the smallest or largest candidate. A bounded heap of size K can avoid sorting the entire input when only K extreme elements are required.",

    conditions: [
      "Choose a min-heap or max-heap based on the required result.",
      "Choose the heap size and comparison rule carefully.",
      "Validate the permitted range of K."
    ],

    structures: [
      {
        name: "Array",
        role: "input",
        reason: "Contains the original values to be ranked."
      },
      {
        name: "Heap / Priority Queue",
        role: "auxiliary",
        reason: "Maintains the currently relevant extreme candidates."
      }
    ]
  }

]);

export function matchPatterns(propertyAnalysis) {
  if (
    !propertyAnalysis ||
    typeof propertyAnalysis.getProperty !== "function"
  ) {
    throw new TypeError("A valid problem-property analysis is required.");
  }

  const matches = [];

  for (const rule of MATCH_RULES) {
    const applicable = rule.requires.every(
      property => propertyAnalysis.getProperty(property)
    );

    if (!applicable) {
      continue;
    }

    const knowledge = getPatternKnowledge(rule.pattern);

    // Never present an uncatalogued rule as curated knowledge.
    if (!knowledge) {
      continue;
    }

    const evidence = propertyAnalysis.properties.filter(
      property => rule.requires.includes(property.id)
    );

    matches.push({
      pattern: rule.pattern,
      applicability: "direct",
      reason: rule.reason,
      conditions: [...rule.conditions],
      structures: rule.structures.map(structure => ({ ...structure })),
      evidence,
      knowledge: {
        purpose: knowledge.purpose,
        useWhen: [...knowledge.useWhen],
        avoidWhen: [...knowledge.avoidWhen],
        strengths: [...knowledge.strengths],
        limitations: [...knowledge.limitations],
        questionsToAsk: [...knowledge.questionsToAsk]
      },
      source: "curated_rule"
    });
  }

  return matches;
}
