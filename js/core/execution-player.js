/**
 * ExecutionPlayer
 *
 * Controls playback and navigation through recorded
 * algorithm execution steps.
 *
 * This class does not execute algorithms.
 * It navigates execution history managed by ExecutionEngine.
 */

export class ExecutionPlayer {

    constructor(engine, onStepChange = null) {

        if (!engine) {
            throw new TypeError("An execution engine is required.");
        }

        this.engine = engine;
        this.onStepChange = onStepChange;

        this.isPlaying = false;
        this.speed = 1;

        this.timerId = null;

        this.baseInterval = 1000;
    }

    /**
     * Register or replace the step-change callback.
     */
    setOnStepChange(callback) {

        if (callback !== null && typeof callback !== "function") {
            throw new TypeError("Callback must be a function or null.");
        }

        this.onStepChange = callback;
    }

    /**
     * Notify the application that the current step changed.
     */
    notifyStepChange(step) {

        if (step && this.onStepChange) {
            this.onStepChange(step);
        }

        return step;
    }

    /**
     * Start automatic playback.
     */
    play() {

        if (this.isPlaying) {
            return;
        }

        if (!this.engine.hasNext()) {
            return;
        }

        this.isPlaying = true;

        this.scheduleNextStep();
    }

    /**
     * Pause automatic playback.
     */
    pause() {

        this.isPlaying = false;

        if (this.timerId !== null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    /**
     * Schedule the next execution step.
     */
    scheduleNextStep() {

        if (!this.isPlaying) {
            return;
        }

        const interval = this.baseInterval / this.speed;

        this.timerId = setTimeout(() => {

            this.timerId = null;

            if (!this.isPlaying) {
                return;
            }

            const step = this.engine.nextStep();

            if (!step) {
                this.pause();
                return;
            }

            this.notifyStepChange(step);

            if (this.engine.hasNext()) {
                this.scheduleNextStep();
            } else {
                this.pause();
            }

        }, interval);
    }

    /**
     * Move forward by one execution step.
     */
    next() {

        this.pause();

        const step = this.engine.nextStep();

        return this.notifyStepChange(step);
    }

    /**
     * Move backward by one execution step.
     */
    previous() {

        this.pause();

        const step = this.engine.previousStep();

        return this.notifyStepChange(step);
    }

    /**
     * Restart execution playback.
     */
    restart() {

        this.pause();

        const step = this.engine.restart();

        return this.notifyStepChange(step);
    }

    /**
     * Jump to a specific execution step.
     */
    jumpTo(index) {

        this.pause();

        const step = this.engine.jumpToStep(index);

        return this.notifyStepChange(step);
    }

    /**
     * Change playback speed.
     *
     * Speed must be greater than zero.
     */
    setSpeed(speed) {

        if (
            typeof speed !== "number" ||
            !Number.isFinite(speed) ||
            speed <= 0
        ) {
            throw new RangeError("Playback speed must be greater than zero.");
        }

        this.speed = speed;

        // Restart the timer using the new speed.
        if (this.isPlaying) {
            this.pause();
            this.play();
        }

        return this.speed;
    }

    /**
     * Return current playback speed.
     */
    getSpeed() {
        return this.speed;
    }

    /**
     * Return playback status.
     */
    getIsPlaying() {
        return this.isPlaying;
    }

    /**
     * Return the current execution step.
     */
    getCurrentStep() {
        return this.engine.getCurrentStep();
    }

    /**
     * Return current execution progress.
     */
    getProgress() {

        const totalSteps = this.engine.getTotalSteps();

        if (totalSteps <= 1) {
            return 0;
        }

        const currentIndex = this.engine.getCurrentIndex();

        return (currentIndex / (totalSteps - 1)) * 100;
    }

    /**
     * Return current execution position.
     */
    getPosition() {
        return {
            currentStep: this.engine.getCurrentIndex(),
            totalSteps: this.engine.getTotalSteps(),
            progress: this.getProgress()
        };
    }

    /**
     * Clean up timers and callbacks.
     */
    destroy() {

        this.pause();

        this.onStepChange = null;
        this.engine = null;
    }
}