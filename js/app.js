/* ============================================
   DSA_L — APPLICATION ENTRY POINT
============================================ */

import { ArrayRenderer } from "./graphics/renderers/array-renderer.js";

import { ExecutionController } from "./core/execution-controller.js";

import { createBubbleSortTrace } from "./algorithms/bubble-sort.js";

import { analyzeDSARequest } from "./ai/problem-analyzer.js";
import { checkOllamaConnection } from "./ai/ollama-client.js";
import { createVisualizationPlan } from "./ai/visualization-planner.js";
import { createExecutionTrace } from "./visualization/visualization-runtime.js";

/* ============================================
   1. APPLICATION CONFIGURATION
============================================ */

const APP_CONFIG = {
  name: "DSA_L",
  version: "0.1.0",
  serverPort: 4888,
  defaultSpeed: 1,
  defaultSize: 10,
};

/* ============================================
   2. APPLICATION STATE
============================================ */

const appState = {
  selectedStructure: "array",

  selectedSection: null,

  animationSpeed: APP_CONFIG.defaultSpeed,

  dataSize: APP_CONFIG.defaultSize,

  isPlaying: false,

  currentStep: 0,

  totalSteps: 0,

  theme: "dark",

  currentAlgorithm: null,
};

/* ============================================
   3. DOM ELEMENT REFERENCES
============================================ */

const elements = {
  questionInput: document.getElementById("questionInput"),
  analyseButton: document.getElementById("analyseButton"),
  aiStatus: document.getElementById("aiStatus"),
  analysisStatus: document.getElementById("analysisStatus"),

  visualizationCanvas: document.getElementById("visualizationCanvas"),
  visualizationSubtitle: document.getElementById("visualizationSubtitle"),
  executionStatus: document.getElementById("executionStatus"),
  emptyState: document.getElementById("emptyState"),

  structureNavigation: document.getElementById("structureNavigation"),

  codeEditor: document.getElementById("codeEditor"),
  codeExecutionStatus: document.getElementById("codeExecutionStatus"),
  codeFileName: document.getElementById("codeFileName"),
  currentLine: document.getElementById("currentLine"),

  playButton: document.getElementById("playButton"),
  pauseButton: document.getElementById("pauseButton"),
  nextButton: document.getElementById("nextButton"),
  previousButton: document.getElementById("previousButton"),
  restartButton: document.getElementById("restartButton"),

  speedSlider: document.getElementById("speedSlider"),
  sizeSlider: document.getElementById("sizeSlider"),

  speedValue: document.getElementById("speedValue"),
  sizeValue: document.getElementById("sizeValue"),

  stepCounter: document.getElementById("stepCounter"),
  progressFill: document.getElementById("progressFill"),

  inspectorStatus: document.getElementById("inspectorStatus"),

  runBubbleSortButton: document.getElementById("runBubbleSortButton"),

  primaryPattern: document.getElementById("primaryPattern"),
  detectedStructure: document.getElementById("detectedStructure"),
  timeComplexity: document.getElementById("timeComplexity"),
  spaceComplexity: document.getElementById("spaceComplexity"),

  variablesPanel: document.getElementById("variablesPanel"),
  memoryPanel: document.getElementById("memoryPanel"),
  operationPanel: document.getElementById("operationPanel"),

  comparisonCount: document.getElementById("comparisonCount"),
  accessCount: document.getElementById("accessCount"),
  swapCount: document.getElementById("swapCount"),
  assignmentCount: document.getElementById("assignmentCount"),

    aiAnalysisPanel: document.getElementById("aiAnalysisPanel"),
  analysisConfidence: document.getElementById("analysisConfidence"),
  analysisRequestSummary: document.getElementById("analysisRequestSummary"),
  analysisKeywords: document.getElementById("analysisKeywords"),
  analysisClues: document.getElementById("analysisClues"),
  analysisPatterns: document.getElementById("analysisPatterns"),

  selectedApproachPanel: document.getElementById("selectedApproachPanel"),
selectedApproachTitle: document.getElementById("selectedApproachTitle"),
selectedApproachApplicability: document.getElementById("selectedApproachApplicability"),
selectedApproachReason: document.getElementById("selectedApproachReason"),
selectedApproachConditionsWrapper: document.getElementById("selectedApproachConditionsWrapper"),
selectedApproachConditions: document.getElementById("selectedApproachConditions"),
approachDataStructures: document.getElementById("approachDataStructures"),
visualizationFocusStatus: document.getElementById("visualizationFocusStatus"),
  analysisStructures: document.getElementById("analysisStructures"),
  analysisReasoning: document.getElementById("analysisReasoning"),
  analysisClarification: document.getElementById("analysisClarification"),
  analysisClarificationQuestion: document.getElementById("analysisClarificationQuestion"),
  approveAnalysisButton: document.getElementById("approveAnalysisButton"),
  approvalStatus: document.getElementById("approvalStatus"),
};
let currentAnalysis = null;
let analyzedQuestion = "";
let selectedApproachIndex = -1;
let selectedVisualizationFocus = null;

/* ============================================
   4. CORE COMPONENTS
============================================ */

const arrayVisualizer = new ArrayRenderer(elements.visualizationCanvas);

const executionController = new ExecutionController(handleExecutionStep);

/* ============================================
   5. APPLICATION INITIALIZATION
============================================ */

function initializeApp() {
  initializeNavigation();

  initializeSliders();

  initializeExecutionControls();

  initializeBrain();

  initializeTheme();

  initializeAlgorithmDemo();

  updateApplicationVersion();

  console.log("DSA_L initialized successfully.");
}

/* ============================================
   6. NAVIGATION
============================================ */

function initializeNavigation() {
  const navigationButtons = document.querySelectorAll(".nav-item");

  navigationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      navigationButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      const structure = button.dataset.structure;
      const section = button.dataset.section;

      if (structure) {
        appState.selectedStructure = structure;
        appState.selectedSection = null;

        elements.visualizationSubtitle.textContent =
          structure
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ") + " Visualization";
      }

      if (section) {
        appState.selectedSection = section;

        elements.visualizationSubtitle.textContent = section
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    });
  });
}

/* ============================================
   7. SLIDERS
============================================ */

function initializeSliders() {
  elements.speedSlider.addEventListener("input", (event) => {
    const speed = Number(event.target.value);

    appState.animationSpeed = speed;

    executionController.setSpeed(speed);

    elements.speedValue.textContent =
      speed.toFixed(2).replace(/0+$/, "").replace(/\.$/, "") + "x";
  });

  elements.sizeSlider.addEventListener("input", (event) => {
    appState.dataSize = Number(event.target.value);

    elements.sizeValue.textContent = appState.dataSize;
  });

  elements.speedValue.textContent = appState.animationSpeed.toFixed(1) + "x";

  elements.sizeValue.textContent = appState.dataSize;
}

/* ============================================
   8. EXECUTION CONTROLS
============================================ */

let navigationQueue = Promise.resolve();

function initializeExecutionControls() {
  elements.playButton.addEventListener("click", async () => {
    if (!appState.currentAlgorithm) return;

    await navigationQueue;

    executionController.play();
    appState.isPlaying = true;
    elements.executionStatus.textContent = "PLAYING";
  });

  elements.pauseButton.addEventListener("click", () => {
    executionController.pause();
    appState.isPlaying = false;
    elements.executionStatus.textContent = "PAUSED";
  });

  elements.nextButton.addEventListener("click", () => {
    navigateOneStep(1);
  });

  elements.previousButton.addEventListener("click", () => {
    navigateOneStep(-1);
  });

  elements.restartButton.addEventListener("click", async () => {
    if (!appState.currentAlgorithm) return;

    executionController.pause();
    await navigationQueue;
    await executionController.restart();

    appState.isPlaying = false;
    elements.executionStatus.textContent = "READY";
  });
}

function navigateOneStep(direction) {
  if (!appState.currentAlgorithm) return navigationQueue;

  executionController.pause();
  appState.isPlaying = false;
  elements.executionStatus.textContent = "PAUSED";

  navigationQueue = navigationQueue.then(async () => {
    if (direction === 1 && executionController.hasNext()) {
      await executionController.next();
    } else if (direction === -1 && executionController.hasPrevious()) {
      await executionController.previous();
    }

    appState.isPlaying = false;
  }).catch((error) => {
    console.error("Step navigation failed:", error);
    elements.executionStatus.textContent = "NAVIGATION ERROR";
  });

  return navigationQueue;
}

function initializeAlgorithmDemo() {
  if (elements.runBubbleSortButton) {
    elements.runBubbleSortButton.addEventListener(
      "click",
      loadBubbleSortDemo
    );
  }
}

function loadBubbleSortDemo() {
  try {
    executionController.pause();

    appState.isPlaying = false;

    const inputArray = [5, 3, 8, 2];

    // Generate deterministic execution history.
    const trace = createBubbleSortTrace(inputArray);

    appState.currentAlgorithm = trace;

    appState.totalSteps = trace.steps.length;

// Initialize the execution engine.
executionController.initialize(
    trace.algorithmName,
    trace.initialState
);

// Register every recorded algorithm step.
trace.steps.forEach(step => {

    executionController.recordStep(step);

});

// Return execution to the initial state.
executionController.restart();

    // Display the initial array.
    arrayVisualizer.render(trace.initialState, {}, { animate: false });

    // Display algorithm code.
    renderCode(trace.code);

    // Update analysis summary.
    elements.primaryPattern.textContent = "Sorting";

    elements.detectedStructure.textContent = "Array";

    elements.timeComplexity.textContent = trace.summary.timeComplexity;

    elements.spaceComplexity.textContent = trace.summary.spaceComplexity;

    elements.visualizationSubtitle.textContent = "Bubble Sort Visualization";

    elements.analysisStatus.textContent = "Bubble Sort demonstration loaded.";

    elements.codeFileName.textContent = "bubble-sort.js";

    elements.codeExecutionStatus.textContent = "READY";

    elements.executionStatus.textContent = "READY";

    // Update the initial execution display.
    updateExecutionPosition();

    updateInspector({
      action: "INITIALIZE",
      state: trace.initialState,
      explanation: "Bubble Sort initialized. Press Play or Next.",
      variables: {},
      metrics: {},
    });

    console.log("Bubble Sort loaded:", trace.summary);
  } catch (error) {
    console.error("Unable to load Bubble Sort:", error);

    elements.analysisStatus.textContent =
      "Unable to load Bubble Sort: " + error.message;
  }
}

/* ============================================
   10. EXECUTION STEP HANDLER
============================================ */

async function handleExecutionStep(step) {
  if (!step) return;

  const metadata = step.metadata || {};

  // Start the visual transition.
  const rendering = arrayVisualizer.render(step.state, metadata, {
    animate: true
  });

  // Restore the code and inspector from this exact snapshot.
  highlightCodeLine(step.codeLine);
  updateInspector(step);
  updateExecutionPosition();

  const position = executionController.getPosition();

  appState.currentStep = position.currentStep;
  appState.isPlaying = executionController.getIsPlaying();

  if (step.action === "COMPLETE") {
    elements.executionStatus.textContent = "COMPLETED";
    elements.codeExecutionStatus.textContent = "EXECUTION FINISHED";
  } else {
    elements.executionStatus.textContent =
      "STEP " + (position.currentStep + 1) + " — " + step.action;

    elements.codeExecutionStatus.textContent = "EXECUTING";
  }

  // Wait for Konva animations before allowing another queued step.
  await rendering;
}

/* ============================================
   11. JAVASCRIPT CODE PANEL
============================================ */

function renderCode(code) {
  const lines = code.split("\n");

  const fragment = document.createDocumentFragment();

  elements.codeEditor.replaceChildren();

  lines.forEach((line, index) => {
    const lineElement = document.createElement("div");

    lineElement.className = "code-line";

    lineElement.dataset.line = index;

    const number = document.createElement("span");

    number.className = "code-line-number";

    number.textContent = index + 1;

    const content = document.createElement("span");

    content.className = "code-line-content";

    content.textContent = line;

    lineElement.appendChild(number);

    lineElement.appendChild(content);

    fragment.appendChild(lineElement);
  });

  elements.codeEditor.appendChild(fragment);
}

function highlightCodeLine(lineNumber) {
  const lines = elements.codeEditor.querySelectorAll(".code-line");

  lines.forEach((line) => {
    line.classList.remove("code-line--current", "code-line--executed");
  });

  if (!Number.isInteger(lineNumber) || lineNumber < 0) {
    elements.currentLine.textContent = "Line: —";
    return;
  }

  lines.forEach((line) => {
    const index = Number(line.dataset.line);

    if (index < lineNumber) {
      line.classList.add("code-line--executed");
    }

    if (index === lineNumber) {
      line.classList.add("code-line--current");
    }
  });

  elements.currentLine.textContent = "Line: " + (lineNumber + 1);

  const currentElement = elements.codeEditor.querySelector(
    '[data-line="' + lineNumber + '"]'
  );

  if (currentElement) {
    const editorRect = elements.codeEditor.getBoundingClientRect();
    const lineRect = currentElement.getBoundingClientRect();

    if (lineRect.top < editorRect.top || lineRect.bottom > editorRect.bottom) {
      currentElement.scrollIntoView({
        block: "nearest",
        behavior: "instant"
      });
    }
  }
}

function updateExecutionPosition() {
  const position = executionController.getPosition();

  const displayedStep = position.currentStep + 1;

  elements.stepCounter.textContent =
    displayedStep + " / " + position.totalSteps;

  elements.progressFill.style.width = position.progress + "%";
}

/* ============================================
   13. EXECUTION INSPECTOR
============================================ */

function updateInspector(step) {
  const variables = step.variables || {};

  const metrics = step.metrics || {};

  if (elements.variablesPanel) {
    elements.variablesPanel.textContent =
      Object.entries(variables)
        .map(([key, value]) => key + ": " + JSON.stringify(value))
        .join("\n") || "No variables available.";
  }

  if (elements.operationPanel) {
    elements.operationPanel.textContent =
      step.explanation || "No explanation available.";
  }

  if (elements.memoryPanel) {
    const array = step.state.array;

    elements.memoryPanel.textContent = array
      .map((item, index) => {
        return "[" + index + "] " + item.value + " (" + item.id + ")";
      })
      .join("\n");
  }

  if (elements.comparisonCount) {
    elements.comparisonCount.textContent = metrics.comparisons || 0;
  }

  if (elements.accessCount) {
    elements.accessCount.textContent = metrics.arrayAccesses || 0;
  }

  if (elements.swapCount) {
    elements.swapCount.textContent = metrics.swaps || 0;
  }

  if (elements.assignmentCount) {
    elements.assignmentCount.textContent = metrics.assignments || 0;
  }

  if (elements.inspectorStatus) {
    elements.inspectorStatus.textContent = step.action || "EXECUTION";
  }
}

/* ============================================
   14. BRAIN
============================================ */

// function initializeBrain() {
//   elements.aiStatus.textContent = "AI: Awaiting connection";

//   elements.analyseButton.addEventListener("click", () => {
//     const question = elements.questionInput.value.trim();

//     if (!question) {
//       elements.analysisStatus.textContent =
//         "Please enter a DSA question first.";

//       elements.questionInput.focus();

//       return;
//     }

//     elements.analysisStatus.textContent =
//       "Question received. AI integration is pending.";
//   });
// }
async function initializeBrain() {
  elements.aiStatus.textContent = "AI: Connecting...";

  elements.aiAnalysisPanel.hidden = true;

  elements.analyseButton.addEventListener(
    "click",
    handleProblemAnalysis
  );

  // elements.approveAnalysisButton.addEventListener(
  //   "click",
  //   () => {
  //     if (!currentAnalysis || currentAnalysis.requiresClarification) {
  //       return;
  //     }

  //     elements.approvalStatus.textContent =
  //       "Approach approved. Ready for visualization planning.";

  //     elements.approveAnalysisButton.disabled = true;
  //   }
  // );

  elements.approveAnalysisButton.addEventListener(
    "click",
    handlePlayAnimation
  );

  try {
    await checkOllamaConnection();

    elements.aiStatus.textContent =
      "AI: Connected — Qwen 2.5 Coder";

  } catch (error) {
    elements.aiStatus.textContent = "AI: Offline";

    elements.analysisStatus.textContent =
      "Ollama is unavailable. Start Ollama and try again.";

    console.error("Ollama connection:", error);
  }
}

async function handleProblemAnalysis() {
  const question = elements.questionInput.value.trim();

  if (!question) {
    elements.analysisStatus.textContent =
      "Please enter a DSA question or visualization request.";

    elements.questionInput.focus();
    return;
  }

  elements.analyseButton.disabled = true;
  elements.aiAnalysisPanel.hidden = true;

  elements.analysisStatus.textContent =
    "Qwen is analysing your request. Please wait...";

  elements.aiStatus.textContent = "AI: Analysing...";

  try {
    const analysis = await analyzeDSARequest(question);

    currentAnalysis = analysis;
    analyzedQuestion = question;

    renderAnalysisResults(analysis);

    elements.aiAnalysisPanel.hidden = false;

    elements.analysisStatus.textContent =
      "Analysis completed successfully.";

    elements.aiStatus.textContent =
      "AI: Connected — Qwen 2.5 Coder";

  } catch (error) {
    elements.analysisStatus.textContent = error.message;

    elements.aiStatus.textContent = "AI: Error";

    console.error("Problem analysis failed:", error);

  } finally {
    elements.analyseButton.disabled = false;
  }
}

/**
 * Generate and start an animation for the selected approach.
 */
async function handlePlayAnimation() {
  if (
    !currentAnalysis ||
    currentAnalysis.requiresClarification ||
    selectedApproachIndex < 0
  ) {
    return;
  }

  const selectedApproach =
    currentAnalysis.approaches[selectedApproachIndex];

  if (!analyzedQuestion) {
    elements.approvalStatus.textContent =
      "Please analyse the question again.";
    return;
  }

  elements.approveAnalysisButton.disabled = true;
  elements.approveAnalysisButton.textContent = "Preparing...";
  elements.analysisStatus.textContent =
    "Qwen is preparing the visualization plan...";

  elements.approvalStatus.textContent =
    "Generating algorithm steps and sample data.";

  elements.aiStatus.textContent = "AI: Planning animation...";

  try {
    const plan = await createVisualizationPlan({
      question: analyzedQuestion,
      analysis: currentAnalysis,
      selectedApproach
    });

    const trace = createExecutionTrace(plan);

    await loadGeneratedTrace(trace, plan);

    elements.approvalStatus.textContent =
      "Visualization loaded. Playback started.";

    elements.analysisStatus.textContent =
      "Animation is running.";

    elements.aiStatus.textContent =
      "AI: Connected — Qwen 2.5 Coder";

  } catch (error) {
    elements.approvalStatus.textContent = error.message;
    elements.analysisStatus.textContent =
      "Unable to prepare this visualization.";

    elements.aiStatus.textContent = "AI: Ready";

    console.error("Visualization planning failed:", error);

  } finally {
    elements.approveAnalysisButton.disabled =
      !currentAnalysis ||
      currentAnalysis.requiresClarification ||
      selectedApproachIndex < 0;

    elements.approveAnalysisButton.textContent = "Play Animation";
  }
}


/**
 * Load a validated execution trace into the existing player.
 */
async function loadGeneratedTrace(trace, plan) {
  executionController.pause();

  appState.isPlaying = false;
  appState.currentAlgorithm = trace;
  appState.totalSteps = trace.steps.length;

  elements.executionStatus.textContent = "LOADING";
  elements.codeExecutionStatus.textContent = "LOADING";

  // Initialise the existing execution engine.
  executionController.initialize(
    trace.algorithmName,
    trace.initialState
  );

  // Register deterministic steps.
  trace.steps.forEach(step => {
    executionController.recordStep(step);
  });

  // Render the initial visual state.
  await arrayVisualizer.render(
    trace.initialState,
    {},
    { animate: false }
  );

  // Display the JavaScript supplied by the validated plan.
  renderCode(trace.code);

  // Update problem metadata.
  elements.primaryPattern.textContent = trace.pattern;

  elements.detectedStructure.textContent =
    plan.visualizations.map(item => item.structure).join(", ");

  elements.timeComplexity.textContent =
    trace.complexity.time;

  elements.spaceComplexity.textContent =
    trace.complexity.space;

  elements.visualizationSubtitle.textContent =
    trace.pattern + " Visualization";

  const fileName = trace.pattern
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  elements.codeFileName.textContent =
    fileName + ".js";

  elements.executionStatus.textContent = "READY";
  elements.codeExecutionStatus.textContent = "READY";

  // Return the player to the beginning and update the UI.
  await executionController.restart();

  updateExecutionPosition();

  // Start playback automatically.
  if (executionController.hasNext()) {
    appState.isPlaying = true;
    executionController.play();
  }
}

function renderAnalysisResults(analysis) {
  elements.analysisRequestSummary.textContent =
    analysis.requestSummary || "Request analysed.";

  elements.analysisConfidence.textContent =
    `Confidence: ${Math.round(analysis.confidence * 100)}%`;

  elements.primaryPattern.textContent =
    analysis.primaryPattern || "Not identified";

  elements.detectedStructure.textContent =
    analysis.recommendedDataStructures.join(", ") ||
    analysis.requestedDataStructure ||
    "Not identified";

  elements.timeComplexity.textContent =
    analysis.timeComplexity || "Not estimated";

  elements.spaceComplexity.textContent =
    analysis.spaceComplexity || "Not estimated";

  renderTags(elements.analysisKeywords, analysis.keywords);

  renderTags(
    elements.analysisStructures,
    analysis.recommendedDataStructures
  );

  renderClues(analysis.clues);

  renderPatterns(analysis);

  elements.analysisReasoning.textContent =
    analysis.reasoning || "No explanation provided.";

  elements.analysisClarification.hidden =
    !analysis.requiresClarification;

  elements.analysisClarificationQuestion.textContent =
    analysis.clarificationQuestion || "";

  elements.approveAnalysisButton.disabled = true;

  elements.approvalStatus.textContent = "";

  elements.approveAnalysisButton.textContent =
  analysis.requiresClarification
    ? "Clarification required"
    : "Play Animation";
}

function renderTags(container, values) {
  container.replaceChildren();

  values.forEach(value => {
    const tag = document.createElement("span");

    tag.className = "analysis-tag";
    tag.textContent = String(value);

    container.appendChild(tag);
  });
}

function renderClues(clues) {
  elements.analysisClues.replaceChildren();

  clues.forEach(clue => {
    const card = document.createElement("div");
    card.className = "analysis-clue-card";

    const title = document.createElement("strong");
    title.textContent = clue.text || "Detected clue";

    const suggestion = document.createElement("p");
    suggestion.textContent =
      `Suggests: ${clue.suggests || "Not specified"}`;

    const reason = document.createElement("p");
    reason.textContent =
      clue.reason || "";

    card.append(title, suggestion, reason);

    elements.analysisClues.appendChild(card);
  });
}

function renderPatterns(analysis) {
  elements.analysisPatterns.replaceChildren();

  selectedApproachIndex = -1;
  selectedVisualizationFocus = null;

  elements.selectedApproachPanel.hidden = true;
  elements.approachDataStructures.replaceChildren();

  elements.approveAnalysisButton.disabled = true;

  const approaches = Array.isArray(analysis.approaches)
    ? analysis.approaches
    : [];

  if (approaches.length === 0) {
    const message = document.createElement("p");
    message.textContent =
      "No supported algorithmic pattern was identified.";

    elements.analysisPatterns.appendChild(message);
    return;
  }

  approaches.forEach((approach, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "approach-option";
    button.setAttribute("aria-pressed", "false");

    const title = document.createElement("strong");
    title.textContent = approach.pattern;

    const applicability = document.createElement("span");
    applicability.className = "approach-option-badge";
    applicability.textContent =
      approach.applicability === "direct"
        ? "Direct"
        : "Conditional";

    const reason = document.createElement("p");
    reason.textContent = approach.reason || "No explanation provided.";

    button.append(title, applicability, reason);

    button.addEventListener("click", () => {
      selectApproach(index);
    });

    elements.analysisPatterns.appendChild(button);
  });
}

function selectApproach(index) {
  if (!currentAnalysis || currentAnalysis.requiresClarification) {
    return;
  }

  const approach = currentAnalysis.approaches[index];

  if (!approach) {
    return;
  }

  selectedApproachIndex = index;

  const buttons =
    elements.analysisPatterns.querySelectorAll(".approach-option");

  buttons.forEach((button, buttonIndex) => {
    const selected = buttonIndex === index;

    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  elements.selectedApproachPanel.hidden = false;
  elements.selectedApproachTitle.textContent = approach.pattern;

  elements.selectedApproachApplicability.textContent =
    approach.applicability === "direct"
      ? "Directly applicable"
      : "Conditional approach";

  elements.selectedApproachReason.textContent =
    approach.reason || "No explanation provided.";

  elements.selectedApproachConditions.replaceChildren();

  const conditions = Array.isArray(approach.conditions)
    ? approach.conditions
    : [];

  elements.selectedApproachConditionsWrapper.hidden =
    conditions.length === 0;

  conditions.forEach(condition => {
    const item = document.createElement("li");
    item.textContent = condition;
    elements.selectedApproachConditions.appendChild(item);
  });

  // Render the data structures associated with this approach.
  renderApproachDataStructures(approach);

  elements.approvalStatus.textContent =
    "Approach selected. Ready to generate animation.";

  elements.approveAnalysisButton.disabled = false;
  elements.approveAnalysisButton.textContent = "Play Animation";
}

function renderApproachDataStructures(approach) {
  elements.approachDataStructures.replaceChildren();

  const structures = Array.isArray(approach.dataStructures)
    ? approach.dataStructures
    : [];

  if (structures.length === 0) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "approach-structure-option";
    button.textContent = "Concept-only visualization";

    button.addEventListener("click", () => {
      selectVisualizationFocus("concept");
    });

    elements.approachDataStructures.appendChild(button);
    return;
  }

  structures.forEach(structure => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "approach-structure-option";

    button.textContent =
      `${structure.name} · ${structure.role}`;

    button.title = structure.reason || structure.name;

    button.addEventListener("click", () => {
      selectVisualizationFocus(structure.name);
    });

    elements.approachDataStructures.appendChild(button);
  });

  // Offer a synchronized combined view when multiple
  // data structures belong to the selected approach.
  if (structures.length > 1) {
    const combinedButton = document.createElement("button");

    combinedButton.type = "button";
    combinedButton.className =
      "approach-structure-option combined-option";

    combinedButton.textContent = "Combined visualization";

    combinedButton.addEventListener("click", () => {
      selectVisualizationFocus("combined");
    });

    elements.approachDataStructures.appendChild(combinedButton);
  }

  // If there's exactly one structure, select it automatically.
  if (structures.length === 1) {
    selectVisualizationFocus(structures[0].name);
  }
}

function selectVisualizationFocus(focus) {
  selectedVisualizationFocus = focus;

  const buttons =
    elements.approachDataStructures.querySelectorAll(
      ".approach-structure-option"
    );

  buttons.forEach(button => {
    const selected =
      (focus === "combined" &&
        button.classList.contains("combined-option")) ||
      (focus === "concept" &&
        button.textContent === "Concept-only visualization") ||
      (focus !== "combined" &&
        focus !== "concept" &&
        button.textContent.startsWith(focus + " ·"));

    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  const label =
    focus === "combined"
      ? "Combined visualization selected."
      : focus === "concept"
        ? "Concept-only visualization selected."
        : `${focus} visualization selected.`;

  elements.visualizationFocusStatus.textContent = label;

  elements.approveAnalysisButton.disabled =
    selectedApproachIndex < 0 ||
    !currentAnalysis ||
    currentAnalysis.requiresClarification;

  elements.approveAnalysisButton.textContent =
    "Play Animation";
}
/* ============================================
   15. THEME
============================================ */

function initializeTheme() {
  document.documentElement.dataset.theme = appState.theme;
}

/* ============================================
   16. APPLICATION VERSION
============================================ */

function updateApplicationVersion() {
  const versionElement = document.getElementById("appVersion");

  if (versionElement) {
    versionElement.textContent = "v" + APP_CONFIG.version;
  }
}

/* ============================================
   17. START APPLICATION
============================================ */

initializeApp();
