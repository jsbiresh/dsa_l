/* ============================================
   DSA_L — STATE RECORDER
   File: js/core/state-recorder.js

   Responsibility:
   Record and retrieve algorithm execution states.

   This module does not manipulate the DOM.
============================================ */


/* ============================================
   1. STATE CLONING
============================================ */

/**
 * Creates an independent copy of a state.
 *
 * structuredClone supports arrays, objects,
 * Maps, Sets and other structured data.
 *
 * JSON fallback supports our basic snapshots.
 */

function cloneState(value) {

    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));

}


/* ============================================
   2. STATE RECORDER CLASS
============================================ */

export class StateRecorder {

    constructor() {

        this.steps = [];

        this.currentIndex = -1;

        this.initialState = null;

    }


    /* ========================================
       RESET RECORDER
    ======================================== */

    reset(initialState, initialVisualStates = null) {

        this.steps = [];

        this.currentIndex = -1;

        this.initialState = cloneState(initialState);

        this.record({

            action: "INITIALIZE",

            state: initialState,

            visualStates: initialVisualStates,

            codeLine: null,

            variables: {},

            explanation: "Algorithm initialized.",

            metrics: {}

        });

    }


    /* ========================================
       RECORD EXECUTION STEP
    ======================================== */

    record(step) {

        if (!step || typeof step !== "object") {

            throw new TypeError(
                "Execution step must be an object."
            );

        }

        if (!("state" in step)) {

            throw new Error(
                "Every execution step must contain a state."
            );

        }


        // Remove any future history if recording
        // after moving backwards.

        if (this.currentIndex < this.steps.length - 1) {

            this.steps = this.steps.slice(
                0,
                this.currentIndex + 1
            );

        }


        const recordedStep = {

            id: this.steps.length,

            action: step.action ?? "OPERATION",

            state: cloneState(step.state),

            codeLine: step.codeLine ?? null,

            variables: cloneState(
                step.variables ?? {}
            ),

            explanation:
                step.explanation ?? "",

            metrics: cloneState(
                step.metrics ?? {}
            ),

            metadata: cloneState(
                step.metadata ?? {}
            ),

            visualStates: step.visualStates
                ? cloneState(step.visualStates)
                : null

        };


        this.steps.push(recordedStep);

        this.currentIndex = this.steps.length - 1;


        return this.getCurrentStep();

    }


    /* ========================================
       GET CURRENT STEP
    ======================================== */

    getCurrentStep() {

        if (this.currentIndex < 0) {
            return null;
        }

        return this.getStep(this.currentIndex);

    }


    /* ========================================
       GET STEP BY INDEX
    ======================================== */

    getStep(index) {

        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= this.steps.length
        ) {

            return null;

        }

        return cloneState(this.steps[index]);

    }


    /* ========================================
       MOVE TO NEXT STEP
    ======================================== */

    next() {

        if (this.currentIndex >= this.steps.length - 1) {

            return null;

        }

        this.currentIndex++;

        return this.getCurrentStep();

    }


    /* ========================================
       MOVE TO PREVIOUS STEP
    ======================================== */

    previous() {

        if (this.currentIndex <= 0) {

            return null;

        }

        this.currentIndex--;

        return this.getCurrentStep();

    }


    /* ========================================
       JUMP TO SPECIFIC STEP
    ======================================== */

    jumpTo(index) {

        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= this.steps.length
        ) {

            return null;

        }

        this.currentIndex = index;

        return this.getCurrentStep();

    }


    /* ========================================
       RESTART
    ======================================== */

    restart() {

        if (this.steps.length === 0) {

            return null;

        }

        this.currentIndex = 0;

        return this.getCurrentStep();

    }


    /* ========================================
       HISTORY INFORMATION
    ======================================== */

    getTotalSteps() {

        return this.steps.length;

    }


    getCurrentIndex() {

        return this.currentIndex;

    }


    hasNext() {

        return this.currentIndex < this.steps.length - 1;

    }


    hasPrevious() {

        return this.currentIndex > 0;

    }


    getAllSteps() {

        return cloneState(this.steps);

    }


    getInitialState() {

        return cloneState(this.initialState);

    }


    clear() {

        this.steps = [];

        this.currentIndex = -1;

        this.initialState = null;

    }

}