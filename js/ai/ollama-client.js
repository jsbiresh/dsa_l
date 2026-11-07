/* ============================================
   OLLAMA CLIENT
   Handles communication with the local Ollama API.
============================================ */

const OLLAMA_CONFIG = {
  baseUrl: "http://localhost:11434",
  model: "qwen2.5-coder:3b",
  timeout: 180000
};

/**
 * Check whether Ollama is reachable and the configured
 * model is available.
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
      `Model ${OLLAMA_CONFIG.model} is not available.`
    );
  }

  return true;
}

/**
 * Send a prompt to Ollama and request a JSON response.
 */
export async function generateJSON(systemPrompt, userPrompt) {
  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    OLLAMA_CONFIG.timeout
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
          keep_alive: "20m",

          options: {
            temperature: 0.1,
            num_ctx: 4096,
            num_predict: 450
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
        "Ollama returned invalid JSON."
      );
    }

  } catch (error) {

    if (error.name === "AbortError") {
      throw new Error(
        "AI analysis timed out. Please try again."
      );
    }

    throw error;

  } finally {
    clearTimeout(timeoutId);
  }
}