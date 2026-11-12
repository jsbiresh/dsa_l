import { analyzeProblemProperties } from "./problem-property-analyzer.js";
import { matchPatterns } from "./pattern-matcher.js";
import { recommendDataStructures } from "./structure-recommender.js";

/**
 * DSA_L — Rule-Based Recommendation Engine
 *
 * This is independent of Ollama. The same input and same knowledge
 * base must produce the same recommendations.
 */

export function generateRuleBasedRecommendations(userRequest) {
  const propertyAnalysis = analyzeProblemProperties(userRequest);
  const matches = matchPatterns(propertyAnalysis);

  const approaches = matches.map(match => ({
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
