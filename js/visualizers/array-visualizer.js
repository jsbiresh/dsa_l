/**
 * ArrayVisualizer
 *
 * Renders array states inside the visualization canvas.
 *
 * Responsibilities:
 * - Render array elements.
 * - Display indexes.
 * - Highlight comparisons and swaps.
 * - Highlight sorted elements.
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
    }

    /**
     * Render an array execution state.
     *
     * @param {object} state
     * @param {object} metadata
     */
    render(state, metadata = {}) {

        if (!state || !Array.isArray(state.array)) {
            throw new TypeError(
                "Visualizer requires a state containing an array."
            );
        }

        this.currentState = state;

        const array = state.array;

        const wrapper = document.createElement("div");
        wrapper.className = "array-visualizer";

        const indexRow = document.createElement("div");
        indexRow.className = "array-index-row";

        const elementRow = document.createElement("div");
        elementRow.className = "array-element-row";

        const statusRow = document.createElement("div");
        statusRow.className = "array-status-row";

        const title = document.createElement("div");
        title.className = "array-visualizer-title";
        title.textContent = "ARRAY";

        wrapper.appendChild(title);

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

        array.forEach((value, index) => {

            // Index label.
            const indexLabel = document.createElement("div");

            indexLabel.className = "array-index";
            indexLabel.textContent = index;

            indexRow.appendChild(indexLabel);

            // Array element.
            const cell = document.createElement("div");

            cell.className = "array-cell";
            cell.textContent = String(value);

            cell.dataset.index = index;

            // Apply visual states.
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

            elementRow.appendChild(cell);

            // Element status.
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
            } else {
                status.textContent = "";
            }

            statusRow.appendChild(status);
        });

        wrapper.appendChild(indexRow);
        wrapper.appendChild(elementRow);
        wrapper.appendChild(statusRow);

        // Empty array handling.
        if (array.length === 0) {

            const emptyMessage = document.createElement("p");

            emptyMessage.className = "array-empty-message";
            emptyMessage.textContent = "The array is empty.";

            wrapper.appendChild(emptyMessage);
        }

        // Replace the previous visualization.
        this.container.replaceChildren(wrapper);
    }

    /**
     * Clear the visualization canvas.
     */
    clear() {

        this.currentState = null;

        this.container.replaceChildren();
    }

    /**
     * Return the currently rendered state.
     */
    getCurrentState() {

        return this.currentState;
    }

    /**
     * Return the currently rendered array cells.
     */
    getCells() {

        return Array.from(
            this.container.querySelectorAll(".array-cell")
        );
    }
}