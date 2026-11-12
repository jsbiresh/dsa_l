/**
 * ExecutionEngine
 *
 * Coordinates algorithm execution, state recording,
 * and operation counting.
 */

import { StateRecorder } from "./state-recorder.js";
import { ComplexityCounter } from "./complexity-counter.js";

export class ExecutionEngine {

    constructor() {
        this.recorder = new StateRecorder();
        this.counter = new ComplexityCounter();

        this.isInitialized = false;
        this.isExecuting = false;

        this.algorithmName = null;
    }

    /**
     * Initialize a new algorithm execution.
     *
     * @param {string} algorithmName
     * @param {object} initialState
     */
    initialize(algorithmName, initialState, initialVisualStates = null) {

        if (typeof algorithmName !== "string" || !algorithmName.trim()) {
            throw new TypeError("Algorithm name must be a non-empty string.");
        }

        if (!initialState || typeof initialState !== "object") {
            throw new TypeError("Initial state must be an object.");
        }

        this.algorithmName = algorithmName;

        this.counter.reset();
        this.recorder.reset(initialState, initialVisualStates);

        this.isInitialized = true;
        this.isExecuting = false;

        return this.getCurrentStep();
    }

    /**
     * Record an algorithm execution step.
     *
     * @param {object} step
     */
    recordStep(step) {

        this.ensureInitialized();

        if (!step || typeof step !== "object") {
            throw new TypeError("Execution step must be an object.");
        }

        const metrics = step.metrics ?? {};

        // Update operation counters.
        this.counter.add(metrics);

        // Record the current execution state.
        const recordedStep = this.recorder.record({
            ...step,
            metrics: this.counter.getSnapshot()
        });

        this.isExecuting = true;

        return recordedStep;
    }

    /**
     * Return the current recorded execution step.
     */
    getCurrentStep() {
        return this.recorder.getCurrentStep();
    }

    /**
     * Move to the next recorded step.
     */
    nextStep() {
        this.ensureInitialized();

        return this.recorder.next();
    }

    /**
     * Move to the previous recorded step.
     */
    previousStep() {
        this.ensureInitialized();

        return this.recorder.previous();
    }

    /**
     * Return to the initial execution state.
     */
    restart() {
        this.ensureInitialized();

        this.isExecuting = false;

        return this.recorder.restart();
    }

    /**
     * Jump to a particular execution step.
     */
    jumpToStep(index) {
        this.ensureInitialized();

        return this.recorder.jumpTo(index);
    }

    /**
     * Return execution metrics.
     */
    getMetrics() {
        return this.counter.getSnapshot();
    }

    /**
     * Return the total number of recorded steps.
     */
    getTotalSteps() {
        return this.recorder.getTotalSteps();
    }

    /**
     * Return the current step index.
     */
    getCurrentIndex() {
        return this.recorder.getCurrentIndex();
    }

    /**
     * Return all recorded execution steps.
     */
    getAllSteps() {
        return this.recorder.getAllSteps();
    }

    /**
     * Return the algorithm name.
     */
    getAlgorithmName() {
        return this.algorithmName;
    }

    /**
     * Check whether another step exists.
     */
    hasNext() {
        return this.recorder.hasNext();
    }

    /**
     * Check whether a previous step exists.
     */
    hasPrevious() {
        return this.recorder.hasPrevious();
    }

    /**
     * Validate initialization before execution operations.
     */
    ensureInitialized() {

        if (!this.isInitialized) {
            throw new Error(
                "Execution engine has not been initialized."
            );
        }
    }

    /**
     * Clear the current execution completely.
     */
    clear() {

        this.recorder.clear();
        this.counter.reset();

        this.algorithmName = null;

        this.isInitialized = false;
        this.isExecuting = false;
    }
}