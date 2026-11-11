import { KonvaEngine } from "../engine/konva-engine.js";

export class ArrayRenderer {
    constructor(container) {
        this.engine = new KonvaEngine(container);

        this.nodes = new Map();
        this.primitiveCounter = 0;

        this.currentState = null;
        this.currentMetadata = {};

        this.drawEmptyState();
    }

    drawEmptyState() {
        const Konva = this.engine.Konva;
        const width = this.engine.stage.width();
        const height = this.engine.stage.height();

        const message = new Konva.Text({
            x: 20,
            y: height / 2 - 25,
            width: width - 40,
            text: "Your visual laboratory is ready.\nLoad an algorithm to begin.",
            fontSize: 17,
            lineHeight: 1.8,
            align: "center",
            fill: "#94a3b8"
        });

        this.engine.overlayLayer.add(message);
        this.engine.overlayLayer.batchDraw();
    }

    normalizeItems(array) {
        const previousByValue = new Map();

        this.nodes.forEach((record, id) => {
            const bucket = previousByValue.get(record.value) || [];
            bucket.push(id);
            previousByValue.set(record.value, bucket);
        });

        return array.map((item, index) => {
            const isObject =
                item !== null &&
                typeof item === "object" &&
                Object.prototype.hasOwnProperty.call(item, "value");

            const value = isObject ? item.value : item;

            if (isObject && item.id !== undefined) {
                return {
                    id: String(item.id),
                    value
                };
            }

            const bucket = previousByValue.get(value);

            const id = bucket?.length
                ? bucket.shift()
                : `array-item-${this.primitiveCounter++}`;

            return { id, value };
        });
    }

    getStatus(index, metadata) {
        const sorted = new Set(metadata.sortedIndexes || []);
        const comparing = new Set(metadata.comparingIndexes || []);
        const swapping = new Set(metadata.swappingIndexes || []);
        const active = new Set(metadata.activeIndexes || []);

        if (sorted.has(index)) {
            return "SORTED";
        }

        if (swapping.has(index)) {
            return "SWAPPING";
        }

        if (comparing.has(index)) {
            return "COMPARING";
        }

        if (active.has(index)) {
            return "ACTIVE";
        }

        return "";
    }

    getColors(status) {
        const colors = {
            SORTED: {
                fill: "#163d2b",
                stroke: "#22c55e"
            },

            COMPARING: {
                fill: "#61431a",
                stroke: "#f59e0b"
            },

            SWAPPING: {
                fill: "#49306f",
                stroke: "#a78bfa"
            },

            ACTIVE: {
                fill: "#1e456d",
                stroke: "#38bdf8"
            },

            DEFAULT: {
                fill: "#202b3a",
                stroke: "#64748b"
            }
        };

        return colors[status] || colors.DEFAULT;
    }

    createElement(Konva, value, index, cellWidth, cellHeight) {
        const group = new Konva.Group();

        const rect = new Konva.Rect({
            x: 0,
            y: 0,
            width: cellWidth,
            height: cellHeight,
            cornerRadius: 10,
            fill: "#202b3a",
            stroke: "#64748b",
            strokeWidth: 1.5
        });

        const valueText = new Konva.Text({
            x: 0,
            y: 0,
            width: cellWidth,
            height: cellHeight,
            text: String(value),
            fontSize: Math.min(23, cellWidth * 0.35),
            fontStyle: "bold",
            fontFamily: "Arial",
            fill: "#f8fafc",
            align: "center",
            verticalAlign: "middle"
        });

        const indexText = new Konva.Text({
            x: 0,
            y: -29,
            width: cellWidth,
            text: String(index),
            fontSize: 13,
            fontFamily: "Arial",
            fill: "#94a3b8",
            align: "center"
        });

        const statusText = new Konva.Text({
            x: -10,
            y: cellHeight + 10,
            width: cellWidth + 20,
            text: "",
            fontSize: 10,
            fontFamily: "Arial",
            fill: "#94a3b8",
            align: "center"
        });

        group.add(rect);
        group.add(valueText);
        group.add(indexText);
        group.add(statusText);

        return {
            group,
            rect,
            valueText,
            indexText,
            statusText,
            value
        };
    }

    async render(state, metadata = {}, options = {}) {
        if (!state || !Array.isArray(state.array)) {
            throw new TypeError(
                "ArrayRenderer requires state.array."
            );
        }

        const Konva = this.engine.Konva;
        const animate = options.animate === true;

        const items = this.normalizeItems(state.array);
        const count = items.length;

        const padding = 48;
        const gap = count > 18 ? 10 : 14;
        const preferredCellWidth = 58;
        const cellHeight = 64;

        const viewportWidth =
            this.engine.container.clientWidth || 800;

        const requiredWidth =
            padding * 2 +
            count * preferredCellWidth +
            Math.max(0, count - 1) * gap;

        const stageWidth = Math.max(
            320,
            viewportWidth,
            requiredWidth
        );

        const stageHeight = Math.max(
            320,
            this.engine.container.clientHeight || 360
        );

        const cellWidth = count
            ? Math.min(
                78,
                (stageWidth - padding * 2 - gap * (count - 1)) / count
            )
            : 58;

        const totalWidth =
            count * cellWidth + Math.max(0, count - 1) * gap;

        const startX = Math.max(
            padding,
            (stageWidth - totalWidth) / 2
        );

        const top = stageHeight / 2 - cellHeight / 2;

        this.engine.setSize(stageWidth, stageHeight);

        const nextNodes = new Map();
        const animations = [];

        items.forEach((item, index) => {
            const x = startX + index * (cellWidth + gap);

            let record = this.nodes.get(item.id);
            const isNew = !record;

            if (!record) {
                record = this.createElement(
                    Konva,
                    item.value,
                    index,
                    cellWidth,
                    cellHeight
                );

                record.group.position({ x, y: top });

                if (animate) {
                    record.group.opacity(0);
                }

                this.engine.contentLayer.add(record.group);
            }

            record.value = item.value;

            record.rect.setAttrs({
                width: cellWidth,
                height: cellHeight,
                ...this.getColors(
                    this.getStatus(index, metadata)
                )
            });

            record.valueText.setAttrs({
                width: cellWidth,
                height: cellHeight,
                text: String(item.value),
                fontSize: Math.min(23, cellWidth * 0.35)
            });

            record.indexText.setAttrs({
                width: cellWidth,
                text: String(index)
            });

            const status = this.getStatus(index, metadata);

            record.statusText.setAttrs({
                x: -10,
                y: cellHeight + 10,
                width: cellWidth + 20,
                text: status,
                fill: this.getColors(status).stroke
            });

            nextNodes.set(item.id, record);

            if (animate && !isNew) {
                animations.push(
                    this.engine.animate(record.group, {
                        x,
                        y: top
                    })
                );
            } else if (animate && isNew) {
                animations.push(
                    this.engine.animate(
                        record.group,
                        { opacity: 1 },
                        0.18
                    )
                );
            } else {
                record.group.position({ x, y: top });
                record.group.opacity(1);
            }
        });

        // Remove elements that no longer exist.
        this.nodes.forEach((record, id) => {
            if (!nextNodes.has(id)) {
                record.group.destroy();
            }
        });

        this.nodes = nextNodes;

        // Redraw overlay labels.
        this.engine.overlayLayer.destroyChildren();

        this.engine.overlayLayer.add(
            new Konva.Text({
                x: 24,
                y: 18,
                text: `ARRAY  ·  ${count} ELEMENTS`,
                fontSize: 12,
                fontStyle: "bold",
                fontFamily: "Arial",
                fill: "#94a3b8",
                letterSpacing: 1
            })
        );

        if (count === 0) {
            this.engine.overlayLayer.add(
                new Konva.Text({
                    x: 20,
                    y: stageHeight / 2 - 15,
                    width: stageWidth - 40,
                    text: "The array is empty.",
                    fontSize: 16,
                    align: "center",
                    fill: "#94a3b8"
                })
            );
        }

        this.currentState = structuredClone(state);
        this.currentMetadata = structuredClone(metadata);

        this.engine.contentLayer.batchDraw();
        this.engine.overlayLayer.batchDraw();

        await Promise.all(animations);

        this.engine.contentLayer.batchDraw();

        return this.currentState;
    }

    destroy() {
        this.engine.destroy();
        this.nodes.clear();
        this.currentState = null;
    }
}
