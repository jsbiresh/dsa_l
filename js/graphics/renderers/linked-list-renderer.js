import { KonvaEngine } from "../engine/konva-engine.js";

export class LinkedListRenderer {
    constructor(container) {
        if (!container) {
            throw new Error("LinkedListRenderer requires a container.");
        }

        this.engine = new KonvaEngine(container);
        this.nodes = new Map();
        this.currentState = null;
    }

    async render(state, metadata = {}, options = {}) {
        if (!state || !Array.isArray(state.nodes)) {
            throw new TypeError(
                "Linked List state requires a nodes array."
            );
        }

        const Konva = this.engine.Konva;
        const animate = options.animate === true;
        const nodes = state.nodes.map((node, index) => {
            if (!node || typeof node !== "object") {
                throw new TypeError(`Invalid linked-list node at ${index}.`);
            }

            return {
                id: String(node.id ?? `node-${index}`),
                value: node.value,
                nextId:
                    node.nextId !== undefined
                        ? node.nextId
                        : node.next !== undefined
                            ? node.next
                            : (state.nodes[index + 1]?.id ?? null)
            };
        });

        const ids = new Set();

        for (const node of nodes) {
            if (ids.has(node.id)) {
                throw new Error(`Duplicate linked-list node ID: ${node.id}`);
            }
            ids.add(node.id);
        }

        const nodeWidth = 112;
        const nodeHeight = 66;
        const gap = 65;
        const padding = 55;

        const viewportWidth =
            this.engine.container.clientWidth || 800;

        const totalWidth =
            padding * 2 +
            nodes.length * nodeWidth +
            Math.max(0, nodes.length - 1) * gap;

        const stageWidth = Math.max(viewportWidth, totalWidth, 360);
        const stageHeight = Math.max(
            320,
            this.engine.container.clientHeight || 360
        );

        const startX = Math.max(
            padding,
            (stageWidth - totalWidth) / 2 + padding
        );

        const top = stageHeight / 2 - nodeHeight / 2;

        this.engine.setSize(stageWidth, stageHeight);
        this.engine.backgroundLayer.destroyChildren();
        this.engine.overlayLayer.destroyChildren();

        const positions = new Map();

        nodes.forEach((node, index) => {
            positions.set(node.id, {
                x: startX + index * (nodeWidth + gap),
                y: top
            });
        });

        // Draw links behind the nodes.
        nodes.forEach((node, index) => {
            const nextId = node.nextId === undefined
                ? (nodes[index + 1]?.id ?? null)
                : node.nextId;

            if (!nextId) return;

            const source = positions.get(node.id);
            const target = positions.get(String(nextId));

            if (!target) return;

            this.engine.backgroundLayer.add(
                new Konva.Arrow({
                    points: [
                        source.x + nodeWidth,
                        source.y + nodeHeight / 2,
                        target.x,
                        target.y + nodeHeight / 2
                    ],
                    pointerLength: 11,
                    pointerWidth: 11,
                    stroke: "#94a3b8",
                    fill: "#94a3b8",
                    strokeWidth: 2.5
                })
            );
        });

        const activeIds = new Set(
            metadata.activeNodeIds || []
        );

        const comparingIds = new Set(
            metadata.comparingNodeIds || []
        );

        const updatedIds = new Set(
            metadata.updatedNodeIds || []
        );

        const nextNodes = new Map();
        const animations = [];

        nodes.forEach((node, index) => {
            const position = positions.get(node.id);

            let record = this.nodes.get(node.id);
            const isNew = !record;

            if (!record) {
                const group = new Konva.Group();

                const rect = new Konva.Rect({
                    width: nodeWidth,
                    height: nodeHeight,
                    cornerRadius: 9,
                    fill: "#202b3a",
                    stroke: "#64748b",
                    strokeWidth: 1.5
                });

                const separator = new Konva.Line({
                    points: [76, 0, 76, nodeHeight],
                    stroke: "#64748b",
                    strokeWidth: 1
                });

                const valueText = new Konva.Text({
                    x: 0,
                    y: 0,
                    width: 76,
                    height: nodeHeight,
                    align: "center",
                    verticalAlign: "middle",
                    fontSize: 20,
                    fontStyle: "bold",
                    fill: "#f8fafc",
                    text: ""
                });

                const pointerText = new Konva.Text({
                    x: 76,
                    y: 0,
                    width: 36,
                    height: nodeHeight,
                    align: "center",
                    verticalAlign: "middle",
                    fontSize: 14,
                    fill: "#94a3b8",
                    text: "●"
                });

                group.add(rect);
                group.add(separator);
                group.add(valueText);
                group.add(pointerText);

                record = {
                    group,
                    rect,
                    valueText,
                    pointerText
                };

                group.position({
                    x: position.x,
                    y: position.y
                });

                if (animate) group.opacity(0);

                this.engine.contentLayer.add(group);
            }

            let fill = "#202b3a";
            let stroke = "#64748b";

            if (updatedIds.has(node.id)) {
                fill = "#49306f";
                stroke = "#a78bfa";
            } else if (comparingIds.has(node.id)) {
                fill = "#61431a";
                stroke = "#f59e0b";
            } else if (activeIds.has(node.id)) {
                fill = "#1e456d";
                stroke = "#38bdf8";
            }

            record.rect.setAttrs({ fill, stroke });
            record.valueText.text(String(node.value));
            record.pointerText.text(node.nextId ? "●" : "NULL");
            record.pointerText.fontSize(node.nextId ? 14 : 9);

            nextNodes.set(node.id, record);

            if (animate) {
                animations.push(
                    this.engine.animate(
                        record.group,
                        {
                            x: position.x,
                            y: position.y,
                            opacity: 1
                        },
                        isNew ? 0.2 : 0.3
                    )
                );
            } else {
                record.group.position(position);
                record.group.opacity(1);
            }
        });

        // Remove nodes no longer in the snapshot.
        this.nodes.forEach((record, id) => {
            if (!nextNodes.has(id)) {
                record.group.destroy();
            }
        });

        this.nodes = nextNodes;

        // Draw the head pointer.
        const headId = state.headId ?? nodes[0]?.id ?? null;
        const headPosition = positions.get(String(headId));

        const labels = new Konva.Group();

        labels.add(
            new Konva.Text({
                x: 24,
                y: 18,
                text: "LINKED LIST",
                fontSize: 12,
                fontStyle: "bold",
                fill: "#94a3b8",
                letterSpacing: 1
            })
        );

        if (headPosition) {
            labels.add(
                new Konva.Text({
                    x: headPosition.x,
                    y: top - 57,
                    width: nodeWidth,
                    align: "center",
                    text: "HEAD ↓",
                    fontSize: 13,
                    fontStyle: "bold",
                    fill: "#38bdf8"
                })
            );
        }

        if (nodes.length === 0) {
            labels.add(
                new Konva.Text({
                    x: 20,
                    y: stageHeight / 2 - 15,
                    width: stageWidth - 40,
                    text: "EMPTY LINKED LIST",
                    fontSize: 16,
                    align: "center",
                    fill: "#94a3b8"
                })
            );
        }

        this.engine.overlayLayer.add(labels);

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
