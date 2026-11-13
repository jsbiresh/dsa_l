import assert from "node:assert/strict";

import {
    hashKey,
    validateHashMapState,
    buildHashBuckets,
    findHashMapEntry
} from "../js/graphics/models/hash-map-model.js";

// Numeric hashing.
assert.equal(hashKey(7, 5), 2);
assert.equal(hashKey(2, 5), 2);
assert.equal(hashKey(0, 5), 0);
assert.equal(hashKey(-1, 5), 4);

console.log("PASS: Numeric hash calculation.");

// String hashing.
const stringHash = hashKey("john", 7);

assert.ok(stringHash >= 0 && stringHash < 7);
assert.equal(hashKey("john", 7), stringHash);

console.log("PASS: Deterministic string hashing.");

// Separate chaining.
const state = {
    capacity: 5,
    entries: [
        { id: "e1", key: 2, value: 0 },
        { id: "e2", key: 7, value: 1 },
        { id: "e3", key: 12, value: 2 },
        { id: "e4", key: 3, value: 3 }
    ]
};

const buckets = buildHashBuckets(state);

assert.equal(buckets[2].entries.length, 3);
assert.equal(buckets[3].entries.length, 1);

assert.deepEqual(
    buckets[2].entries.map(item => item.key),
    [2, 7, 12]
);

console.log("PASS: Separate chaining handles collisions.");

// Lookup.
const found = findHashMapEntry(state, 7);

assert.equal(found.found, true);
assert.equal(found.bucketIndex, 2);
assert.equal(found.entry.value, 1);

console.log("PASS: Hash Map lookup locates the correct key.");

// Missing key.
const missing = findHashMapEntry(state, 99);

assert.equal(missing.found, false);
assert.equal(missing.bucketIndex, 4);
assert.equal(missing.entry, null);

console.log("PASS: Missing key reports not found.");

// Numeric and string keys remain distinct.
const mixed = {
    capacity: 5,
    entries: [
        { id: "number", key: 5, value: "numeric" },
        { id: "string", key: "5", value: "text" }
    ]
};

assert.equal(buildHashBuckets(mixed)[0].entries.length, 1);

console.log("PASS: Numeric and string keys remain distinct.");

// Duplicate IDs must be rejected.
assert.throws(
    () => validateHashMapState({
        capacity: 5,
        entries: [
            { id: "same", key: 1, value: 1 },
            { id: "same", key: 2, value: 2 }
        ]
    }),
    /Duplicate Hash Map entry ID/
);

console.log("PASS: Duplicate entry IDs rejected.");

// Duplicate keys must be rejected.
assert.throws(
    () => validateHashMapState({
        capacity: 5,
        entries: [
            { id: "e1", key: 2, value: 1 },
            { id: "e2", key: 2, value: 2 }
        ]
    }),
    /Duplicate Hash Map key/
);

console.log("PASS: Duplicate keys rejected.");

// Invalid capacity must be rejected.
assert.throws(
    () => hashKey(2, 0),
    /capacity/
);

console.log("PASS: Invalid capacity rejected.");

// Invalid key types must be rejected.
assert.throws(
    () => hashKey({}, 5),
    /keys must be strings or numbers/
);

console.log("PASS: Invalid key types rejected.");

console.log("\nHASH MAP MODEL TESTS PASSED.");
