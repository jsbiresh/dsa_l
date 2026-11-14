import test from "node:test";
import assert from "node:assert/strict";

import { analyzeDSARequest } from "../js/ai/problem-analyzer.js";
import { generateRuleBasedRecommendations } from "../js/intelligence/recommendation-engine.js";
import { analyzeProblemProperties } from "../js/intelligence/problem-property-analyzer.js";
import { createVisualizationPlan } from "../js/ai/visualization-planner.js";
import { createExecutionTrace } from "../js/visualization/visualization-runtime.js";

const question =
    "Demonstrate Stack operations: push(10), push(20), peek(), pop(), size(), isEmpty(), isFull().";

test("recognises the exact Stack question", () => {
    const properties = analyzeProblemProperties(question);

    assert.equal(properties.getProperty("stackOperationRequest"), true);

    const result = generateRuleBasedRecommendations(question);
    const approach = result.approaches.find(
        item => item.pattern === "Stack Operations"
    );

    assert.ok(approach, "Stack Operations recommendation is missing");
    assert.ok(
        approach.dataStructures.some(item => item.name === "Stack")
    );
    assert.equal(approach.applicability, "direct");
});

test("analyser recommends Stack while Qwen is unavailable", async () => {
    let qwenCalls = 0;

    const analysis = await analyzeDSARequest(question, {
        generateJSON: async () => {
            qwenCalls++;
            throw new Error("Qwen should not be called.");
        }
    });

    assert.equal(qwenCalls, 0);
    assert.equal(analysis.recommendationStatus, "curated");
    assert.equal(analysis.primaryPattern, "Stack Operations");
    assert.ok(analysis.recommendedDataStructures.includes("Stack"));
    assert.equal(analysis.approaches.length, 1);
});

test("exact question creates a valid seven-step Stack execution trace", async () => {
    const analysis = await analyzeDSARequest(question, {
        generateJSON: async () => {
            throw new Error("Qwen should not be called.");
        }
    });

    const plan = await createVisualizationPlan({
        question,
        analysis,
        selectedApproach: analysis.approaches[0]
    });

    assert.equal(plan.planningSource, "deterministic_fallback");
    assert.equal(plan.visualizations[0].visualizerId, "stack");
    assert.equal(plan.visualizations[0].structure, "Stack");
    assert.equal(plan.steps.length, 7);

    const trace = createExecutionTrace(plan);

    assert.deepEqual(
        trace.steps.map(step => step.animationEvents[0].type),
        [
            "stack.push",
            "stack.push",
            "stack.peek",
            "stack.pop",
            "stack.size",
            "stack.is-empty",
            "stack.is-full"
        ]
    );

    const finalState =
        trace.steps.at(-1).visualStates["stack-main"].state;

    assert.deepEqual(
        finalState.items.map(item => item.value),
        [10]
    );
    assert.equal(finalState.topIndex, 0);
    assert.equal(finalState.size, 1);
    assert.equal(finalState.capacity, 8);
});

test("generic Stack explanation receives a local recommendation", async () => {
    const request = "Explain how a Stack works.";

    const analysis = await analyzeDSARequest(request, {
        generateJSON: async () => {
            throw new Error("Qwen should not be called.");
        }
    });

    assert.equal(analysis.recommendationStatus, "curated");
    assert.equal(analysis.primaryPattern, "Stack Operations");

    const plan = await createVisualizationPlan({
        question: request,
        analysis,
        selectedApproach: analysis.approaches[0]
    });

    assert.ok(plan.steps.length > 0);
});

test("Monotonic Stack remains separate from basic Stack Operations", () => {
    const request =
        "Given an array, find the next greater element for every element using a Monotonic Stack.";

    const properties = analyzeProblemProperties(request);

    assert.equal(properties.getProperty("stackOperationRequest"), false);

    const result = generateRuleBasedRecommendations(request);

    assert.ok(
        result.approaches.some(item => item.pattern === "Monotonic Stack")
    );

    assert.ok(
        !result.approaches.some(item => item.pattern === "Stack Operations")
    );
});

test("unrelated questions do not receive Stack recommendations", () => {
    const result = generateRuleBasedRecommendations(
        "Explain the history of fictional spacecraft."
    );

    assert.ok(
        !result.approaches.some(item => item.pattern === "Stack Operations")
    );
});


test("generated Stack code displays and highlights every requested operation", async () => {
    const analysis = await analyzeDSARequest(question, {
        generateJSON: async () => {
            throw new Error("Qwen should not be called.");
        }
    });

    const plan = await createVisualizationPlan({
        question,
        analysis,
        selectedApproach: analysis.approaches[0]
    });

    const lines = plan.code.source.split(/\r?\n/);

    const expectedCalls = [
        "push(10);",
        "push(20);",
        "peek();",
        "pop();",
        "size();",
        "isEmpty();",
        "isFull();"
    ];

    const actualCallLines = expectedCalls.map(call => {
        const index = lines.indexOf(call);
        assert.notEqual(index, -1, `Missing source call: ${call}`);
        return index;
    });

    assert.deepEqual(
        plan.steps.map(step => step.codeLine),
        actualCallLines,
        "Every execution step must highlight its corresponding invocation."
    );
});
