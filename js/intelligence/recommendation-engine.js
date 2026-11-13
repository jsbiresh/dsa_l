import { analyzeProblemProperties } from "./problem-property-analyzer.js";
import { PATTERNS } from "../registry/pattern-registry.js";
import { matchPatterns } from "./pattern-matcher.js";
import { recommendDataStructures } from "./structure-recommender.js";

/**
 * DSA_L — Rule-Based Recommendation Engine
 *
 * This is independent of Ollama. The same input and same knowledge
 * base must produce the same recommendations.
 */

function detectNamedSortingAlgorithm(request) {
  const match = String(request).match(
    /\b(bubble|selection|insertion|merge|quick|heap)\s*sort\b/i
  );

  if (!match) return null;

  const names = {
    bubble: "Bubble Sort",
    selection: "Selection Sort",
    insertion: "Insertion Sort",
    merge: "Merge Sort",
    quick: "Quick Sort",
    heap: "Heap Sort"
  };

  return names[match[1].toLowerCase()] || null;
}

function detectNamedSearchingAlgorithm(request) {
  const match = String(request).match(
    /\b(?:(linear|binary)\s*search|(lower|upper)\s*bound)\b/i
  );

  if (!match) return null;

  if (match[1]) {
    return match[1].toLowerCase() === "linear"
      ? "Linear Search"
      : "Binary Search";
  }

  return match[2].toLowerCase() === "lower"
    ? "Lower Bound"
    : "Upper Bound";
}

export function generateRuleBasedRecommendations(userRequest) {
  const propertyAnalysis = analyzeProblemProperties(userRequest);
  const namedAlgorithm = detectNamedSortingAlgorithm(userRequest);
  const namedSearchingAlgorithm = detectNamedSearchingAlgorithm(userRequest);
  const matches = matchPatterns(propertyAnalysis);

  // An explicitly named algorithm is stronger evidence than
  // a generic keyword-based pattern classification.
  const searchPattern = PATTERNS.includes("Searching")
    ? "Searching"
    : "Binary Search";

  const approaches = namedAlgorithm
    ? [{
        pattern: "Sorting",
        applicability: "direct",
        reason: `${namedAlgorithm} was explicitly requested. DSA_L will use its corresponding validated local execution planner.`,
        conditions: [],
        dataStructures: [{
          name: "Array",
          role: "input",
          reason: "The numeric array is the input being sorted."
        }],
        evidence: [{
          id: "explicit-named-sorting-algorithm",
          label: "Explicit algorithm selection",
          evidence: `The request explicitly names ${namedAlgorithm}.`
        }],
        knowledge: [],
        source: "explicit_named_sorting_algorithm"
      }]
    : namedSearchingAlgorithm
      ? [{
          pattern: searchPattern,
          applicability: "direct",
          reason: `${namedSearchingAlgorithm} was explicitly requested. DSA_L will use its deterministic local search planner.`,
          conditions: namedSearchingAlgorithm === "Binary Search"
            ? ["The input array must already be sorted in ascending or descending order."]
            : [],
          dataStructures: [{
            name: "Array",
            role: "input",
            reason: "The array contains the values being searched."
          }],
          evidence: [{
            id: "explicit-named-searching-algorithm",
            label: "Explicit algorithm selection",
            evidence: `The request explicitly names ${namedSearchingAlgorithm}.`
          }],
          knowledge: [],
          source: "explicit_named_searching_algorithm"
        }]
      : matches.map(match => ({
          pattern: match.pattern,
          applicability: match.applicability,
          reason: match.reason,
          conditions: [...match.conditions],
          dataStructures: recommendDataStructures(match.structures),
          evidence: match.evidence,
          knowledge: match.knowledge,
          source: match.source
        }));

  return {
    source: "curated_rule_engine",

    properties: propertyAnalysis.properties,

    approaches,

    hasCuratedRecommendations: approaches.length > 0,

    status: approaches.length > 0
      ? "curated_matches_found"
      : "no_curated_rule_matched"
  };
}
