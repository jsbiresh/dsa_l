export class KonvaEngine {
    constructor(container) {
        if (!container) {
            throw new Error("KonvaEngine requires a container.");
        }

        if (!window.Konva) {
            throw new Error("Konva.js failed to load.");
        }

        this.Konva = window.Konva;
        this.container = container;
        this.activeTweens = new Set();

        container.replaceChildren();

        this.stage = new this.Konva.Stage({
            container,
            width: Math.max(320, container.clientWidth || 800),
            height: Math.max(320, container.clientHeight || 360)
        });

        this.backgroundLayer = new this.Konva.Layer({
            listening: false
        });

        this.contentLayer = new this.Konva.Layer();

        this.overlayLayer = new this.Konva.Layer({
            listening: false
        });

        this.stage.add(this.backgroundLayer);
        this.stage.add(this.contentLayer);
        this.stage.add(this.overlayLayer);
    }

    setSize(width, height) {
        this.stage.size({
            width: Math.max(320, width),
            height: Math.max(320, height)
        });
    }

    animate(node, attributes, duration = 0.28) {
        return new Promise((resolve) => {
            let tween;

            tween = new this.Konva.Tween({
                node,
                duration,
                easing: this.Konva.Easings.EaseInOut,
                ...attributes,

                onFinish: () => {
                    this.activeTweens.delete(tween);
                    tween.destroy();
                    resolve();
                }
            });

            this.activeTweens.add(tween);
            tween.play();
        });
    }

    destroy() {
        this.activeTweens.forEach((tween) => {
            tween.pause();
            tween.destroy();
        });

        this.activeTweens.clear();
        this.stage.destroy();
    }
}
