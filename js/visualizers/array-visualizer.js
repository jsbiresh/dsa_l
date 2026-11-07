/**
 * ArrayVisualizer
 *
 * Renders array states and animates element movement.
 *
 * Features:
 * - Stable element identities.
 * - Persistent DOM elements.
 * - FLIP-based physical movement.
 * - Comparison, swap and sorted highlighting.
 *
 * This class does not execute algorithms.
 */

export class ArrayVisualizer {

    constructor(container) {

        if (!container) {
            throw new Error(
                "ArrayVisualizer requires a valid container element."
            );
        }

        this.container = container;

        this.currentState = null;

        this.wrapper = null;
        this.indexRow = null;
        this.elementRow = null;
        this.statusRow = null;
        this.emptyMessage = null;

        this.cells = new Map();

        this.animationDuration = 320;

        this.initializeStructure();
    }


    /**
     * Create the permanent visualization structure.
     */
    initializeStructure() {

        this.wrapper = document.createElement("div");
        this.wrapper.className = "array-visualizer";

        const title = document.createElement("div");

        title.className = "array-visualizer-title";
        title.textContent = "ARRAY";

        this.indexRow = document.createElement("div");
        this.indexRow.className = "array-index-row";

        this.elementRow = document.createElement("div");
        this.elementRow.className = "array-element-row";

        this.statusRow = document.createElement("div");
        this.statusRow.className = "array-status-row";

        this.emptyMessage = document.createElement("p");

        this.emptyMessage.className = "array-empty-message";
        this.emptyMessage.textContent = "The array is empty.";
        this.emptyMessage.hidden = true;

        this.wrapper.appendChild(title);
        this.wrapper.appendChild(this.indexRow);
        this.wrapper.appendChild(this.elementRow);
        this.wrapper.appendChild(this.statusRow);
        this.wrapper.appendChild(this.emptyMessage);

        this.container.replaceChildren(this.wrapper);
    }


    /**
     * Normalize array elements.
     *
     * Supports both:
     * - Primitive values: [5, 3, 8]
     * - Identity objects: [{ id, value }, ...]
     */
    normalizeElement(item, index) {

        if (
            item !== null &&
            typeof item === "object" &&
            Object.prototype.hasOwnProperty.call(item, "value")
        ) {

            return {
                id: String(item.id ?? "element-" + index),
                value: item.value
            };

        }

        return {
            id: "element-" + index,
            value: item
        };
    }


    /**
     * Render an array execution state.
     *
     * @param {object} state
     * @param {object} metadata
     * @param {object} options
     */
    async render(state, metadata = {}, options = {}) {

        if (!state || !Array.isArray(state.array)) {
            throw new TypeError(
                "Visualizer requires a state containing an array."
            );
        }

        const array = state.array.map((item, index) =>
            this.normalizeElement(item, index)
        );

        const animate = options.animate === true;

        // FIRST: Capture existing element positions.
        const previousPositions = new Map();

        if (animate) {

            this.cells.forEach((cell, id) => {

                previousPositions.set(
                    id,
                    cell.getBoundingClientRect()
                );

            });

        }

        this.currentState = structuredClone(state);

        this.emptyMessage.hidden = array.length !== 0;

        const sortedIndexes = new Set(
            metadata.sortedIndexes ?? []
        );

        const comparingIndexes = new Set(
            metadata.comparingIndexes ?? []
        );

        const swappingIndexes = new Set(
            metadata.swappingIndexes ?? []
        );

        const activeIndexes = new Set(
            metadata.activeIndexes ?? []
        );

        const newCells = new Map();

        const indexFragment = document.createDocumentFragment();
        const elementFragment = document.createDocumentFragment();
        const statusFragment = document.createDocumentFragment();

        array.forEach((item, index) => {

            const key = item.id;

            // Reuse the existing cell when possible.
            let cell = this.cells.get(key);

            if (!cell) {

                cell = document.createElement("div");

                cell.className = "array-cell";

            }

            cell.textContent = String(item.value);

            cell.dataset.index = index;
            cell.dataset.elementId = key;

            // Reset previous visual states.
            cell.classList.remove(
                "array-cell--sorted",
                "array-cell--comparing",
                "array-cell--swapping",
                "array-cell--active"
            );

            // Apply current visual states.
            if (sortedIndexes.has(index)) {
                cell.classList.add("array-cell--sorted");
            }

            if (comparingIndexes.has(index)) {
                cell.classList.add("array-cell--comparing");
            }

            if (swappingIndexes.has(index)) {
                cell.classList.add("array-cell--swapping");
            }

            if (activeIndexes.has(index)) {
                cell.classList.add("array-cell--active");
            }

            newCells.set(key, cell);

            // Index label.
            const indexLabel = document.createElement("div");

            indexLabel.className = "array-index";
            indexLabel.textContent = index;

            indexFragment.appendChild(indexLabel);

            // Reuse and reposition the actual cell.
            elementFragment.appendChild(cell);

            // Status label.
            const status = document.createElement("div");

            status.className = "array-element-status";

            if (sortedIndexes.has(index)) {
                status.textContent = "Sorted";
            } else if (comparingIndexes.has(index)) {
                status.textContent = "Comparing";
            } else if (swappingIndexes.has(index)) {
                status.textContent = "Swapping";
            } else if (activeIndexes.has(index)) {
                status.textContent = "Active";
            }

            statusFragment.appendChild(status);

        });


        // LAST: Update the DOM with the new element order.
        this.indexRow.replaceChildren(indexFragment);

        this.elementRow.replaceChildren(elementFragment);

        this.statusRow.replaceChildren(statusFragment);

        this.cells = newCells;


        // PLAY: Animate elements into their new positions.
        if (animate) {

            await this.animateMovement(previousPositions);

        }

        return this.currentState;
    }


    /**
     * FLIP animation.
     *
     * First: Previous position.
     * Last: New position.
     * Invert: Calculate movement distance.
     * Play: Animate to the new position.
     */
    async animateMovement(previousPositions) {

        const animations = [];

        this.cells.forEach((cell, key) => {

            const previous = previousPositions.get(key);

            if (!previous) {
                return;
            }

            const current = cell.getBoundingClientRect();

            const deltaX = previous.left - current.left;

            const deltaY = previous.top - current.top;

            if (
                Math.abs(deltaX) < 0.5 &&
                Math.abs(deltaY) < 0.5
            ) {
                return;
            }

            const animation = cell.animate(
                [
                    {
                        transform:
                            "translate(" + deltaX + "px, " +
                            deltaY + "px)"
                    },
                    {
                        transform: "translate(0, 0)"
                    }
                ],
                {
                    duration: this.animationDuration,
                    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                    fill: "none"
                }
            );

            animations.push(animation.finished);

        });

        await Promise.all(animations);
    }


    /**
     * Clear the visualization.
     */
    clear() {

        this.currentState = null;

        this.cells.clear();

        this.indexRow.replaceChildren();

        this.elementRow.replaceChildren();

        this.statusRow.replaceChildren();

        this.emptyMessage.hidden = false;
    }


    /**
     * Return current state.
     */
    getCurrentState() {

        return this.currentState;
    }


    /**
     * Return rendered cells.
     */
    getCells() {

        return Array.from(this.cells.values());
    }


    /**
     * Configure animation duration.
     */
    setAnimationDuration(duration) {

        if (
            typeof duration !== "number" ||
            !Number.isFinite(duration) ||
            duration < 0
        ) {
            throw new RangeError(
                "Animation duration must be a non-negative number."
            );
        }

        this.animationDuration = duration;
    }

}