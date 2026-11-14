
/**
 * DSA_L — Deterministic Problem Property Analyzer
 *
 * Extracts explicit problem properties using local rules.
 *
 * This module does not use AI and does not invent missing
 * constraints. Unknown properties remain unknown.
 */

const PROPERTY_RULES = Object.freeze([
  {
    id: "targetSumPair",
    label: "Find two values matching a target sum",
    patterns: [
      /\b(?:two[\s-]+sum|pair[\s-]+sum|target[\s-]+sum)\b/i,

      /\b(?:two|2)\s+(?:distinct\s+)?(?:numbers?|values?|elements?)\b[\s\S]{0,100}\bwhose\s+sum\b/i,

      /\b(?:two|2)\s+(?:distinct\s+)?(?:numbers?|values?|elements?)\b[\s\S]{0,100}\b(?:sum|adds?\s+up|total)\b[\s\S]{0,80}\btarget\b/i,

      /\b(?:sum|adds?\s+up|total)\b[\s\S]{0,80}\btarget\b[\s\S]{0,100}\b(?:two|2)\s+(?:numbers?|values?|elements?)\b/i,

      /\bfind\s+(?:a\s+)?pair\b[\s\S]{0,80}\btarget\b/i
    ]
  },
  {
    id: "sortedInput",
    label: "Input is sorted",
    patterns: [
      /\bsorted\b/i,
      /\bnon[\s-]?decreasing\b/i,
      /\bnon[\s-]?increasing\b/i,
      /\bascending\s+order\b/i,
      /\bdescending\s+order\b/i
    ],
    excludePatterns: [
      /\bunsorted\b/i,
      /\bnot\s+(?:necessarily\s+)?sorted\b/i,
      /\bnot\s+in\s+sorted\s+order\b/i
    ]
  },
  {
    id: "originalIndices",
    label: "Original indices or positions are required",
    patterns: [
      /\bindices?\b/i,
      /\boriginal\s+positions?\b/i,
      /\breturn\s+positions?\b/i
    ]
  },
  {
    id: "arrayInput",
    label: "Array input",
    patterns: [
      /\barray\b/i,
      /\binteger\s+array\b/i,
      /\b(?:nums|arr|values|input)\s*=\s*\[/i
    ]
  },
  {
    id: "stringInput",
    label: "String input",
    patterns: [
      /\bstring\b/i,
      /\bsubstring\b/i,
      /\bcharacters?\b/i
    ]
  },
  {
    id: "contiguousRange",
    label: "Contiguous range is involved",
    patterns: [
      /\bsubarray\b/i,
      /\bsubstring\b/i,
      /\bcontiguous\b/i,
      /\bconsecutive\s+elements\b/i
    ]
  },
  {
    id: "nonNegativeValues",
    label: "Non-negative values are specified",
    patterns: [
      /\bnon[\s-]?negative\b/i,
      /\bpositive\s+integers?\b/i,
      /\bpositive\s+numbers?\b/i
    ]
  },
  {
    id: "negativeValues",
    label: "Negative values are specified",
    patterns: [
      /\bnegative\s+(?:numbers?|values?|integers?|elements?)\b/i,
      /\bmay\s+contain\s+negative\b/i,
      /\bincluding\s+negative\b/i
    ]
  },
  {
    id: "sumConstraint",
    label: "A sum or total constraint is involved",
    patterns: [
      /\bsum\b/i,
      /\btotal\b/i,
      /\bsumming\b/i
    ]
  },
  {
    id: "optimizationObjective",
    label: "An optimization objective is involved",
    patterns: [
      /\blongest\b/i,
      /\bshortest\b/i,
      /\bmaximum\b/i,
      /\bminimum\b/i,
      /\bmaximize\b/i,
      /\bminimize\b/i
    ]
  },
  {
    id: "topK",
    label: "Top-K or K-th selection is involved",
    patterns: [
      /\btop\s*-?\s*k\b/i,
      /\bk\s+(?:largest|smallest|highest|lowest)\b/i,
      /\bkth\s+(?:largest|smallest|highest|lowest)\b/i
    ]
  },
  {
    id: "stackOperationRequest",
    label: "Basic Stack operations are requested",
    patterns: [
      /\bstack\s+operations?\b/i,
      /\bstack\b[\s\S]{0,80}\b(?:push|pop|peek|top|size|isempty|isfull)\b/i,
      /\b(?:push|pop|peek|top|isEmpty|isFull)\s*\(/i,
      /\b(?:explain|demonstrate|show|teach|visualize|implement)\b[\s\S]{0,80}\bstack\b/i
    ],
    excludePatterns: [
      /\bmonotonic\s+stack\b/i,
      /\bnext\s+(?:greater|smaller)\b/i,
      /\bprevious\s+(?:greater|smaller)\b/i
    ]
  },

  {
    id: "nextGreater",
    label: "Next greater or smaller element is required",
    patterns: [
      /\bnext\s+greater\b/i,
      /\bnext\s+smaller\b/i,
      /\bprevious\s+greater\b/i,
      /\bprevious\s+smaller\b/i
    ]
  },
  {
    id: "palindrome",
    label: "Palindrome checking is involved",
    patterns: [
      /\bpalindrome\b/i
    ]
  },
  {
    id: "graphInput",
    label: "Graph input or graph relationships are involved",
    patterns: [
      /\bgraph\b/i,
      /\bvertices\b/i,
      /\bedges\b/i,
      /\bconnected\s+components\b/i,
      /\bconnected\s+nodes\b/i
    ]
  },
  {
    id: "treeInput",
    label: "Tree input is involved",
    patterns: [
      /\bbinary\s+tree\b/i,
      /\bn[\s-]?ary\s+tree\b/i,
      /\btree\s+nodes?\b/i
    ]
  },
  {
    id: "gridInput",
    label: "Two-dimensional grid input is involved",
    patterns: [
      /\bgrid\b/i,
      /\bmatrix\b/i,
      /\brows?\s+and\s+columns?\b/i
    ]
  },
  {
    id: "shortestPath",
    label: "Shortest path or minimum-step calculation is required",
    patterns: [
      /\bshortest\s+path\b/i,
      /\bminimum\s+(?:number\s+of\s+)?steps\b/i,
      /\bfewest\s+(?:moves|edges|steps)\b/i
    ]
  },
  {
    id: "unweightedGraph",
    label: "Unweighted graph is specified",
    patterns: [
      /\bunweighted\s+graph\b/i
    ]
  },
  {
    id: "weightedGraph",
    label: "Weighted graph is specified",
    patterns: [
      /\bweighted\s+graph\b/i,
      /\bedge\s+weights?\b/i
    ]
  },
  {
    id: "rangeQueries",
    label: "Range queries are involved",
    patterns: [
      /\brange\s+queries\b/i,
      /\bquery\s+the\s+sum\b/i,
      /\bqueries\s+over\s+(?:a\s+)?range\b/i
    ]
  }
]);

function findEvidence(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * Analyse explicit properties of a DSA question.
 *
 * @param {string} userRequest
 * @returns {{
 *   properties: Array<{id:string,label:string,evidence:string}>,
 *   getProperty: (id:string) => boolean,
 *   isUnknown: (id:string) => boolean
 * }}
 */
export function analyzeProblemProperties(userRequest) {
  if (typeof userRequest !== "string" || !userRequest.trim()) {
    throw new Error("A non-empty problem statement is required.");
  }

  const properties = [];

  for (const rule of PROPERTY_RULES) {
    const excluded = Array.isArray(rule.excludePatterns) &&
      rule.excludePatterns.some(pattern => pattern.test(userRequest));

    if (excluded) {
      continue;
    }

    const evidence = findEvidence(userRequest, rule.patterns);

    if (evidence) {
      properties.push({
        id: rule.id,
        label: rule.label,
        evidence
      });
    }
  }

  const detectedIds = new Set(
    properties.map(property => property.id)
  );

  return Object.freeze({
    properties: Object.freeze(properties),

    getProperty(id) {
      return detectedIds.has(id);
    },

    isUnknown(id) {
      return !detectedIds.has(id);
    }
  });
}
