
/**
 * DSA_L — Ollama Client
 *
 * Handles communication with the local Ollama API.
 * Supports fast classification and detailed planning.
 */

const OLLAMA_CONFIG = Object.freeze({
    baseUrl: "http://localhost:11434",
    model: "qwen2.5-coder:3b",
    timeout: 180000,
    keepAlive: "20m"
});


/**
 * Check Ollama availability and model installation.
 */
export async function checkOllamaConnection() {

    const response = await fetch(
        `${OLLAMA_CONFIG.baseUrl}/api/tags`
    );

    if (!response.ok) {
        throw new Error(
            `Ollama connection failed: HTTP ${response.status}`
        );
    }

    const data = await response.json();

    const modelAvailable = data.models?.some(
        model => model.name === OLLAMA_CONFIG.model
    );

    if (!modelAvailable) {
        throw new Error(
            `Model ${OLLAMA_CONFIG.model} is unavailable.`
        );
    }

    return true;
}


/**
 * Generate structured JSON using Ollama.
 *
 * Default settings are optimized for classification.
 * Visualization planning can request a larger output budget.
 */
export async function generateJSON(
    systemPrompt,
    userPrompt,
    requestOptions = {}
) {

    const {
        timeout = OLLAMA_CONFIG.timeout,
        numCtx = 4096,
        numPredict = 450,
        temperature = 0.1
    } = requestOptions;

    const controller = new AbortController();

    const timeoutId = setTimeout(
        () => controller.abort(),
        timeout
    );

    try {

        const response = await fetch(
            `${OLLAMA_CONFIG.baseUrl}/api/chat`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    model: OLLAMA_CONFIG.model,

                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: userPrompt
                        }
                    ],

                    format: "json",
                    stream: false,
                    keep_alive: OLLAMA_CONFIG.keepAlive,

                    options: {
                        temperature,
                        num_ctx: numCtx,
                        num_predict: numPredict
                    }
                }),

                signal: controller.signal
            }
        );

        if (!response.ok) {
            throw new Error(
                `Ollama request failed: HTTP ${response.status}`
            );
        }

        const data = await response.json();
        const content = data.message?.content;

        if (!content) {
            throw new Error(
                "Ollama returned an empty response."
            );
        }

        try {
            return JSON.parse(content);
        } catch {
            throw new Error(
                "Ollama returned invalid or incomplete JSON."
            );
        }

    } catch (error) {

        if (error.name === "AbortError") {
            throw new Error(
                `AI request timed out after ${timeout / 1000} seconds.`
            );
        }

        throw error;

    } finally {
        clearTimeout(timeoutId);
    }
}
