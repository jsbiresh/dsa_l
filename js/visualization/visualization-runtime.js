/**
 * DSA_L — Multi-Structure Visualization Runtime
 *
 * Converts a validated AI plan into deterministic execution steps.
 * AI-generated JavaScript is displayed, never executed.
 */

import { validateVisualizationPlan } from "./visualization-plan.js";

export function createExecutionTrace(rawPlan) {
    const plan = validateVisualizationPlan(rawPlan);

    const primaryVisualization = plan.visualizations[0];

    const initialVisualStates = Object.fromEntries(
        plan.visualizations.map(visualization => [
            visualization.id,
            {
                state: structuredClone(visualization.initialState),
                metadata: {}
            }
        ])
    );

    const steps = plan.steps.map((step, index) => {
        const visualStates = Object.fromEntries(
            plan.visualizations.map(visualization => {
                const visualState = step.visualStates[visualization.id];

                if (!visualState) {
                    throw new Error(
                        `Execution step ${index} is missing visualization '${visualization.id}'.`
                    );
                }

                return [
                    visualization.id,
                    {
                        operation: visualState.operation,
                        state: structuredClone(visualState.state),
                        metadata: structuredClone(visualState.metadata || {})
                    }
                ];
            })
        );

        return {
            action: step.action,

            animationEvents: structuredClone(
                step.animationEvents ?? []
            ),

            // Compatibility alias for existing inspectors and array traces.
            state: structuredClone(
                visualStates[primaryVisualization.id].state
            ),

            // Full snapshot for all configured renderers.
            visualStates,

            codeLine: step.codeLine,
            variables: structuredClone(step.variables),
            explanation: step.explanation,
            metrics: structuredClone(step.metrics),
            metadata: structuredClone(
                visualStates[primaryVisualization.id].metadata
            )
        };
    });

    return {
        algorithmName: plan.selectedApproach.pattern,
        pattern: plan.selectedApproach.pattern,
        applicability: plan.selectedApproach.applicability,

        initialState: structuredClone(
            primaryVisualization.initialState
        ),

        initialVisualStates,

        visualizations: structuredClone(plan.visualizations),

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
