/**
 * ComplexityCounter
 *
 * Tracks operations performed during algorithm execution.
 *
 * These counters measure actual instrumented operations.
 * They do not automatically calculate Big-O complexity.
 */

export class ComplexityCounter {

    constructor() {
        this.reset();
    }

    /**
     * Reset all counters.
     */
    reset() {
        this.counters = {
            comparisons: 0,
            arrayAccesses: 0,
            swaps: 0,
            assignments: 0,
            reads: 0,
            writes: 0,
            allocations: 0,
            hashLookups: 0,
            stackOperations: 0,
            queueOperations: 0,
            pointerUpdates: 0,
            nodeVisits: 0,
            edgeVisits: 0
        };
    }

    /**
     * Increment a specific counter.
     */
    increment(name, amount = 1) {

        if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
            throw new RangeError(
                "Counter increment must be a finite, non-negative number."
            );
        }

        if (!Object.prototype.hasOwnProperty.call(this.counters, name)) {
            throw new Error(
                "Unknown complexity counter: " + name
            );
        }

        this.counters[name] += amount;

        return this.counters[name];
    }

    /**
     * Add multiple metrics simultaneously.
     */
    add(metrics = {}) {

        if (
            metrics === null ||
            typeof metrics !== "object" ||
            Array.isArray(metrics)
        ) {
            throw new TypeError("Metrics must be an object.");
        }

        for (const name of Object.keys(metrics)) {
            this.increment(name, metrics[name]);
        }

        return this.getSnapshot();
    }

    /**
     * Return a copy of all counters.
     */
    getSnapshot() {
        return { ...this.counters };
    }

    /**
     * Return the sum of all tracked counters.
     */
    getTotalOperations() {

        return Object.values(this.counters).reduce(
            function (total, value) {
                return total + value;
            },
            0
        );
    }

    /**
     * Return the value of a specific counter.
     */
    getValue(name) {

        if (!Object.prototype.hasOwnProperty.call(this.counters, name)) {
            throw new Error(
                "Unknown complexity counter: " + name
            );
        }

        return this.counters[name];
    }

    /**
     * Return all available counter names.
     */
    getAvailableCounters() {
        return Object.keys(this.counters);
    }
}