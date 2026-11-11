import { KonvaEngine } from "../engine/konva-engine.js";

export class BinaryTreeRenderer {
    constructor(container) {
        this.engine = new KonvaEngine(container);
        this.nodes = new Map();
        this.currentState = null;
    }

    calculateLayout(state) {
        const nodes = state.nodes || [];

        if (nodes.length > 200) {
            throw new RangeError("Binary Tree renderer supports at most 200 nodes.");
        }

        const byId = new Map();

        nodes.forEach((node, index) => {
            if (!node || typeof node !== "object" || node.id == null) {
                throw new TypeError(`Invalid tree node at index ${index}.`);
            }

            const id = String(node.id);

            if (byId.has(id)) {
                throw new Error(`Duplicate tree node ID: ${id}`);
            }

            byId.set(id, {
                ...node,
                id,
                leftId: node.leftId == null ? null : String(node.leftId),
                rightId: node.rightId == null ? null : String(node.rightId)
            });
        });

        const parentCount = new Map(nodes.map(node => [String(node.id), 0]));

        for (const node of byId.values()) {
            for (const childId of [node.leftId, node.rightId]) {
                if (childId === null) continue;

                if (!byId.has(childId)) {
                    throw new Error(`Tree node ${node.id} references missing child ${childId}.`);
                }

                const count = parentCount.get(childId) + 1;

                if (count > 1) {
                    throw new Error(`Tree node ${childId} has more than one parent.`);
                }

                parentCount.set(childId, count);
            }
        }

        if (nodes.length === 0) {
            return { nodes: [], positions: new Map(), rootId: null, maxDepth: 0 };
        }

        const roots = [...parentCount.entries()]
            .filter(([, count]) => count === 0)
            .map(([id]) => id);

        const rootId = state.rootId == null
            ? roots[0]
            : String(state.rootId);

        if (!byId.has(rootId) || parentCount.get(rootId) !== 0) {
            throw new Error("Invalid Binary Tree root.");
        }

        if (roots.length !== 1) {
            throw new Error("A Binary Tree must have exactly one root.");
        }

        const positions = new Map();
        const visiting = new Set();
        const visited = new Set();
        let cursor = 0;
        let maxDepth = 0;

        // In-order placement gives each node a distinct horizontal slot.
        const place = (id, depth) => {
            if (id === null) return;

            if (visiting.has(id)) {
                throw new Error("Cycle detected in Binary Tree.");
            }

            if (visited.has(id)) {
                throw new Error(`Node ${id} was reached more than once.`);
            }

            visiting.add(id);

            const node = byId.get(id);

            place(node.leftId, depth + 1);

            positions.set(id, {
                slot: cursor++,
                depth
            });

            maxDepth = Math.max(maxDepth, depth);

            place(node.rightId, depth + 1);

            visiting.delete(id);
            visited.add(id);
        };

        place(rootId, 0);

        if (visited.size !== nodes.length) {
            throw new Error("Binary Tree contains disconnected nodes.");
        }

        return {
            nodes: [...byId.values()],
            positions,
            rootId,
            maxDepth
        };
    }

    async render(state, metadata = {}, options = {}) {
        if (!state || !Array.isArray(state.nodes)) {
            throw new TypeError("Binary Tree state requires a nodes array.");
        }

        const Konva = this.engine.Konva;
        const animate = options.animate === true;
        const layout = this.calculateLayout(state);

        const radius = 27;
        const horizontalGap = 100;
        const verticalGap = 110;
        const padding = 65;
        const top = 95;

        const viewportWidth = this.engine.container.clientWidth || 800;
        const viewportHeight = this.engine.container.clientHeight || 360;

        const stageWidth = Math.max(
            viewportWidth,
            padding * 2 + Math.max(0, layout.nodes.length - 1) * horizontalGap
        );

        const stageHeight = Math.max(
            viewportHeight,
            top + layout.maxDepth * verticalGap + radius * 2 + 65
        );

        this.engine.setSize(stageWidth, stageHeight);
        this.engine.backgroundLayer.destroyChildren();
        this.engine.overlayLayer.destroyChildren();

        const positions = new Map();

        layout.nodes.forEach(node => {
            const slot = layout.positions.get(node.id);

            positions.set(node.id, {
                x: padding + slot.slot * horizontalGap,
                y: top + slot.depth * verticalGap
            });
        });

        // Draw parent-child edges before drawing the circles.
        layout.nodes.forEach(node => {
            const source = positions.get(node.id);

            for (const childId of [node.leftId, node.rightId]) {
                if (childId === null) continue;

                const target = positions.get(childId);

                this.engine.backgroundLayer.add(
                    new Konva.Line({
                        points: [
                            source.x, source.y,
                            target.x, target.y
                        ],
                        stroke: "#64748b",
                        strokeWidth: 2.5,
                        lineCap: "round"
                    })
                );
            }
        });

        const active = new Set(metadata.activeNodeIds || []);
        const comparing = new Set(metadata.comparingNodeIds || []);
        const visited = new Set(metadata.visitedNodeIds || []);

        const nextNodes = new Map();
        const animations = [];

        layout.nodes.forEach(node => {
            const position = positions.get(node.id);

            let record = this.nodes.get(node.id);
            const isNew = !record;

            if (!record) {
                const group = new Konva.Group();

                const circle = new Konva.Circle({
                    radius,
                    fill: "#202b3a",
                    stroke: "#64748b",
                    strokeWidth: 2
                });

                const label = new Konva.Text({
                    x: -radius,
                    y: -radius,
                    width: radius * 2,
                    height: radius * 2,
                    text: "",
                    fontSize: 15,
                    fontStyle: "bold",
                    fill: "#f8fafc",
                    align: "center",
                    verticalAlign: "middle"
                });

                group.add(circle);
                group.add(label);

                record = { group, circle, label };

                group.position(position);

                if (animate) group.opacity(0);

                this.engine.contentLayer.add(group);
            }

            let fill = "#202b3a";
            let stroke = "#64748b";

            if (comparing.has(node.id)) {
                fill = "#61431a";
                stroke = "#f59e0b";
            } else if (active.has(node.id)) {
                fill = "#1e456d";
                stroke = "#38bdf8";
            } else if (visited.has(node.id)) {
                fill = "#163d2b";
                stroke = "#22c55e";
            }

            record.circle.setAttrs({ fill, stroke });
            record.label.text(String(node.value));

            nextNodes.set(node.id, record);

            if (animate) {
                animations.push(
                    this.engine.animate(
                        record.group,
                        { ...position, opacity: 1 },
                        isNew ? 0.2 : 0.3
                    )
                );
            } else {
                record.group.position(position);
                record.group.opacity(1);
            }
        });

        this.nodes.forEach((record, id) => {
            if (!nextNodes.has(id)) record.group.destroy();
        });

        this.nodes = nextNodes;

        this.engine.overlayLayer.add(
            new Konva.Text({
                x: 24,
                y: 20,
                text: `BINARY TREE  ·  ${layout.nodes.length} NODES`,
                fontSize: 12,
                fontStyle: "bold",
                fill: "#94a3b8",
                letterSpacing: 1
            })
        );

        this.currentState = structuredClone(state);

        this.engine.backgroundLayer.batchDraw();
        this.engine.contentLayer.batchDraw();
        this.engine.overlayLayer.batchDraw();

        await Promise.all(animations);

        return this.currentState;
    }

    destroy() {
        this.engine.destroy();
        this.nodes.clear();
        this.currentState = null;
    }
}
