import { ArrayRenderer } from "../renderers/array-renderer.js";
import { LinkedListRenderer } from "../renderers/linked-list-renderer.js";
import { BinaryTreeRenderer } from "../renderers/binary-tree-renderer.js";
import { GraphRenderer } from "../renderers/graph-renderer.js";

const RENDERER_TYPES = Object.freeze({
    array: ArrayRenderer,
    "linked-list": LinkedListRenderer,
    tree: BinaryTreeRenderer,
    "binary-tree": BinaryTreeRenderer,
    graph: GraphRenderer
});

export class VisualizationManager {
    constructor(container) {
        if (!container) {
            throw new Error("VisualizationManager requires a container.");
        }

        this.container = container;
        this.visualizations = new Map();
        this.primaryId = null;
        this.root = null;
    }

    async configure(definitions) {
        if (!Array.isArray(definitions) || definitions.length === 0) {
            throw new TypeError("At least one visualization is required.");
        }

        if (definitions.length > 6) {
            throw new RangeError("A maximum of six visualizations is supported.");
        }

        const ids = new Set();

        // Validate every renderer before destroying the current workspace.
        const prepared = definitions.map((definition, index) => {
            if (!definition || typeof definition !== "object") {
                throw new TypeError(`Invalid visualization definition ${index}.`);
            }

            if (typeof definition.id !== "string" || !definition.id.trim()) {
                throw new TypeError(`Visualization ${index} requires an ID.`);
            }

            if (ids.has(definition.id)) {
                throw new Error(`Duplicate visualization ID: ${definition.id}`);
            }

            ids.add(definition.id);

            const Renderer = RENDERER_TYPES[definition.visualizerId];

            if (!Renderer) {
                throw new Error(
                    `Unsupported visualizer: ${definition.visualizerId}`
                );
            }

            if (
                !definition.initialState ||
                typeof definition.initialState !== "object"
            ) {
                throw new TypeError(
                    `Visualization ${definition.id} requires an initial state.`
                );
            }

            return { definition, Renderer };
        });

        this.destroyRenderers();

        const root = document.createElement("div");
        root.className = "visualization-manager-grid";
        root.dataset.count = String(prepared.length);

        this.container.replaceChildren(root);
        this.root = root;

        this.primaryId = prepared[0].definition.id;

        const initialRenders = [];

        try {
            for (const { definition, Renderer } of prepared) {
                const panel = document.createElement("section");
                panel.className = "visualization-manager-panel";
                panel.dataset.visualizationId = definition.id;

                const host = document.createElement("div");
                host.className = "visualization-manager-canvas";

                panel.appendChild(host);
                root.appendChild(panel);

                const renderer = new Renderer(host);

                this.visualizations.set(definition.id, {
                    id: definition.id,
                    structure: definition.structure,
                    visualizerId: definition.visualizerId,
                    renderer,
                    host
                });

                initialRenders.push(
                    renderer.render(
                        structuredClone(definition.initialState),
                        {},
                        { animate: false }
                    )
                );
            }

            await Promise.all(initialRenders);

            return this.getConfiguredVisualizations();
        } catch (error) {
            this.destroy();
            throw error;
        }
    }

    getRenderer(id = this.primaryId) {
        const entry = this.visualizations.get(id);

        if (!entry) {
            throw new Error(`Visualization '${id}' is not configured.`);
        }

        return entry.renderer;
    }

    async render(id, state, metadata = {}, options = {}) {
        const renderer = this.getRenderer(id);
        return renderer.render(state, metadata, options);
    }

    async renderPrimary(state, metadata = {}, options = {}) {
        return this.render(this.primaryId, state, metadata, options);
    }

    async renderStep(step, options = {}) {
        if (!step || typeof step !== "object") {
            throw new TypeError("An execution step is required.");
        }

        // Multi-structure execution format.
        if (step.visualStates && typeof step.visualStates === "object") {
            const renders = Object.entries(step.visualStates).map(
                ([id, visualState]) => {
                    if (!this.visualizations.has(id)) {
                        throw new Error(
                            `Execution step references unconfigured visualization '${id}'.`
                        );
                    }

                    return this.render(
                        id,
                        visualState.state,
                        visualState.metadata || {},
                        options
                    );
                }
            );

            await Promise.all(renders);
            return;
        }

        // Existing single-array execution format.
        if (step.state) {
            return this.renderPrimary(
                step.state,
                step.metadata || {},
                options
            );
        }

        throw new Error("Execution step has no renderable visual state.");
    }

    getConfiguredVisualizations() {
        return [...this.visualizations.values()].map(entry => ({
            id: entry.id,
            structure: entry.structure,
            visualizerId: entry.visualizerId
        }));
    }

    destroyRenderers() {
        this.visualizations.forEach(entry => {
            entry.renderer.destroy();
        });

        this.visualizations.clear();
    }

    destroy() {
        this.destroyRenderers();

        if (this.root) {
            this.root.remove();
            this.root = null;
        }

        this.primaryId = null;
    }
}
