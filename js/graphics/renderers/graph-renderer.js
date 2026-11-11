import { KonvaEngine } from "../engine/konva-engine.js";

export class GraphRenderer {
    constructor(container) {
        this.engine = new KonvaEngine(container);
        this.vertices = new Map();
        this.currentState = null;
    }

    calculatePositions(vertices, width, height) {
        const suppliedCoordinates = vertices.every(vertex =>
            Number.isFinite(vertex.x) &&
            Number.isFinite(vertex.y)
        );

        if (suppliedCoordinates) {
            return new Map(
                vertices.map(vertex => [
                    String(vertex.id),
                    { x: vertex.x, y: vertex.y }
                ])
            );
        }

        const positions = new Map();
        const centerX = width / 2;
        const centerY = height / 2;

        const radius = Math.max(
            50,
            Math.min(width, height) / 2 - 85
        );

        vertices.forEach((vertex, index) => {
            const angle =
                (2 * Math.PI * index / Math.max(1, vertices.length)) -
                Math.PI / 2;

            positions.set(String(vertex.id), {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        });

        return positions;
    }

    async render(state, metadata = {}, options = {}) {
        if (
            !state ||
            !Array.isArray(state.vertices) ||
            !Array.isArray(state.edges)
        ) {
            throw new TypeError(
                "Graph state requires vertices and edges arrays."
            );
        }

        if (state.vertices.length > 200 || state.edges.length > 500) {
            throw new RangeError("Graph exceeds the supported rendering limit.");
        }

        const Konva = this.engine.Konva;
        const animate = options.animate === true;
        const vertexIds = new Set();

        state.vertices.forEach((vertex, index) => {
            if (!vertex || vertex.id == null) {
                throw new TypeError(`Invalid graph vertex at index ${index}.`);
            }

            const id = String(vertex.id);

            if (vertexIds.has(id)) {
                throw new Error(`Duplicate graph vertex ID: ${id}`);
            }

            vertexIds.add(id);
        });

        state.edges.forEach((edge, index) => {
            if (
                !edge ||
                !vertexIds.has(String(edge.from)) ||
                !vertexIds.has(String(edge.to))
            ) {
                throw new Error(`Graph edge ${index} references a missing vertex.`);
            }
        });

        const viewportWidth = this.engine.container.clientWidth || 800;
        const viewportHeight = this.engine.container.clientHeight || 420;

        const stageWidth = Math.max(600, viewportWidth);
        const stageHeight = Math.max(380, viewportHeight);

        this.engine.setSize(stageWidth, stageHeight);

        const positions = this.calculatePositions(
            state.vertices,
            stageWidth,
            stageHeight
        );

        this.engine.backgroundLayer.destroyChildren();
        this.engine.overlayLayer.destroyChildren();

        const activeEdges = new Set(metadata.activeEdgeIds || []);
        const traversedEdges = new Set(metadata.traversedEdgeIds || []);

        // Draw graph connections first.
        state.edges.forEach((edge, index) => {
            const from = positions.get(String(edge.from));
            const to = positions.get(String(edge.to));
            const directed = edge.directed === true;

            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const distance = Math.hypot(dx, dy) || 1;

            const unitX = dx / distance;
            const unitY = dy / distance;
            const radius = 28;

            const points = [
                from.x + unitX * radius,
                from.y + unitY * radius,
                to.x - unitX * radius,
                to.y - unitY * radius
            ];

            const edgeId = String(
                edge.id ?? `${edge.from}->${edge.to}`
            );

            let stroke = "#64748b";
            let strokeWidth = 2;

            if (activeEdges.has(edgeId)) {
                stroke = "#f59e0b";
                strokeWidth = 4;
            } else if (traversedEdges.has(edgeId)) {
                stroke = "#22c55e";
                strokeWidth = 3;
            }

            const connection = directed
                ? new Konva.Arrow({
                    points,
                    pointerLength: 10,
                    pointerWidth: 10,
                    fill: stroke
                })
                : new Konva.Line({ points });

            connection.setAttrs({
                stroke,
                strokeWidth,
                lineCap: "round"
            });

            this.engine.backgroundLayer.add(connection);

            if (edge.weight !== undefined) {
                this.engine.backgroundLayer.add(
                    new Konva.Text({
                        x: (from.x + to.x) / 2 - 20,
                        y: (from.y + to.y) / 2 - 20,
                        width: 40,
                        text: String(edge.weight),
                        fontSize: 12,
                        align: "center",
                        fill: "#e2e8f0"
                    })
                );
            }
        });

        const active = new Set(metadata.activeVertexIds || []);
        const visited = new Set(metadata.visitedVertexIds || []);
        const frontier = new Set(metadata.frontierVertexIds || []);

        const nextVertices = new Map();
        const animations = [];

        state.vertices.forEach(vertex => {
            const id = String(vertex.id);
            const position = positions.get(id);

            let record = this.vertices.get(id);
            const isNew = !record;

            if (!record) {
                const group = new Konva.Group();

                const circle = new Konva.Circle({
                    radius: 28,
                    fill: "#202b3a",
                    stroke: "#64748b",
                    strokeWidth: 2
                });

                const label = new Konva.Text({
                    x: -39,
                    y: -20,
                    width: 78,
                    height: 40,
                    text: "",
                    fontSize: 13,
                    fontStyle: "bold",
                    fill: "#f8fafc",
                    align: "center",
                    verticalAlign: "middle",
                    wrap: "none",
                    ellipsis: true
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

            if (active.has(id)) {
                fill = "#1e456d";
                stroke = "#38bdf8";
            } else if (frontier.has(id)) {
                fill = "#61431a";
                stroke = "#f59e0b";
            } else if (visited.has(id)) {
                fill = "#163d2b";
                stroke = "#22c55e";
            }

            record.circle.setAttrs({ fill, stroke });
            record.label.text(
                String(vertex.label ?? vertex.value ?? vertex.id)
            );

            nextVertices.set(id, record);

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

        this.vertices.forEach((record, id) => {
            if (!nextVertices.has(id)) record.group.destroy();
        });

        this.vertices = nextVertices;

        this.engine.overlayLayer.add(
            new Konva.Text({
                x: 24,
                y: 20,
                text: `GRAPH  ·  ${state.vertices.length} VERTICES  ·  ${state.edges.length} EDGES`,
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
        this.vertices.clear();
        this.currentState = null;
    }
}
