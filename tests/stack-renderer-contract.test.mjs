import test from "node:test";
import assert from "node:assert/strict";

import { StackRenderer } from "../js/graphics/renderers/stack-renderer.js";

test("Stack renderer supports all Stack model events", () => {
    const events = [
        "stack.push",
        "stack.pop",
        "stack.peek",
        "stack.size",
        "stack.is-empty",
        "stack.is-full",
        "stack.overflow",
        "stack.underflow"
    ].map(type => ({ type }));

    assert.equal(
        StackRenderer.prototype.canAnimateEvents.call({}, events),
        true
    );
});

test("Stack renderer rejects an unknown event", () => {
    assert.equal(
        StackRenderer.prototype.canAnimateEvents.call(
            {},
            [{ type: "stack.rotate" }]
        ),
        false
    );
});

test("Stack renderer rejects an empty event list", () => {
    assert.equal(
        StackRenderer.prototype.canAnimateEvents.call({}, []),
        false
    );
});

test("Stack renderer rejects non-array event input", () => {
    assert.equal(
        StackRenderer.prototype.canAnimateEvents.call({}, null),
        false
    );
});
