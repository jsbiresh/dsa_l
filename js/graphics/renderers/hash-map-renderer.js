
import { KonvaEngine } from "../engine/konva-engine.js";

import {
    buildHashBuckets,
    hashKey,
    validateHashMapState
} from "../models/hash-map-model.js";

/**
 * DSA_L — Hash Map Visualizer
 *
 * Displays:
 * - Fixed bucket array.
 * - Key-value entries.
 * - Separate chaining.
 * - Hash bucket assignment.
 * - Collision highlighting.
 * - Lookup, insertion, update and deletion states.
 */

export class HashMapRenderer {

    constructor(container) {
        this.engine = new KonvaEngine(container);

        this.entries = new Map();

        this.currentState = null;
        this.currentMetadata = {};

        this.drawInitialMessage();
    }

    drawInitialMessage() {
        const Konva = this.engine.Konva;

        const message = new Konva.Text({
            x: 20,
            y: 145,
            width: this.engine.stage.width() - 40,
            text: "Hash Map\nWaiting for entries...",
            fontSize: 17,
            lineHeight: 1.8,
            align: "center",
            fill: "#94a3b8"
        });

        this.engine.overlayLayer.add(message);
        this.engine.overlayLayer.batchDraw();
    }

    formatValue(value) {
        if (value === null) return "null";

        return String(value);
    }

    getEntryStatus(id, metadata) {
        const active = new Set(metadata.activeEntryIds || []);
        const comparing = new Set(metadata.comparingEntryIds || []);
        const inserted = new Set(metadata.insertedEntryIds || []);
        const updated = new Set(metadata.updatedEntryIds || []);
        const visited = new Set(metadata.visitedEntryIds || []);

        if (inserted.has(id)) return "INSERTED";
        if (updated.has(id)) return "UPDATED";
        if (active.has(id)) return "ACTIVE";
        if (comparing.has(id)) return "COMPARING";
        if (visited.has(id)) return "VISITED";

        return "NORMAL";
    }

    getEntryColors(status) {
        const colors = {
            NORMAL: {
                fill: "#202b3a",
                stroke: "#64748b"
            },

            ACTIVE: {
                fill: "#164e63",
                stroke: "#22d3ee"
            },

            COMPARING: {
                fill: "#61431a",
                stroke: "#f59e0b"
            },

            INSERTED: {
                fill: "#163d2b",
                stroke: "#22c55e"
            },

            UPDATED: {
                fill: "#49306f",
                stroke: "#a78bfa"
            },

            VISITED: {
                fill: "#263b57",
                stroke: "#60a5fa"
            }
        };

        return colors[status] || colors.NORMAL;
    }

    createEntry(Konva, entry) {
        const group = new Konva.Group();

        const rect = new Konva.Rect({
            width: 142,
            height: 46,
            cornerRadius: 8,
            fill: "#202b3a",
            stroke: "#64748b",
            strokeWidth: 1.5
        });

        const keyText = new Konva.Text({
            x: 8,
            y: 5,
            width: 126,
            height: 17,
            fontSize: 11,
            fontStyle: "bold",
            fontFamily: "monospace",
            fill: "#67e8f9",
            text: `Key: ${String(entry.key)}`,
            ellipsis: true
        });

        const valueText = new Konva.Text({
            x: 8,
            y: 25,
            width: 126,
            height: 15,
            fontSize: 10,
            fontFamily: "monospace",
            fill: "#e2e8f0",
            text: `Value: ${this.formatValue(entry.value)}`,
            ellipsis: true
        });

        group.add(rect);
        group.add(keyText);
        group.add(valueText);

        return {
            group,
            rect,
            keyText,
            valueText
        };
    }

    drawBucket(Konva, bucket, y, width, metadata) {
        const activeBucket =
            metadata.activeBucketIndex === bucket.index;

        const collisionBucket =
            metadata.collisionBucketIndex === bucket.index;

        const fill = activeBucket
            ? "#163d50"
            : collisionBucket
                ? "#49306f"
                : "#172333";

        const stroke = activeBucket
            ? "#22d3ee"
            : collisionBucket
                ? "#a78bfa"
                : "#334155";

        const row = new Konva.Rect({
            x: 18,
            y,
            width: width - 36,
            height: 54,
            cornerRadius: 8,
            fill,
            stroke,
            strokeWidth: activeBucket || collisionBucket ? 2 : 1
        });

        this.engine.backgroundLayer.add(row);

        const label = new Konva.Text({
            x: 30,
            y: y + 17,
            width: 105,
            text: `Bucket ${bucket.index}`,
            fontSize: 12,
            fontStyle: "bold",
            fill: "#cbd5e1"
        });

        this.engine.backgroundLayer.add(label);

        const count = new Konva.Text({
            x: width - 100,
            y: y + 18,
            width: 65,
            text: `${bucket.entries.length} item(s)`,
            fontSize: 10,
            fill: "#94a3b8",
            align: "right"
        });

        this.engine.backgroundLayer.add(count);

        return {
            activeBucket,
            collisionBucket
        };
    }

    async render(state, metadata = {}, options = {}) {
        const normalized = validateHashMapState(state);

        const buckets = buildHashBuckets(normalized);

        const Konva = this.engine.Konva;
        const animate = options.animate === true;

        const maximumChainLength = Math.max(
            0,
            ...buckets.map(bucket => bucket.entries.length)
        );

        const viewportWidth =
            this.engine.container.clientWidth || 800;

        const viewportHeight =
            this.engine.container.clientHeight || 380;

        const cardWidth = 142;
        const cardGap = 24;
        const firstCardX = 155;

        const requiredChainWidth =
            firstCardX +
            maximumChainLength * (cardWidth + cardGap) +
            30;

        const stageWidth = Math.max(
            600,
            viewportWidth,
            requiredChainWidth
        );

        const rowHeight = 64;
        const firstRowY = 70;

        const stageHeight = Math.max(
            320,
            firstRowY +
            normalized.capacity * rowHeight +
            30,
            viewportHeight
        );

        this.engine.setSize(stageWidth, stageHeight);

        this.engine.backgroundLayer.destroyChildren();
        this.engine.overlayLayer.destroyChildren();

        const title = new Konva.Text({
            x: 20,
            y: 12,
            width: stageWidth - 40,
            text: `HASH MAP · SEPARATE CHAINING · ${normalized.capacity} BUCKETS`,
            fontSize: 14,
            fontStyle: "bold",
            fill: "#f8fafc"
        });

        this.engine.overlayLayer.add(title);

        let hashExplanation =
            "Numeric keys: modulo capacity · String keys: polynomial hash";

        if (metadata.activeKey !== undefined) {
            const bucketIndex = hashKey(
                metadata.activeKey,
                normalized.capacity
            );

            hashExplanation =
                `hash(${String(metadata.activeKey)}) = ${bucketIndex}`;
        }

        if (metadata.lookupKey !== undefined) {
            hashExplanation +=
                ` · Lookup: ${String(metadata.lookupKey)}`;
        }

        const hashText = new Konva.Text({
            x: 20,
            y: 36,
            width: stageWidth - 40,
            text: hashExplanation,
            fontSize: 11,
            fill: "#67e8f9"
        });

        this.engine.overlayLayer.add(hashText);

        const requiredIds = new Set();
        const nextEntries = new Map();
        const animations = [];

        buckets.forEach(bucket => {
            const rowY =
                firstRowY + bucket.index * rowHeight;

            this.drawBucket(
                Konva,
                bucket,
                rowY,
                stageWidth,
                metadata
            );

            if (bucket.entries.length === 0) {
                const empty = new Konva.Text({
                    x: 155,
                    y: rowY + 19,
                    text: "EMPTY",
                    fontSize: 10,
                    fontStyle: "bold",
                    fill: "#64748b"
                });

                this.engine.backgroundLayer.add(empty);
            }

            bucket.entries.forEach((entry, chainIndex) => {
                const id = String(entry.id);

                requiredIds.add(id);

                const x =
                    firstCardX +
                    chainIndex * (cardWidth + cardGap);

                const y = rowY + 4;

                let record = this.entries.get(id);
                const isNew = !record;

                if (!record) {
                    record = this.createEntry(Konva, entry);

                    record.group.position({
                        x,
                        y: animate ? y + 8 : y
                    });

                    record.group.opacity(animate ? 0 : 1);

                    if (animate) {
                        record.group.scale({
                            x: 0.95,
                            y: 0.95
                        });
                    }

                    this.engine.contentLayer.add(record.group);
                }

                record.keyText.text(
                    `Key: ${String(entry.key)}`
                );

                record.valueText.text(
                    `Value: ${this.formatValue(entry.value)}`
                );

                const status = this.getEntryStatus(id, metadata);
                const colors = this.getEntryColors(status);

                record.rect.setAttrs({
                    fill: colors.fill,
                    stroke: colors.stroke,
                    strokeWidth: status === "NORMAL" ? 1.5 : 2.5
                });

                const target = {
                    x,
                    y,
                    opacity: 1,
                    scaleX: 1,
                    scaleY: 1
                };

                if (animate && isNew) {
                    animations.push(
                        this.engine.animate(
                            record.group,
                            target,
                            0.3
                        )
                    );
                } else if (animate) {
                    animations.push(
                        this.engine.animate(
                            record.group,
                            target,
                            0.25
                        )
                    );
                } else {
                    record.group.setAttrs(target);
                }

                nextEntries.set(id, record);
            });

            // Show arrows between chained entries.
            for (let index = 0; index < bucket.entries.length - 1; index++) {
                const x =
                    firstCardX +
                    index * (cardWidth + cardGap) +
                    cardWidth + 4;

                const arrow = new Konva.Arrow({
                    points: [
                        x,
                        rowY + 27,
                        x + cardGap - 8,
                        rowY + 27
                    ],
                    stroke: "#a78bfa",
                    fill: "#a78bfa",
                    pointerLength: 6,
                    pointerWidth: 6,
                    strokeWidth: 2
                });

                this.engine.backgroundLayer.add(arrow);
            }
        });

        // Remove entries that are no longer in the snapshot.
        this.entries.forEach((record, id) => {
            if (!requiredIds.has(id)) {
                record.group.destroy();
            }
        });

        this.entries = nextEntries;

        const metadataText = metadata.explanation
            ? String(metadata.explanation)
            : "";

        if (metadataText) {
            this.engine.overlayLayer.add(
                new Konva.Text({
                    x: 20,
                    y: stageHeight - 24,
                    width: stageWidth - 40,
                    text: metadataText,
                    fontSize: 11,
                    fill: "#cbd5e1"
                })
            );
        }

        this.currentState = structuredClone(normalized);
        this.currentMetadata = structuredClone(metadata);

        await Promise.all(animations);

        this.engine.backgroundLayer.batchDraw();
        this.engine.contentLayer.batchDraw();
        this.engine.overlayLayer.batchDraw();
    }

    destroy() {
        this.entries.clear();
        this.engine.destroy();
    }
}
