
/**
 * DSA_L — Hash Map State Model
 *
 * Initial implementation:
 * - Numeric and string keys.
 * - Primitive values.
 * - Fixed bucket capacity.
 * - Separate chaining for collisions.
 *
 * This module has no dependency on Konva or the browser.
 */

export function hashKey(key, capacity) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 32) {
        throw new RangeError("Hash Map capacity must be between 1 and 32.");
    }

    if (typeof key === "number") {
        if (!Number.isFinite(key)) {
            throw new TypeError("Numeric keys must be finite.");
        }

        const integer = Math.trunc(key);
        return ((integer % capacity) + capacity) % capacity;
    }

    if (typeof key === "string") {
        let hash = 0;

        for (const character of key) {
            hash = (
                Math.imul(hash, 31) + character.codePointAt(0)
            ) >>> 0;
        }

        return hash % capacity;
    }

    throw new TypeError("Hash Map keys must be strings or numbers.");
}

export function validateHashMapState(state) {
    if (!state || typeof state !== "object" || Array.isArray(state)) {
        throw new TypeError("Hash Map state must be an object.");
    }

    const { capacity, entries } = state;

    if (
        !Number.isInteger(capacity) ||
        capacity < 1 ||
        capacity > 32
    ) {
        throw new RangeError("Hash Map capacity must be between 1 and 32.");
    }

    if (!Array.isArray(entries)) {
        throw new TypeError("Hash Map state requires an entries array.");
    }

    if (entries.length > 500) {
        throw new RangeError("Hash Map supports a maximum of 500 entries.");
    }

    const ids = new Set();
    const keys = new Set();

    const normalizedEntries = entries.map((entry, index) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            throw new TypeError(`Invalid Hash Map entry at index ${index}.`);
        }

        if (
            typeof entry.id !== "string" ||
            !entry.id.trim()
        ) {
            throw new TypeError(`Hash Map entry ${index} requires an ID.`);
        }

        if (ids.has(entry.id)) {
            throw new Error(`Duplicate Hash Map entry ID: ${entry.id}`);
        }

        ids.add(entry.id);

        hashKey(entry.key, capacity);

        const keyIdentity = `${typeof entry.key}:${String(entry.key)}`;

        if (keys.has(keyIdentity)) {
            throw new Error(`Duplicate Hash Map key: ${String(entry.key)}`);
        }

        keys.add(keyIdentity);

        if (!Object.prototype.hasOwnProperty.call(entry, "value")) {
            throw new TypeError(`Hash Map entry ${index} requires a value.`);
        }

        const valueType = typeof entry.value;

        if (
            entry.value !== null &&
            !["string", "number", "boolean"].includes(valueType)
        ) {
            throw new TypeError(
                `Hash Map entry ${index} must have a primitive value.`
            );
        }

        if (valueType === "number" && !Number.isFinite(entry.value)) {
            throw new TypeError("Hash Map values must be finite.");
        }

        return {
            id: entry.id,
            key: entry.key,
            value: entry.value
        };
    });

    return {
        capacity,
        entries: normalizedEntries
    };
}

/**
 * Construct the bucket representation using separate chaining.
 */
export function buildHashBuckets(state) {
    const normalized = validateHashMapState(state);

    const buckets = Array.from(
        { length: normalized.capacity },
        (_, index) => ({
            index,
            entries: []
        })
    );

    for (const entry of normalized.entries) {
        const bucketIndex = hashKey(
            entry.key,
            normalized.capacity
        );

        buckets[bucketIndex].entries.push({
            ...entry,
            bucketIndex
        });
    }

    return buckets;
}

export function findHashMapEntry(state, key) {
    const normalized = validateHashMapState(state);

    const bucketIndex = hashKey(key, normalized.capacity);

    const entry = normalized.entries.find(
        item =>
            typeof item.key === typeof key &&
            item.key === key
    );

    return {
        bucketIndex,
        found: Boolean(entry),
        entry: entry ? { ...entry } : null
    };
}
