
import assert from "node:assert/strict";

import {
  analyzeProblemProperties
} from "../js/intelligence/problem-property-analyzer.js";

// Test 1: Standard Two Sum.
const twoSum = analyzeProblemProperties(
  "Given an array of integers, return the indices of two numbers whose sum equals a target."
);

assert.ok(twoSum.getProperty("targetSumPair"));
assert.ok(twoSum.getProperty("arrayInput"));
assert.ok(twoSum.getProperty("originalIndices"));
assert.ok(twoSum.getProperty("sumConstraint"));
assert.ok(twoSum.isUnknown("sortedInput"));

console.log("PASS: Standard Two Sum properties detected.");

// Test 2: Sorted Two Sum.
const sortedTwoSum = analyzeProblemProperties(
  "Given a sorted array, find two numbers whose sum equals the target."
);

assert.ok(sortedTwoSum.getProperty("targetSumPair"));
assert.ok(sortedTwoSum.getProperty("sortedInput"));

console.log("PASS: Sorted input correctly identified.");

// Test 3: Non-negative sliding-window problem.
const nonNegative = analyzeProblemProperties(
  "Find the longest contiguous subarray with sum at most K using non-negative integers."
);

assert.ok(nonNegative.getProperty("contiguousRange"));
assert.ok(nonNegative.getProperty("nonNegativeValues"));
assert.ok(nonNegative.getProperty("optimizationObjective"));

console.log("PASS: Contiguous range and non-negative constraints detected.");

// Test 4: Negative values.
const negative = analyzeProblemProperties(
  "Find the longest subarray with a target sum where the array may contain negative numbers."
);

assert.ok(negative.getProperty("negativeValues"));
assert.ok(negative.getProperty("contiguousRange"));
assert.ok(negative.getProperty("sumConstraint"));

console.log("PASS: Negative-value constraint detected.");

// Test 5: Top K.
const topK = analyzeProblemProperties(
  "Find the K largest elements in an unsorted array."
);

assert.ok(topK.getProperty("topK"));
assert.ok(topK.getProperty("arrayInput"));

console.log("PASS: Top-K selection properties detected.");

// Test 6: Monotonic stack problem.
const nextGreater = analyzeProblemProperties(
  "Find the next greater element for every element in the array."
);

assert.ok(nextGreater.getProperty("nextGreater"));
assert.ok(nextGreater.getProperty("arrayInput"));

console.log("PASS: Next-greater-element properties detected.");

// Test 7: Graph shortest path.
const graph = analyzeProblemProperties(
  "Find the shortest path in an unweighted graph."
);

assert.ok(graph.getProperty("graphInput"));
assert.ok(graph.getProperty("shortestPath"));
assert.ok(graph.getProperty("unweightedGraph"));

console.log("PASS: Unweighted graph shortest-path properties detected.");

// Test 8: Prevent a weak false positive.
const unrelated = analyzeProblemProperties(
  "Find two numbers in an array."
);

assert.ok(unrelated.getProperty("arrayInput"));
assert.ok(unrelated.isUnknown("targetSumPair"));

console.log("PASS: Unrelated two-number question did not trigger Two Sum detection.");

// Test 9: Empty input.
assert.throws(
  () => analyzeProblemProperties(""),
  /non-empty problem statement/
);

console.log("PASS: Empty input rejected safely.");

console.log("\nPROBLEM PROPERTY ANALYZER TESTS PASSED.");
