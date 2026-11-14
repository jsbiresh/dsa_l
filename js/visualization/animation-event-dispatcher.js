/**
 * DSA_L — Animation Event Dispatcher
 *
 * Dispatches events to renderers that explicitly support them.
 * Unsupported events fall back to snapshot rendering.
 *
 * The final snapshot is always reconciled after a successful
 * event animation. Snapshots remain the source of truth.
 */

function cloneValue(value) {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

/**
 * @param {object} renderer
 * @param {object} configuration
 * @param {Array} configuration.events
 * @param {object} configuration.state
 * @param {object} configuration.metadata
 * @param {object} configuration.options
 */
export async function dispatchAnimationEvents(
    renderer,
    {
        events = [],
        state,
        metadata = {},
        options = {}
    } = {}
) {
    if (!renderer || typeof renderer.render !== "function") {
        throw new TypeError(
            "Animation dispatcher requires a renderer with render()."
        );
    }

    if (!Array.isArray(events)) {
        throw new TypeError("Animation events must be an array.");
    }

    let animationError = null;

    const supportsEventDispatch =
        events.length > 0 &&
        typeof renderer.canAnimateEvents === "function" &&
        typeof renderer.animateEvents === "function";

    if (supportsEventDispatch) {
        try {
            const supported = await renderer.canAnimateEvents(
                cloneValue(events)
            );

            if (supported === true) {
                const handled = await renderer.animateEvents(
                    cloneValue(events),
                    {
                        state: cloneValue(state),
                        metadata: cloneValue(metadata),
                        options: { ...options }
                    }
                );

                if (handled === true) {
                    // Reconcile the renderer with the authoritative snapshot.
                    await renderer.render(
                        state,
                        metadata,
                        {
                            ...options,
                            animate: false
                        }
                    );

                    return {
                        mode: "events",
                        handled: true,
                        error: null
                    };
                }
            }
        } catch (error) {
            // The snapshot fallback must still restore a valid final state.
            animationError = error;
        }
    }

    await renderer.render(state, metadata, options);

    return {
        mode: "snapshot",
        handled: false,
        error: animationError
    };
}
