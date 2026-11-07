/**
 * ExecutionPlayer
 *
 * Controls playback and navigation through recorded
 * algorithm execution steps.
 *
 * Supports asynchronous animation callbacks.
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
        this.transitionPromise = null;

        this.baseInterval = 350;
    }


    /**
     * Register a step-change callback.
     *
     * The callback may return a Promise.
     */
    setOnStepChange(callback) {

        if (
            callback !== null &&
            typeof callback !== "function"
        ) {
            throw new TypeError(
                "Callback must be a function or null."
            );
        }

        this.onStepChange = callback;
    }


    /**
     * Notify the application about a changed step.
     */
    async notifyStepChange(step) {

        if (step && this.onStepChange) {

            await this.onStepChange(step);

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

        this.timerId = setTimeout(async () => {

            this.timerId = null;

            if (!this.isPlaying) {
                return;
            }

            try {

                await this.advanceOneStep();

            } catch (error) {

                this.pause();

                console.error(
                    "Execution playback failed:",
                    error
                );

                return;
            }

            if (!this.isPlaying) {
                return;
            }

            if (this.engine.hasNext()) {

                this.scheduleNextStep();

            } else {

                this.pause();

            }

        }, interval);
    }


    /**
     * Advance one step and wait for its animation.
     */
    async advanceOneStep() {

        const step = this.engine.nextStep();

        if (!step) {
            return null;
        }

        this.transitionPromise = this.notifyStepChange(step);

        try {

            await this.transitionPromise;

        } finally {

            this.transitionPromise = null;

        }

        return step;
    }


    /**
     * Move forward one step manually.
     */
    async next() {

        this.pause();

        // Wait for an existing animation to finish.
        if (this.transitionPromise) {

            await this.transitionPromise;

        }

        return await this.advanceOneStep();
    }


    /**
     * Move backward one step manually.
     */
    async previous() {

        this.pause();

        if (this.transitionPromise) {

            await this.transitionPromise;

        }

        const step = this.engine.previousStep();

        return await this.notifyStepChange(step);
    }


    /**
     * Restart execution.
     */
    async restart() {

        this.pause();

        if (this.transitionPromise) {

            await this.transitionPromise;

        }

        const step = this.engine.restart();

        return await this.notifyStepChange(step);
    }


    /**
     * Jump to a specific step.
     */
    async jumpTo(index) {

        this.pause();

        if (this.transitionPromise) {

            await this.transitionPromise;

        }

        const step = this.engine.jumpToStep(index);

        return await this.notifyStepChange(step);
    }


    /**
     * Change playback speed.
     */
    setSpeed(speed) {

        if (
            typeof speed !== "number" ||
            !Number.isFinite(speed) ||
            speed <= 0
        ) {
            throw new RangeError(
                "Playback speed must be greater than zero."
            );
        }

        this.speed = speed;

        if (this.isPlaying) {

            this.pause();

            this.play();

        }

        return this.speed;
    }


    getSpeed() {

        return this.speed;

    }


    getIsPlaying() {

        return this.isPlaying;

    }


    getCurrentStep() {

        return this.engine.getCurrentStep();

    }


    /**
     * Return execution progress.
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
     * Return execution position.
     */
    getPosition() {

        return {
            currentStep: this.engine.getCurrentIndex(),
            totalSteps: this.engine.getTotalSteps(),
            progress: this.getProgress()
        };

    }


    /**
     * Clean up player resources.
     */
    destroy() {

        this.pause();

        this.onStepChange = null;

        this.engine = null;

    }

}