/**
 * DSA_L — Visualization Runtime
 *
 * Converts a validated visualization plan into the
 * deterministic execution-trace format used by DSA_L.
 *
 * This module:
 * - Does not execute AI-generated JavaScript.
 * - Does not manipulate the DOM.
 * - Does not implement algorithms.
 * - Converts validated snapshots into execution steps.
 */

import {
    validateVisualizationPlan
} from "./visualization-plan.js";


/**
 * Convert a validated plan into an execution trace.
 *
 * Current runtime support:
 * - One Array visualization per execution plan.
 *
 * Additional visualization types will be added through
 * the visualizer registry as their implementations become ready.
 *
 * @param {object} rawPlan
 * @returns {object} Execution trace
 */
export function createExecutionTrace(rawPlan) {

    const plan = validateVisualizationPlan(rawPlan);

    if (plan.visualizations.length !== 1) {
        throw new Error(
            "The current runtime supports one visualization at a time. " +
            "Multi-structure execution will be enabled as additional " +
            "visualizers are implemented."
        );
    }

    const visualization = plan.visualizations[0];

    if (visualization.visualizerId !== "array") {
        throw new Error(
            `The ${visualization.visualizerId} visualizer is not supported by the current runtime.`
        );
    }

    const initialState = structuredClone(
        visualization.initialState
    );

    const steps = plan.steps.map((step, index) => {

        const visualState =
            step.visualStates[visualization.id];

        if (!visualState) {
            throw new Error(
                `Execution step ${index} is missing its visualization state.`
            );
        }

        return {

            action: step.action,

            state: structuredClone(
                visualState.state
            ),

            codeLine: step.codeLine,

            variables: structuredClone(
                step.variables
            ),

            explanation: step.explanation,

            metrics: structuredClone(
                step.metrics
            ),

            metadata: structuredClone(
                visualState.metadata
            )

        };

    });

    return {

        algorithmName: plan.selectedApproach.pattern,

        pattern: plan.selectedApproach.pattern,

        applicability: plan.selectedApproach.applicability,

        initialState,

        code: plan.code.source,

        steps,

        input: structuredClone(plan.input),

        complexity: structuredClone(plan.complexity),

        summary: {

            timeComplexity: plan.complexity.time,

            spaceComplexity: plan.complexity.space,

            totalSteps: steps.length

        }

    };

}
