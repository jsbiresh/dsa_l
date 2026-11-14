/**
 * DSA_L — Universal Animation Event Contract
 *
 * Animation events describe how a visualizer should transition.
 * Execution snapshots remain the authoritative resulting state.
 *
 * Events are ordered and scoped to a configured visualization.
 */

export const ANIMATION_EVENT_CONFIG = Object.freeze({
    schemaVersion: 1,
    maximumEventsPerStep: 32,
    maximumDurationMs: 10000,
    maximumEntityIds: 100
});

const EVENT_TYPE_PATTERN =
    /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/;

const ANIMATION_KIND_PATTERN =
    /^[a-z][a-z0-9-]*$/;

const ALLOWED_EASINGS = new Set([
    "linear",
    "ease-in",
    "ease-out",
    "ease-in-out",
    "step-end"
]);

function requireObject(value, label) {
    if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        throw new TypeError(`${label} must be an object.`);
    }
}

function requireString(value, label, maximumLength = 120) {
    if (
        typeof value !== "string" ||
        !value.trim() ||
        value.length > maximumLength
    ) {
        throw new TypeError(`${label} must be a non-empty string.`);
    }

    return value;
}

function cloneValue(value) {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

/**
 * Validate and normalize an ordered list of animation events.
 *
 * @param {Array} rawEvents
 * @param {Set<string>} visualizationIds
 * @param {number} stepIndex
 * @returns {Array}
 */
export function validateAnimationEvents(
    rawEvents,
    visualizationIds,
    stepIndex = 0
) {
    if (!Array.isArray(rawEvents)) {
        throw new TypeError("Animation events must be an array.");
    }

    if (
        rawEvents.length >
        ANIMATION_EVENT_CONFIG.maximumEventsPerStep
    ) {
        throw new RangeError(
            `A step cannot contain more than ${ANIMATION_EVENT_CONFIG.maximumEventsPerStep} animation events.`
        );
    }

    const validVisualizationIds =
        visualizationIds instanceof Set
            ? visualizationIds
            : new Set(visualizationIds);

    const seenIds = new Set();

    return rawEvents.map((event, index) => {
        requireObject(event, `Animation event ${index}`);

        const schemaVersion = event.schemaVersion ?? 1;

        if (schemaVersion !== ANIMATION_EVENT_CONFIG.schemaVersion) {
            throw new Error(
                `Animation event ${index} has an unsupported schema version.`
            );
        }

        const id = event.id ?? `step-${stepIndex}-event-${index}`;

        requireString(id, `Animation event ${index} ID`, 160);

        if (seenIds.has(id)) {
            throw new Error(`Duplicate animation event ID: ${id}`);
        }

        seenIds.add(id);

        const type = requireString(
            event.type,
            `Animation event ${index} type`,
            100
        );

        if (!EVENT_TYPE_PATTERN.test(type)) {
            throw new Error(
                `Invalid animation event type '${type}'. Use a namespaced type such as 'array.swap'.`
            );
        }

        requireObject(event.target, `Animation event ${index} target`);

        const visualizationId = requireString(
            event.target.visualizationId,
            `Animation event ${index} target visualization ID`
        );

        if (!validVisualizationIds.has(visualizationId)) {
            throw new Error(
                `Animation event ${index} targets unknown visualization '${visualizationId}'.`
            );
        }

        const entityIds = event.target.entityIds ?? [];

        if (
            !Array.isArray(entityIds) ||
            entityIds.length >
                ANIMATION_EVENT_CONFIG.maximumEntityIds
        ) {
            throw new TypeError(
                `Animation event ${index} target entityIds must be an array of at most ${ANIMATION_EVENT_CONFIG.maximumEntityIds} items.`
            );
        }

        const normalizedEntityIds = entityIds.map((entityId, entityIndex) =>
            requireString(
                entityId,
                `Animation event ${index} entity ID ${entityIndex}`,
                160
            )
        );

        if (new Set(normalizedEntityIds).size !== normalizedEntityIds.length) {
            throw new Error(
                `Animation event ${index} contains duplicate entity IDs.`
            );
        }

        const rawAnimation = event.animation ?? {};
        requireObject(
            rawAnimation,
            `Animation event ${index} animation`
        );

        const kind = rawAnimation.kind ?? "none";

        requireString(kind, `Animation event ${index} animation kind`, 48);

        if (!ANIMATION_KIND_PATTERN.test(kind)) {
            throw new Error(
                `Animation event ${index} has an invalid animation kind.`
            );
        }

        const durationMs =
            rawAnimation.durationMs ?? (kind === "none" ? 0 : 350);

        if (
            typeof durationMs !== "number" ||
            !Number.isFinite(durationMs) ||
            durationMs < 0 ||
            durationMs > ANIMATION_EVENT_CONFIG.maximumDurationMs
        ) {
            throw new RangeError(
                `Animation event ${index} duration must be between 0 and ${ANIMATION_EVENT_CONFIG.maximumDurationMs} milliseconds.`
            );
        }

        const easing = rawAnimation.easing ?? "ease-in-out";

        if (!ALLOWED_EASINGS.has(easing)) {
            throw new Error(
                `Animation event ${index} has an unsupported easing value.`
            );
        }

        const payload = event.payload ?? {};
        requireObject(payload, `Animation event ${index} payload`);

        return {
            id,
            schemaVersion,
            type,
            target: {
                visualizationId,
                entityIds: normalizedEntityIds
            },
            animation: {
                kind,
                durationMs,
                easing
            },
            payload: cloneValue(payload)
        };
    });
}
