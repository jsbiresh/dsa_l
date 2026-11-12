/**
 * ExecutionController
 *
 * Provides a unified interface for managing algorithm execution.
 *
 * Coordinates:
 * - ExecutionEngine
 * - ExecutionPlayer
 *
 * Keeps application UI code independent of internal execution details.
 */

import { ExecutionEngine } from "./engine.js";
import { ExecutionPlayer } from "./execution-player.js";

export class ExecutionController {

    constructor(onStepChange = null) {

        this.engine = new ExecutionEngine();

        this.player = new ExecutionPlayer(
            this.engine,
            onStepChange
        );

        this.isInitialized = false;
    }

    /**
     * Initialize a new execution.
     */
    initialize(algorithmName, initialState, initialVisualStates = null) {

        this.pause();

        const initialStep = this.engine.initialize(
            algorithmName,
            initialState,
            initialVisualStates
        );

        this.isInitialized = true;

        return initialStep;
    }

    /**
     * Register a new execution step.
     */
    recordStep(step) {

        this.ensureInitialized();

        return this.engine.recordStep(step);
    }

    /**
     * Start playback.
     */
    play() {

        this.ensureInitialized();

        this.player.play();
    }

    /**
     * Pause playback.
     */
    pause() {

        this.player.pause();
    }

    /**
     * Move forward one step.
     */
    next() {

        this.ensureInitialized();

        return this.player.next();
    }

    /**
     * Move backward one step.
     */
    previous() {

        this.ensureInitialized();

        return this.player.previous();
    }

    /**
     * Restart execution.
     */
    restart() {

        this.ensureInitialized();

        return this.player.restart();
    }

    /**
     * Jump to a particular execution step.
     */
    jumpTo(index) {

        this.ensureInitialized();

        return this.player.jumpTo(index);
    }

    /**
     * Change playback speed.
     */
    setSpeed(speed) {

        return this.player.setSpeed(speed);
    }

    /**
     * Return current playback speed.
     */
    getSpeed() {

        return this.player.getSpeed();
    }

    /**
     * Return current playback status.
     */
    getIsPlaying() {

        return this.player.getIsPlaying();
    }

    /**
     * Return current execution state.
     */
    getCurrentStep() {

        this.ensureInitialized();

        return this.engine.getCurrentStep();
    }

    /**
     * Return execution position and progress.
     */
    getPosition() {

        this.ensureInitialized();

        return this.player.getPosition();
    }

    /**
     * Return current execution metrics.
     *
     * These are cumulative metrics from the latest recorded step.
     */
    getMetrics() {

        this.ensureInitialized();

        return this.engine.getCurrentStep()?.metrics ?? {};
    }

    /**
     * Return the complete execution history.
     */
    getHistory() {

        this.ensureInitialized();

        return this.engine.getAllSteps();
    }

    /**
     * Check whether another execution step exists.
     */
    hasNext() {

        this.ensureInitialized();

        return this.engine.hasNext();
    }

    /**
     * Check whether a previous execution step exists.
     */
    hasPrevious() {

        this.ensureInitialized();

        return this.engine.hasPrevious();
    }

    /**
     * Register a callback for execution changes.
     */
    setOnStepChange(callback) {

        this.player.setOnStepChange(callback);
    }

    /**
     * Validate controller initialization.
     */
    ensureInitialized() {

        if (!this.isInitialized) {

            throw new Error(
                "Execution controller has not been initialized."
            );
        }
    }

    /**
     * Clear the current execution.
     */
    clear() {

        this.player.pause();

        this.engine.clear();

        this.isInitialized = false;
    }

    /**
     * Destroy the controller and release its resources.
     */
    destroy() {

        this.player.destroy();

        this.engine.clear();

        this.isInitialized = false;
    }
}