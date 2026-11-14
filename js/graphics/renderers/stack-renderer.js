import { KonvaEngine } from "../engine/konva-engine.js";
import { validateStackState } from "../models/stack-model.js";

const SUPPORTED_EVENTS = new Set([
    "stack.push",
    "stack.pop",
    "stack.peek",
    "stack.size",
    "stack.is-empty",
    "stack.is-full",
    "stack.overflow",
    "stack.underflow"
]);

export class StackRenderer {
    constructor(container) {
        this.engine = new KonvaEngine(container);
        this.nodes = new Map();
        this.currentState = null;
        this.currentMetadata = {};
        this.layout = null;

        this.drawEmptyState();
    }

    drawEmptyState() {
        const Konva = this.engine.Konva;
        const width = this.engine.stage.width();
        const height = this.engine.stage.height();

        this.engine.overlayLayer.add(
            new Konva.Text({
                x: 20,
                y: height / 2 - 24,
                width: width - 40,
                text: "STACK VISUALIZER\nLoad a Stack operation to begin.",
                fontSize: 16,
                lineHeight: 1.8,
                align: "center",
                fill: "#94a3b8"
            })
        );

        this.engine.overlayLayer.batchDraw();
    }

    calculateLayout(state) {
        const viewportWidth =
            this.engine.container.clientWidth || 700;

        const viewportHeight =
            this.engine.container.clientHeight || 360;

        const slotHeight = 48;
        const gap = 8;
        const blockWidth = Math.min(240, Math.max(150, viewportWidth * 0.42));
        const paddingTop = 82;
        const paddingBottom = 48;

        const requiredHeight =
            paddingTop +
            state.capacity * (slotHeight + gap) -
            gap +
            paddingBottom;

        const stageWidth = Math.max(320, viewportWidth);
        const stageHeight = Math.max(320, viewportHeight, requiredHeight);

        const x = (stageWidth - blockWidth) / 2;
        const bottomY = stageHeight - paddingBottom - slotHeight;

        return {
            stageWidth,
            stageHeight,
            slotHeight,
            gap,
            blockWidth,
            paddingTop,
            paddingBottom,
            x,
            bottomY
        };
    }

    getItemPosition(index) {
        const { bottomY, slotHeight, gap, x } = this.layout;

        return {
            x,
            y: bottomY - index * (slotHeight + gap)
        };
    }

    createItem(item) {
        const Konva = this.engine.Konva;
        const { slotHeight, blockWidth } = this.layout;

        const group = new Konva.Group();

        const rect = new Konva.Rect({
            x: 0,
            y: 0,
            width: blockWidth,
            height: slotHeight,
            cornerRadius: 9,
            fill: "#1e456d",
            stroke: "#38bdf8",
            strokeWidth: 1.8
        });

        const valueText = new Konva.Text({
            x: 10,
            y: 0,
            width: blockWidth - 20,
            height: slotHeight,
            text: String(item.value),
            fontSize: 19,
            fontStyle: "bold",
            fontFamily: "Arial",
            fill: "#f8fafc",
            align: "center",
            verticalAlign: "middle"
        });

        group.add(rect);
        group.add(valueText);

        return {
            id: item.id,
            value: item.value,
            group,
            rect,
            valueText
        };
    }

    drawSlots(state) {
        const Konva = this.engine.Konva;
        const layout = this.layout;

        this.engine.backgroundLayer.destroyChildren();

        for (let index = 0; index < state.capacity; index += 1) {
            const { x, y } = this.getItemPosition(index);

            this.engine.backgroundLayer.add(
                new Konva.Rect({
                    x,
                    y,
                    width: layout.blockWidth,
                    height: layout.slotHeight,
                    cornerRadius: 9,
                    fill: "#111827",
                    stroke: "#334155",
                    strokeWidth: 1.2,
                    dash: [5, 4]
                })
            );

            this.engine.backgroundLayer.add(
                new Konva.Text({
                    x: x - 35,
                    y: y + 14,
                    width: 25,
                    text: String(index),
                    fontSize: 12,
                    fontFamily: "Arial",
                    fill: "#64748b",
                    align: "right"
                })
            );
        }

        this.engine.backgroundLayer.batchDraw();
    }

    drawTopIndicator(state) {
        const Konva = this.engine.Konva;
        const layout = this.layout;

        if (state.topIndex === -1) {
            this.engine.overlayLayer.add(
                new Konva.Text({
                    x: layout.x + layout.blockWidth + 16,
                    y: layout.bottomY + 12,
                    text: "TOP → EMPTY",
                    fontSize: 12,
                    fontStyle: "bold",
                    fill: "#f59e0b"
                })
            );

            return;
        }

        const { y } = this.getItemPosition(state.topIndex);

        this.engine.overlayLayer.add(
            new Konva.Arrow({
                points: [
                    layout.x + layout.blockWidth + 48,
                    y + layout.slotHeight / 2,
                    layout.x + layout.blockWidth + 8,
                    y + layout.slotHeight / 2
                ],
                pointerLength: 9,
                pointerWidth: 9,
                fill: "#f59e0b",
                stroke: "#f59e0b",
                strokeWidth: 2.5
            })
        );

        this.engine.overlayLayer.add(
            new Konva.Text({
                x: layout.x + layout.blockWidth + 54,
                y: y + 15,
                text: "TOP",
                fontSize: 13,
                fontStyle: "bold",
                fill: "#f59e0b"
            })
        );
    }

    async render(state, metadata = {}, options = {}) {
        validateStackState(state);

        const Konva = this.engine.Konva;
        const animate = options.animate === true;

        this.layout = this.calculateLayout(state);

        this.engine.setSize(
            this.layout.stageWidth,
            this.layout.stageHeight
        );

        this.drawSlots(state);

        const nextNodes = new Map();
        const animations = [];

        state.items.forEach((item, index) => {
            let record = this.nodes.get(item.id);
            const isNew = !record;

            if (!record) {
                record = this.createItem(item);

                const position = this.getItemPosition(index);

                record.group.position(
                    animate
                        ? { x: position.x, y: position.y - 30 }
                        : position
                );

                record.group.opacity(animate ? 0 : 1);

                this.engine.contentLayer.add(record.group);
            }

            record.value = structuredClone(item.value);

            record.valueText.setAttrs({
                text: String(item.value),
                width: this.layout.blockWidth - 20,
                height: this.layout.slotHeight
            });

            record.rect.setAttrs({
                width: this.layout.blockWidth,
                height: this.layout.slotHeight,
                fill: metadata.activeItemId === item.id
                    ? "#61431a"
                    : "#1e456d",
                stroke: metadata.activeItemId === item.id
                    ? "#f59e0b"
                    : "#38bdf8"
            });

            const position = this.getItemPosition(index);

            if (animate && isNew) {
                animations.push(
                    this.engine.animate(
                        record.group,
                        {
                            x: position.x,
                            y: position.y,
                            opacity: 1
                        },
                        0.24
                    )
                );
            } else if (animate) {
                animations.push(
                    this.engine.animate(record.group, position)
                );
            } else {
                record.group.position(position);
                record.group.opacity(1);
            }

            nextNodes.set(item.id, record);
        });

        this.nodes.forEach((record, id) => {
            if (!nextNodes.has(id)) {
                record.group.destroy();
            }
        });

        this.nodes = nextNodes;

        this.engine.overlayLayer.destroyChildren();

        this.engine.overlayLayer.add(
            new Konva.Text({
                x: 24,
                y: 18,
                text: `STACK  ·  ${state.size}/${state.capacity}`,
                fontSize: 13,
                fontStyle: "bold",
                fontFamily: "Arial",
                fill: "#94a3b8",
                letterSpacing: 1
            })
        );

        this.engine.overlayLayer.add(
            new Konva.Text({
                x: 24,
                y: 40,
                text: `SIZE: ${state.size}     TOP INDEX: ${state.topIndex}`,
                fontSize: 11,
                fontFamily: "Arial",
                fill: "#64748b"
            })
        );

        this.drawTopIndicator(state);

        if (state.size === 0) {
            this.engine.overlayLayer.add(
                new Konva.Text({
                    x: 20,
                    y: this.layout.bottomY - 34,
                    width: this.layout.stageWidth - 40,
                    text: "Stack is empty",
                    fontSize: 14,
                    align: "center",
                    fill: "#64748b"
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

    canAnimateEvents(events) {
        return Array.isArray(events) &&
            events.length > 0 &&
            events.every(event => SUPPORTED_EVENTS.has(event.type));
    }

    async animateEvents(events, { options = {} } = {}) {
        if (!this.canAnimateEvents(events) || !this.layout) {
            return false;
        }

        for (const event of events) {
            const durationMs = Math.max(
                0,
                Math.min(
                    10000,
                    Number(event.animation?.durationMs ?? 350)
                )
            );

            const duration = durationMs / 1000;
            const itemId =
                event.payload?.itemId ||
                event.target?.entityIds?.[0];

            if (event.type === "stack.push") {
                if (!itemId || this.nodes.has(itemId)) {
                    return false;
                }

                const item = {
                    id: itemId,
                    value: event.payload.value
                };

                const record = this.createItem(item);
                const index = event.payload.newTopIndex;

                if (!Number.isInteger(index) || index < 0) {
                    return false;
                }

                const position = this.getItemPosition(index);

                record.group.position({
                    x: position.x,
                    y: position.y - this.layout.slotHeight
                });
                record.group.opacity(0);

                this.engine.contentLayer.add(record.group);
                this.nodes.set(itemId, record);

                await this.engine.animate(
                    record.group,
                    {
                        x: position.x,
                        y: position.y,
                        opacity: 1
                    },
                    duration
                );
            } else if (event.type === "stack.pop") {
                const record = this.nodes.get(itemId);

                if (!record) {
                    return false;
                }

                await this.engine.animate(
                    record.group,
                    {
                        y: record.group.y() - this.layout.slotHeight,
                        opacity: 0
                    },
                    duration
                );

                record.group.destroy();
                this.nodes.delete(itemId);
            } else {
                const record = itemId
                    ? this.nodes.get(itemId)
                    : null;

                if (record) {
                    await this.engine.animate(
                        record.rect,
                        { strokeWidth: 4 },
                        Math.min(duration, 0.2)
                    );

                    await this.engine.animate(
                        record.rect,
                        { strokeWidth: 1.8 },
                        Math.min(duration, 0.2)
                    );
                }
            }
        }

        this.engine.contentLayer.batchDraw();
        return true;
    }

    destroy() {
        this.engine.destroy();
        this.nodes.clear();
        this.currentState = null;
        this.currentMetadata = {};
        this.layout = null;
    }
}
