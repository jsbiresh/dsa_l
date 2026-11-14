/**
 * DSA_L — Registry-Based Problem Analyzer
 *
 * The AI's responsibility is limited to:
 * 1. Identifying applicable registered patterns.
 * 2. Identifying the data structures used by each approach.
 * 3. Explaining why each approach is suitable.
 *
 * It cannot invent registry names or generate executable algorithms.
 */

import { generateJSON } from "./ollama-client.js";
import { generateRuleBasedRecommendations } from "../intelligence/recommendation-engine.js";
import { integrateAnalysis } from "../intelligence/analysis-integrator.js";


import { PATTERNS } from "../registry/pattern-registry.js";
import { DATA_STRUCTURES } from "../registry/data-structure-registry.js";

// Sets allow fast validation of AI-generated registry names.
const PATTERN_SET = new Set(PATTERNS);
const DATA_STRUCTURE_SET = new Set(DATA_STRUCTURES);

const VALID_MODES = ["problem_solving", "custom_visualization"];

const VALID_APPLICABILITY = ["direct", "conditional"];

const VALID_ROLES = ["input", "primary", "auxiliary", "execution"];

/**
 * Construct the system prompt using our actual registries.
 *
 * The AI receives only the available pattern and data
 * structure names defined by DSA_L.
 */
function buildSystemPrompt() {
  return `
You are the pattern classification engine for DSA_L.

DSA_L is an interactive Data Structures and Algorithms
learning application.

YOUR ONLY PRIMARY RESPONSIBILITY:

Examine the user's request and identify:

1. All applicable algorithmic problem-solving patterns.
2. All relevant data structures for each approach.
3. Why each pattern is applicable.
4. Whether the approach is directly applicable or conditional.

You must select names exclusively from the registries below.

========================================
AVAILABLE PATTERN REGISTRY
========================================

${JSON.stringify(PATTERNS, null, 2)}

========================================
AVAILABLE DATA STRUCTURE REGISTRY
========================================

${JSON.stringify(DATA_STRUCTURES, null, 2)}

========================================
CLASSIFICATION RULES
========================================

1. Never invent a pattern name.

2. Never invent a data structure name.

3. Use the exact spelling and capitalization
   from the registries.

4. Identify ALL genuinely applicable patterns.
   Do not return only one pattern when multiple
   valid approaches exist.

5. Do not recommend patterns merely because
   their names resemble words in the question.

6. Distinguish between:

   direct:
   The approach applies to the problem as stated.

   conditional:
   The approach requires an additional condition,
   such as sorted input, a specific constraint,
   or preprocessing.

7. Explain every condition required by a
   conditional approach.

8. Associate data structures with their
   corresponding approaches.

9. Distinguish between:

   input:
   The original input structure.

   primary:
   The main structure used by the algorithm.

   auxiliary:
   An additional structure supporting execution.

   execution:
   A structure used to illustrate execution,
   such as a recursion call stack.

10. Do not confuse algorithms, patterns and
    data structures.

11. Recursion is a pattern, not a data structure.
    Call Stack is a registered data structure.

12. Multiple approaches may use different
    data structures.

13. For custom visualization requests, identify
    the requested concept, pattern and structures.
    Do not force a problem-solving classification
    when the user only requests a demonstration.

14. Do not invent missing problem parameters.

15. If the request is ambiguous, explain what
    information is missing and request clarification.

16. Do not generate JavaScript implementations.
    Do not generate executable code.

17. Do not calculate algorithm complexity yet.
    Complexity will come from the verified
    algorithm selected later.

18. If no registered pattern applies, return
    an empty approaches array rather than inventing
    a new pattern.

========================================
REQUIRED JSON RESPONSE
========================================

Return valid JSON only.

Follow this exact structure:

{
  "mode": "problem_solving",
  "requestSummary": "Brief explanation of the request",

  "keywords": [],

  "clues": [
    {
      "text": "A clue identified in the question",
      "suggests": "A registered pattern name",
      "reason": "Why this clue is relevant"
    }
  ],

  "approaches": [
    {
      "pattern": "Hashing",
      "applicability": "direct",
      "reason": "Why this pattern is applicable",
      "conditions": [],

      "dataStructures": [
        {
          "name": "Array",
          "role": "input",
          "reason": "Why this structure is used"
        },
        {
          "name": "Hash Map",
          "role": "auxiliary",
          "reason": "Why this structure is used"
        }
      ]
    }
  ],

  "requestedDataStructures": [],

  "reasoning": "Overall classification explanation",

  "confidence": 0.95,

  "requiresClarification": false,

  "clarificationQuestion": ""
}

========================================
IMPORTANT
========================================

- Every approach must have exactly one registered
  pattern name.
- An approach's data structures must be selected
  from the registered data structures.
- Multiple approaches are allowed.
- requestedDataStructures should contain structures
  explicitly requested in custom visualization
  requests.
- Use empty arrays when there are no applicable entries.
- Confidence must be between 0 and 1.
- Return JSON without Markdown fences.
`;
}

/**
 * Analyze a DSA question or custom visualization request.
 */
export async function analyzeDSARequest(userRequest, options = {}) {
  const request = typeof userRequest === "string"
    ? userRequest.trim()
    : "";

  if (!request) {
    throw new Error("Please enter a DSA question or visualization request.");
  }

  // Run deterministic analysis before contacting the local model.
  // This result remains available even if Ollama fails.
  const ruleAnalysis = generateRuleBasedRecommendations(request);

  // Explicitly named sorting and searching algorithms do not need an AI guess.
  // Their local classification is deterministic and registry-validated.
  const explicitAlgorithmMatch = ruleAnalysis.approaches.find(
    approach =>
      [
        "explicit_named_sorting_algorithm",
        "explicit_named_searching_algorithm"
      ].includes(approach.source) ||
      approach.pattern === "Stack Operations"
  );

  if (explicitAlgorithmMatch) {
    const emptyAnalysis = {
      mode: "problem_solving",
      requestSummary: request,
      keywords: [],
      clues: [],
      approaches: [],
      requestedDataStructures: [],
      reasoning: "",
      confidence: 1,
      requiresClarification: false,
      clarificationQuestion: ""
    };

    return {
      ...integrateAnalysis(emptyAnalysis, ruleAnalysis),
      analysisProvider: "deterministic_fallback",
      analysisWarning: explicitAlgorithmMatch.pattern === "Stack Operations"
        ? "Stack operations recognized by DSA_L local rules."
        : "Explicit algorithm recognized by DSA_L local rules."
    };
  }

  const systemPrompt = buildSystemPrompt();

  const userPrompt = JSON.stringify({
    userRequest: request,
  });

  const generateModelJSON =
    typeof options.generateJSON === "function"
      ? options.generateJSON
      : generateJSON;

  let validatedAnalysis;

  try {
    const result = await generateModelJSON(
      systemPrompt,
      userPrompt,
      { numPredict: 750 }
    );

    validatedAnalysis = validateAnalysis(result);
  } catch (error) {
    return buildDeterministicFallback(
      request,
      ruleAnalysis,
      error
    );
  }

  return {
    ...applyDeterministicIntelligence(
      request,
      validatedAnalysis,
      ruleAnalysis
    ),
    analysisProvider: "qwen",
    analysisWarning: ""
  };
}

/**
 * Use curated recommendations when local AI output is unavailable
 * or fails validation. Never invent recommendations for unmatched
 * problems.
 */
function buildDeterministicFallback(request, ruleAnalysis, error) {
  const failureReason =
    error instanceof Error
      ? error.message
      : "Unknown local AI error.";

  const warning =
    `Qwen analysis unavailable (${failureReason}). ` +
    "DSA_L used its local deterministic analysis.";

  const emptyAnalysis = {
    mode: "problem_solving",
    requestSummary: request,
    keywords: [],
    clues: [],
    approaches: [],
    requestedDataStructures: [],
    reasoning: "",
    confidence: 0,
    requiresClarification: false,
    clarificationQuestion: ""
  };

  // A verified rule match is sufficient to continue.
  if (ruleAnalysis.hasCuratedRecommendations) {
    return {
      ...integrateAnalysis(emptyAnalysis, ruleAnalysis),
      analysisProvider: "deterministic_fallback",
      analysisWarning: warning
    };
  }

  // No matching rule and no valid AI response:
  // expose the limitation without fabricating an approach.
  return {
    ...emptyAnalysis,

    keywords: ruleAnalysis.properties
      .map(property => property.evidence)
      .filter(Boolean),

    primaryPattern: "",
    secondaryPatterns: [],
    recommendedDataStructures: [],
    requestedDataStructure: "",

    reasoning:
      "DSA_L has no curated recommendation for this request, " +
      "and the local AI model could not provide a validated analysis. " +
      "No algorithmic approach has been recommended.",

    recommendationSource: "none",
    recommendationStatus: "no_curated_match",

    matchedProperties: ruleAnalysis.properties,

    analysisProvider: "deterministic_fallback",
    analysisWarning:
      `${warning} No curated recommendation rule matched this request.`
  };
}

/**
 * Apply curated reasoning after validating the local AI response.
 *
 * Custom visualization requests retain their original mode.
 * Problem-solving requests use curated recommendations whenever
 * an applicable local rule exists.
 */
export function applyDeterministicIntelligence(
  request,
  validatedAnalysis,
  precomputedRuleAnalysis = null
) {
  if (validatedAnalysis.mode === "custom_visualization") {
    return {
      ...validatedAnalysis,
      recommendationSource: "custom_visualization",
      recommendationStatus: "not_applicable"
    };
  }

  const ruleAnalysis = precomputedRuleAnalysis ||
    generateRuleBasedRecommendations(request);

  return integrateAnalysis(
    validatedAnalysis,
    ruleAnalysis
  );
}

/**
 * Validate and sanitize the AI response.
 *
 * Any pattern or data structure not present in our
 * registries is rejected.
 */
function validateAnalysis(result) {
  if (!result || typeof result !== "object") {
    throw new Error("Invalid AI analysis response.");
  }

  if (!VALID_MODES.includes(result.mode)) {
    throw new Error("AI returned an unsupported request mode.");
  }

  if (!Array.isArray(result.approaches)) {
    throw new Error("AI did not return a valid approaches array.");
  }

  if (!Array.isArray(result.requestedDataStructures)) {
    throw new Error("AI did not return a valid requestedDataStructures array.");
  }

  // if (typeof result.requiresClarification !== "boolean") {
  //     throw new Error("Invalid clarification status.");
  // }
  const clarificationQuestion =
    typeof result.clarificationQuestion === "string"
      ? result.clarificationQuestion.trim()
      : "";

  let requiresClarification;

  if (typeof result.requiresClarification === "boolean") {
    requiresClarification = result.requiresClarification;
  } else if (typeof result.requiresClarification === "string") {
    const normalized = result.requiresClarification.toLowerCase().trim();

    if (normalized === "true") {
      requiresClarification = true;
    } else if (normalized === "false") {
      requiresClarification = false;
    } else {
      throw new Error("AI returned an invalid clarification value.");
    }
  } else if (
    result.requiresClarification === undefined ||
    result.requiresClarification === null
  ) {
    // Recover omitted status from the clarification question.
    requiresClarification = clarificationQuestion.length > 0;
  } else {
    throw new Error("AI returned an invalid clarification status.");
  }

  if (
    typeof result.confidence !== "number" ||
    !Number.isFinite(result.confidence) ||
    result.confidence < 0 ||
    result.confidence > 1
  ) {
    throw new Error("Invalid analysis confidence.");
  }

  let rejectedPatterns = 0;
  let rejectedStructures = 0;

  const seenPatterns = new Set();

  const approaches = result.approaches
    .map((approach) => {
      if (!approach || typeof approach !== "object") {
        rejectedPatterns++;
        return null;
      }

      const patternName =
        typeof approach.pattern === "string" ? approach.pattern.trim() : "";

      // Reject names that are not in our Pattern Registry.
      if (!PATTERN_SET.has(patternName)) {
        rejectedPatterns++;
        return null;
      }

      // Avoid duplicate approaches.
      if (seenPatterns.has(patternName)) {
        return null;
      }

      seenPatterns.add(patternName);

      const applicability = VALID_APPLICABILITY.includes(approach.applicability)
        ? approach.applicability
        : "conditional";

      const rawStructures = Array.isArray(approach.dataStructures)
        ? approach.dataStructures
        : [];

      const seenStructures = new Set();

      const dataStructures = rawStructures
        .map((structure) => {
          if (!structure || typeof structure !== "object") {
            rejectedStructures++;
            return null;
          }

          const name =
            typeof structure.name === "string" ? structure.name.trim() : "";

          // Reject names outside our Data Structure Registry.
          if (!DATA_STRUCTURE_SET.has(name)) {
            rejectedStructures++;
            return null;
          }

          if (seenStructures.has(name)) {
            return null;
          }

          seenStructures.add(name);

          return {
            name,

            role: VALID_ROLES.includes(structure.role)
              ? structure.role
              : "auxiliary",

            reason:
              typeof structure.reason === "string" ? structure.reason : "",
          };
        })
        .filter(Boolean);

      return {
        pattern: patternName,
        applicability,

        reason: typeof approach.reason === "string" ? approach.reason : "",

        conditions: normalizeStringArray(approach.conditions),

        dataStructures,
      };
    })
    .filter(Boolean);

  const requestedDataStructures = [
    ...new Set(
      result.requestedDataStructures.filter(
        (name) => typeof name === "string" && DATA_STRUCTURE_SET.has(name),
      ),
    ),
  ];

  const keywords = normalizeStringArray(result.keywords);

  const clues = Array.isArray(result.clues)
    ? result.clues
        .filter((clue) => clue && typeof clue === "object")
        .map((clue) => ({
          text: safeString(clue.text),
          suggests: safeString(clue.suggests),
          reason: safeString(clue.reason),
        }))
    : [];

  // Compatibility fields for the existing analysis UI.
  const primaryApproach =
    approaches.find((item) => item.applicability === "direct") ||
    approaches[0] ||
    null;

  const recommendedDataStructures = [
    ...new Set([
      ...approaches.flatMap((approach) =>
        approach.dataStructures.map((item) => item.name),
      ),
      ...requestedDataStructures,
    ]),
  ];

  const secondaryPatterns = approaches
    .filter((approach) => approach !== primaryApproach)
    .map((approach) => approach.pattern);

  return {
    mode: result.mode,

    requestSummary: safeString(result.requestSummary),

    keywords,
    clues,
    approaches,

    requestedDataStructures,

    reasoning: safeString(result.reasoning),

    confidence: result.confidence,

    requiresClarification,

    // requiresClarification: result.requiresClarification,

    clarificationQuestion: safeString(result.clarificationQuestion),

    // Legacy UI compatibility.
    primaryPattern: primaryApproach?.pattern || "",
    secondaryPatterns,
    recommendedDataStructures,
    requestedDataStructure: requestedDataStructures[0] || "",
    timeComplexity: "",
    spaceComplexity: "",
    concepts: [],

    // Useful for diagnostics.
    registryValidation: {
      rejectedPatterns,
      rejectedStructures,
    },
  };
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
