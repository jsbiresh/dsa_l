import { getDataStructureKnowledge } from "../knowledge/data-structure-knowledge-base.js";

const VALID_ROLES = new Set([
  "input",
  "primary",
  "auxiliary",
  "execution"
]);

/**
 * DSA_L — Data Structure Recommender
 *
 * Converts the structures selected by a curated pattern rule into
 * validated, explainable recommendations.
 */

export function recommendDataStructures(structureDefinitions) {
  if (!Array.isArray(structureDefinitions)) {
    throw new TypeError("Structure definitions must be an array.");
  }

  const seen = new Set();

  return structureDefinitions.map(definition => {
    if (!definition || typeof definition !== "object") {
      throw new TypeError("Invalid data structure definition.");
    }

    const { name, role, reason } = definition;

    if (typeof name !== "string" || !name.trim()) {
      throw new Error("A data structure name is required.");
    }

    if (!VALID_ROLES.has(role)) {
      throw new Error(`Invalid role for ${name}: ${role}`);
    }

    if (seen.has(name)) {
      throw new Error(`Duplicate data structure recommendation: ${name}`);
    }

    seen.add(name);

    const knowledge = getDataStructureKnowledge(name);

    if (!knowledge) {
      throw new Error(`No curated knowledge exists for: ${name}`);
    }

    return {
      name,
      role,
      reason,

      knowledge: {
        purpose: knowledge.purpose,
        strengths: [...knowledge.strengths],
        tradeOffs: [...knowledge.tradeOffs],
        operations: { ...knowledge.operations }
      }
    };
  });
}
