import assert from "node:assert/strict";

import {
  generateRuleBasedRecommendations
} from "../js/intelligence/recommendation-engine.js";

function patternsFor(question) {
  return generateRuleBasedRecommendations(question)
    .approaches.map(item => item.pattern);
}

function getApproach(result, pattern) {
  return result.approaches.find(item => item.pattern === pattern);
}

// TEST 1: Unsorted or unspecified Two Sum.
const twoSumQuestion =
  "Given an array of integers, return the indices of two numbers whose sum equals a target.";

const twoSum = generateRuleBasedRecommendations(twoSumQuestion);

assert.ok(patternsFor(twoSumQuestion).includes("Hashing"));
assert.ok(!patternsFor(twoSumQuestion).includes("Two Pointers"));

const hashing = getApproach(twoSum, "Hashing");

assert.equal(hashing.applicability, "direct");
assert.ok(hashing.dataStructures.some(item => item.name === "Array" && item.role === "input"));
assert.ok(hashing.dataStructures.some(item => item.name === "Hash Map" && item.role === "auxiliary"));

console.log("PASS: Unsorted/unspecified Two Sum recommends Hashing and Hash Map.");

// TEST 2: Sorted Two Sum.
const sortedTwoSum =
  "Given a sorted array of integers, find two numbers whose sum equals a target.";

const sortedResult = generateRuleBasedRecommendations(sortedTwoSum);

assert.ok(patternsFor(sortedTwoSum).includes("Hashing"));
assert.ok(patternsFor(sortedTwoSum).includes("Two Pointers"));

console.log("PASS: Sorted Two Sum also recommends Two Pointers.");

// TEST 2B: Concrete nums input and literal target sum.
const concreteTwoSum =
  "Given nums = [2, 7, 11, 15], find two numbers whose sum is 9.";

assert.ok(patternsFor(concreteTwoSum).includes("Hashing"));
assert.ok(!patternsFor(concreteTwoSum).includes("Two Pointers"));

console.log("PASS: Concrete nums input recommends Hashing without assuming sorted constraints.");

// TEST 2C: Concrete input with an explicit sorted guarantee.
const concreteSortedTwoSum =
  "Given a sorted array nums = [2, 7, 11, 15], find two numbers whose sum is 9.";

assert.ok(patternsFor(concreteSortedTwoSum).includes("Hashing"));
assert.ok(patternsFor(concreteSortedTwoSum).includes("Two Pointers"));

console.log("PASS: Concrete sorted Two Sum recommends Hashing and Two Pointers.");


// TEST 3: Explicitly unsorted Two Sum.
const unsortedTwoSum =
  "Given an unsorted array of integers, find two numbers whose sum equals a target.";

const unsortedResult = generateRuleBasedRecommendations(unsortedTwoSum);

assert.ok(!patternsFor(unsortedTwoSum).includes("Two Pointers"));
assert.ok(patternsFor(unsortedTwoSum).includes("Hashing"));

console.log("PASS: Explicitly unsorted input does not trigger Two Pointers.");

// TEST 4: Next Greater Element.
const nextGreater =
  "Find the next greater element for every element in the array.";

const nextGreaterResult = generateRuleBasedRecommendations(nextGreater);

const monotonicStack = getApproach(nextGreaterResult, "Monotonic Stack");

assert.ok(monotonicStack);
assert.ok(monotonicStack.dataStructures.some(item => item.name === "Stack"));

console.log("PASS: Next Greater Element recommends Monotonic Stack.");

// TEST 5: Unweighted shortest path.
const shortestPath =
  "Find the shortest path in an unweighted graph.";

const graphResult = generateRuleBasedRecommendations(shortestPath);

const bfs = getApproach(graphResult, "Breadth-First Search (BFS)");

assert.ok(bfs);
assert.ok(bfs.dataStructures.some(item => item.name === "Queue"));
assert.ok(bfs.dataStructures.some(item => item.name === "Graph Adjacency List"));

console.log("PASS: Unweighted shortest path recommends BFS and Queue.");

// TEST 6: Top K.
const topK =
  "Find the K largest elements in an unsorted array.";

const topKResult = generateRuleBasedRecommendations(topK);

const heap = getApproach(topKResult, "Heap / Priority Queue");

assert.ok(heap);
assert.ok(heap.dataStructures.some(item => item.name === "Heap / Priority Queue"));

console.log("PASS: Top-K selection recommends Heap / Priority Queue.");

// TEST 7: Unsupported problem should not receive invented recommendations.
const unknown =
  "Design an algorithm for a problem with an unspecified mathematical objective.";

const unknownResult = generateRuleBasedRecommendations(unknown);

assert.equal(unknownResult.approaches.length, 0);
assert.equal(unknownResult.status, "no_curated_rule_matched");

console.log("PASS: Unmatched problems do not receive fabricated recommendations.");

// TEST 8: Identical input must produce identical recommendations.
const repeated = generateRuleBasedRecommendations(twoSumQuestion);

assert.deepEqual(repeated, twoSum);

console.log("PASS: Identical requests produce deterministic recommendations.");

// TEST 9: Recommendations include evidence and explanations.
assert.ok(hashing.evidence.length > 0);
assert.ok(hashing.knowledge.purpose);
assert.ok(hashing.knowledge.limitations.length > 0);

console.log("PASS: Recommendations include evidence and curated reasoning.");

console.log("\nRECOMMENDATION ENGINE TESTS PASSED.");
