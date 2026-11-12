import assert from "node:assert/strict";

import { PATTERNS } from "../js/registry/pattern-registry.js";
import { DATA_STRUCTURES } from "../js/registry/data-structure-registry.js";

import {
  PATTERN_KNOWLEDGE_BASE,
  PATTERN_KNOWLEDGE_GAPS,
  getPatternKnowledge
} from "../js/knowledge/pattern-knowledge-base.js";

import {
  DATA_STRUCTURE_KNOWLEDGE_BASE,
  DATA_STRUCTURE_KNOWLEDGE_GAPS,
  getDataStructureKnowledge
} from "../js/knowledge/data-structure-knowledge-base.js";

// Every curated pattern must be registered.
for (const [name, knowledge] of Object.entries(PATTERN_KNOWLEDGE_BASE)) {
  assert.ok(PATTERNS.includes(name), `Unregistered pattern: ${name}`);

  assert.ok(knowledge.purpose);
  assert.ok(Array.isArray(knowledge.clues));
  assert.ok(Array.isArray(knowledge.useWhen));
  assert.ok(Array.isArray(knowledge.avoidWhen));
  assert.ok(Array.isArray(knowledge.conditions));
  assert.ok(Array.isArray(knowledge.structures));
  assert.ok(Array.isArray(knowledge.strengths));
  assert.ok(Array.isArray(knowledge.limitations));
  assert.ok(Array.isArray(knowledge.questionsToAsk));

  for (const structure of knowledge.structures) {
    assert.ok(
      DATA_STRUCTURES.includes(structure),
      `${name} references unregistered structure: ${structure}`
    );
  }
}

// Every curated structure must be registered.
for (const [name, knowledge] of Object.entries(DATA_STRUCTURE_KNOWLEDGE_BASE)) {
  assert.ok(DATA_STRUCTURES.includes(name), `Unregistered structure: ${name}`);

  assert.ok(knowledge.purpose);
  assert.ok(Array.isArray(knowledge.strengths));
  assert.ok(Array.isArray(knowledge.tradeOffs));
  assert.ok(knowledge.operations);
  assert.ok(Array.isArray(knowledge.selectionClues));
  assert.ok(Array.isArray(knowledge.relatedPatterns));

  for (const pattern of knowledge.relatedPatterns) {
    assert.ok(
      PATTERNS.includes(pattern),
      `${name} references unregistered pattern: ${pattern}`
    );
  }
}

// Verify registry coverage is explicit.
assert.equal(
  Object.keys(PATTERN_KNOWLEDGE_BASE).length + PATTERN_KNOWLEDGE_GAPS.length,
  PATTERNS.length
);

assert.equal(
  Object.keys(DATA_STRUCTURE_KNOWLEDGE_BASE).length + DATA_STRUCTURE_KNOWLEDGE_GAPS.length,
  DATA_STRUCTURES.length
);

// Verify core Two Sum knowledge.
const hashing = getPatternKnowledge("Hashing");
const twoPointers = getPatternKnowledge("Two Pointers");
const hashMap = getDataStructureKnowledge("Hash Map");

assert.ok(hashing.structures.includes("Hash Map"));
assert.ok(twoPointers.structures.includes("Array"));
assert.ok(hashMap.selectionClues.includes("two sum"));

assert.equal(getPatternKnowledge("Unknown Pattern"), null);
assert.equal(getDataStructureKnowledge("Unknown Structure"), null);

console.log(`PASS: ${Object.keys(PATTERN_KNOWLEDGE_BASE).length} curated patterns validated.`);
console.log(`INFO: ${PATTERN_KNOWLEDGE_GAPS.length} patterns remain to be curated.`);

console.log(`PASS: ${Object.keys(DATA_STRUCTURE_KNOWLEDGE_BASE).length} data structures validated.`);
console.log(`INFO: ${DATA_STRUCTURE_KNOWLEDGE_GAPS.length} structures remain to be curated.`);

console.log("PASS: All knowledge references match the registries.");
console.log("PASS: Hashing, Two Pointers and Hash Map knowledge verified.");

console.log("\nKNOWLEDGE BASE TESTS PASSED.");
