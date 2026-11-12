
/**
 * DSA_L — Hybrid Analysis Integrator
 *
 * Curated rules have authority over patterns they explicitly support.
 * Qwen suggestions remain available for unsupported problem types,
 * but are marked as unverified.
 */

function uniqueStrings(values) {
  return [...new Set(
    values.filter(value =>
      typeof value === "string" && value.trim()
    ).map(value => value.trim())
  )];
}

function buildCuratedClues(approaches) {
  const clues = [];
  const seen = new Set();

  for (const approach of approaches) {
    for (const evidence of approach.evidence) {
      const key = `${evidence.id}:${approach.pattern}`;

      if (seen.has(key)) continue;
      seen.add(key);

      clues.push({
        text: evidence.evidence,
        suggests: approach.pattern,
        reason: `${evidence.label}. ${approach.reason}`
      });
    }
  }

  return clues;
}

function buildCuratedReasoning(approaches) {
  const names = approaches.map(item => item.pattern);

  return (
    `DSA_L matched ${names.length} recommendation(s) using its curated ` +
    `knowledge and explicitly detected problem properties: ${names.join(", ")}. ` +
    `These recommendations are supported by local rules rather than ` +
    `being accepted solely from an AI-generated classification. ` +
    `Review the conditions and limitations before choosing an approach.`
  );
}

function buildUnverifiedReasoning(aiReasoning) {
  const explanation = typeof aiReasoning === "string"
    ? aiReasoning.trim()
    : "";

  return [
    "No curated recommendation rule matched this problem.",
    "The following approaches are suggestions from the local AI model and have not been independently verified by DSA_L's rule engine.",
    explanation
  ].filter(Boolean).join(" ");
}

/**
 * Combine validated AI analysis with deterministic recommendations.
 */
export function integrateAnalysis(aiAnalysis, ruleAnalysis) {
  if (!aiAnalysis || typeof aiAnalysis !== "object") {
    throw new TypeError("Validated AI analysis is required.");
  }

  if (!ruleAnalysis || !Array.isArray(ruleAnalysis.approaches)) {
    throw new TypeError("Valid rule-based analysis is required.");
  }

  // CURATED MATCHES TAKE PRIORITY.
  if (ruleAnalysis.hasCuratedRecommendations) {
    const approaches = ruleAnalysis.approaches.map(item => ({
      pattern: item.pattern,
      applicability: item.applicability,
      reason: item.reason,
      conditions: [...item.conditions],

      dataStructures: item.dataStructures.map(structure => ({
        ...structure,
        knowledge: structure.knowledge
      })),

      evidence: item.evidence,
      knowledge: item.knowledge,

      source: "curated_rule_engine",
      verificationStatus: "curated"
    }));

    const recommendedDataStructures = uniqueStrings(
      approaches.flatMap(approach =>
        approach.dataStructures.map(structure => structure.name)
      )
    );

    const primaryApproach =
      approaches.find(item => item.applicability === "direct") ||
      approaches[0] ||
      null;

    const detectedKeywords = uniqueStrings([
      ...(Array.isArray(aiAnalysis.keywords) ? aiAnalysis.keywords : []),
      ...ruleAnalysis.properties.map(property => property.evidence)
    ]);

    return {
      ...aiAnalysis,

      mode: aiAnalysis.mode || "problem_solving",

      keywords: detectedKeywords,

      clues: buildCuratedClues(ruleAnalysis.approaches),

      approaches,

      primaryPattern: primaryApproach?.pattern || "",

      secondaryPatterns: approaches
        .filter(item => item !== primaryApproach)
        .map(item => item.pattern),

      recommendedDataStructures,

      requestedDataStructure:
        recommendedDataStructures[0] || "",

      reasoning: buildCuratedReasoning(approaches),

      recommendationSource: "curated_rule_engine",
      recommendationStatus: "curated",

      matchedProperties: ruleAnalysis.properties,

      // Retained for diagnostics; not used as authoritative reasoning.
      modelReasoning: aiAnalysis.reasoning || ""
    };
  }

  // NO CURATED MATCH: retain AI suggestions, but label them honestly.
  const approaches = aiAnalysis.approaches.map(approach => ({
    ...approach,
    source: "qwen_unverified",
    verificationStatus: "unverified"
  }));

  return {
    ...aiAnalysis,

    approaches,

    recommendationSource: "qwen_unverified",
    recommendationStatus: "ai_unverified",

    reasoning: buildUnverifiedReasoning(aiAnalysis.reasoning),

    matchedProperties: ruleAnalysis.properties
  };
}
