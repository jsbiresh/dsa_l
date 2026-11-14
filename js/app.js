/* ============================================
   DSA_L — APPLICATION ENTRY POINT
============================================ */

import { VisualizationManager } from "./graphics/engine/visualization-manager.js";

import { ExecutionController } from "./core/execution-controller.js";

import { createBubbleSortTrace } from "./algorithms/bubble-sort.js";

import { analyzeDSARequest } from "./ai/problem-analyzer.js";
import { checkOllamaConnection } from "./ai/ollama-client.js";
import { createVisualizationPlan } from "./ai/visualization-planner.js";
import { createExecutionTrace } from "./visualization/visualization-runtime.js";
import { assertMinimumGeneratedInputSize } from "./ai/input-size-policy.js";

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

  liveRemarkStep: document.getElementById("liveRemarkStep"),
  liveRemarkValues: document.getElementById("liveRemarkValues"),
  liveRemarkComparison: document.getElementById("liveRemarkComparison"),
  liveRemarkNarrative: document.getElementById("liveRemarkNarrative"),

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

const visualizationManager =
  new VisualizationManager(elements.visualizationCanvas);

const initialVisualizationReady = visualizationManager.configure([
  {
    id: "main",
    structure: "Array",
    visualizerId: "array",
    role: "primary",
    initialState: { array: [] }
  }
]);

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

async function loadBubbleSortDemo() {
  try {
    executionController.pause();

    appState.isPlaying = false;

    const inputArray = [5, 3, 8, 2];

    // Generate deterministic execution history.
    const trace = createBubbleSortTrace(inputArray);

    appState.currentAlgorithm = trace;

    appState.totalSteps = trace.steps.length;

// Initialize the execution engine.
await initialVisualizationReady;

    await visualizationManager.configure([
      {
        id: "main",
        structure: "Array",
        visualizerId: "array",
        role: "primary",
        initialState: trace.initialState
      }
    ]);

    executionController.initialize(
      trace.algorithmName,
      trace.initialState
    );

// Register every recorded algorithm step.
trace.steps.forEach(step => {

    executionController.recordStep(step);

});

// Return execution to the initial state.
await executionController.restart();

    // Display the initial array.


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
  const rendering = visualizationManager.renderStep(step, {
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


function formatRemarkValue(value) {
  if (typeof value === "string") return value;

  if (value === undefined) return "undefined";

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getArraySnapshot(step) {
  if (Array.isArray(step.state?.array)) {
    return step.state.array;
  }

  const visualStates = Object.values(step.visualStates || {});

  const arrayVisualState = visualStates.find(
    item => Array.isArray(item?.state?.array)
  );

  return arrayVisualState?.state?.array || [];
}

function renderLiveExecutionRemarks(step) {
  const variables = step.variables || {};
  const array = getArraySnapshot(step);

  const position = executionController.getPosition();
  const action = String(step.action || "EXECUTION")
    .replaceAll("_", " ");

  elements.liveRemarkStep.textContent =
    `STEP ${position.currentStep + 1} — ${action}`;

  // Display the actual runtime variables.
  elements.liveRemarkValues.replaceChildren();

  const addValueCard = (label, value, derived = false) => {
    const card = document.createElement("div");
    card.className = derived
      ? "live-remark-value live-remark-value--derived"
      : "live-remark-value";

    const title = document.createElement("span");
    title.className = "live-remark-value-label";
    title.textContent = label;

    const content = document.createElement("strong");
    content.className = "live-remark-value-content";
    content.textContent = formatRemarkValue(value);

    card.append(title, content);
    elements.liveRemarkValues.appendChild(card);
  };

  const entries = Object.entries(variables);

  if (entries.length === 0) {
    const placeholder = document.createElement("span");
    placeholder.className = "live-remarks-placeholder";
    placeholder.textContent = "No runtime variables for this step.";
    elements.liveRemarkValues.appendChild(placeholder);
  } else {
    entries.forEach(([key, value]) => {
      addValueCard(key, value);
    });
  }

  // Derive actual array lookups from the execution snapshot.
  // This works across search, sorting, and other array algorithms.
  const indexKeys = [
    "i",
    "j",
    "index",
    "mid",
    "leftIndex",
    "rightIndex",
    "minIndex",
    "maxIndex",
    "pivotIndex",
    "boundary",
    "low",
    "high",
    "start",
    "end"
  ];

  const shownIndexes = new Set();

  indexKeys.forEach(key => {
    const index = variables[key];

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= array.length ||
      shownIndexes.has(index)
    ) {
      return;
    }

    shownIndexes.add(index);

    const item = array[index];
    const value =
      item && typeof item === "object" && "value" in item
        ? item.value
        : item;

    addValueCard(`array[${index}]`, value, true);
  });

  // Build comparisons exclusively from this execution snapshot.
  // Never infer that equality means an algorithm has finished.
  const has = key => Object.hasOwn(variables, key);

  const compareValues = (left, right) => {
    if (Object.is(left, right) || left === right) {
      return "=";
    }

    const sameComparableType =
      typeof left === typeof right &&
      (typeof left === "number" || typeof left === "string");

    if (!sameComparableType) return "≠";

    if (left < right) return "<";
    if (left > right) return ">";

    return "≠";
  };

  let comparison = "";

  // Sorting algorithms: compare the actual adjacent/current values.
  if (has("left") && has("right")) {
    const leftLabel = Number.isInteger(variables.leftIndex)
      ? `array[${variables.leftIndex}]`
      : "left";

    const rightLabel = Number.isInteger(variables.rightIndex)
      ? `array[${variables.rightIndex}]`
      : "right";

    const relation = compareValues(variables.left, variables.right);

    comparison =
      `Comparing ${leftLabel} = ${formatRemarkValue(variables.left)} ` +
      `with ${rightLabel} = ${formatRemarkValue(variables.right)}. ` +
      `Result: ${relation}.`;
  }

  // Search algorithms: explain the actual current-versus-target relation.
  else if (has("current") && has("target")) {
    const relation = compareValues(variables.current, variables.target);

    comparison =
      `Compare current value ${formatRemarkValue(variables.current)} ` +
      `with target ${formatRemarkValue(variables.target)}. ` +
      `Result: current ${relation} target.`;
  }

  // Pivot-based algorithms.
  else if (has("current") && has("pivot")) {
    const relation = compareValues(variables.current, variables.pivot);

    comparison =
      `Compare current value ${formatRemarkValue(variables.current)} ` +
      `with pivot ${formatRemarkValue(variables.pivot)}. ` +
      `Result: current ${relation} pivot.`;
  }

  // Binary Search, Lower Bound and Upper Bound.
  // Do not assume whether high is inclusive or exclusive.
  else if (has("low") || has("high") || has("mid")) {
    const bounds = [];

    if (has("low")) {
      bounds.push(`low = ${formatRemarkValue(variables.low)}`);
    }

    if (has("mid")) {
      bounds.push(`mid = ${formatRemarkValue(variables.mid)}`);
    }

    if (has("high")) {
      bounds.push(`high = ${formatRemarkValue(variables.high)}`);
    }

    comparison = `Current search boundaries: ${bounds.join(", ")}.`;

    if (Number.isInteger(variables.mid)) {
      const mid = variables.mid;

      if (mid >= 0 && mid < array.length) {
        const item = array[mid];
        const value =
          item && typeof item === "object" && "value" in item
            ? item.value
            : item;

        comparison +=
          ` Midpoint value: array[${mid}] = ${formatRemarkValue(value)}.`;
      }
    }
  }

  // Single-position operations such as Linear Search or traversal.
  else {
    const indexKeys = [
      "i", "j", "index", "position", "currentIndex",
      "leftIndex", "rightIndex", "pivotIndex"
    ];

    const activeIndexes = indexKeys
      .filter(key => Number.isInteger(variables[key]))
      .map(key => `${key} = ${variables[key]}`);

    if (activeIndexes.length) {
      comparison = `Current positions: ${activeIndexes.join(", ")}.`;
    }
  }

  elements.liveRemarkComparison.textContent =
    comparison || "Review the runtime values above for this step.";

  // The plan's own explanation is the source of truth.
  elements.liveRemarkNarrative.textContent =
    step.explanation || "No explanation was provided for this step.";
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
    const array = getArraySnapshot(step);

    elements.memoryPanel.textContent = array.length
      ? array.map((item, index) => {
          const value =
            item && typeof item === "object" && "value" in item
              ? item.value
              : item;

          const id =
            item && typeof item === "object"
              ? item.id || ""
              : "";

          return `[${index}] ${value}${id ? " (" + id + ")" : ""}`;
        }).join("\n")
      : "No array snapshot available for this step.";
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

  renderLiveExecutionRemarks(step);
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

    const usedFallback =
      analysis.analysisProvider === "deterministic_fallback";

    if (usedFallback && analysis.recommendationStatus === "curated") {
      const qwenUnavailable =
        /Qwen analysis unavailable/i.test(analysis.analysisWarning || "");

      elements.analysisStatus.textContent = qwenUnavailable
        ? "Analysis completed using curated local rules. Qwen was unavailable."
        : "Analysis completed using deterministic local rules.";

      elements.aiStatus.textContent =
        "AI: Local rules active";
    } else if (usedFallback) {
      elements.analysisStatus.textContent =
        "No verified recommendation is available. Qwen analysis failed.";
      elements.aiStatus.textContent =
        "AI: Local fallback — no curated match";
    } else {
      elements.analysisStatus.textContent =
        "Analysis completed successfully.";
      elements.aiStatus.textContent =
        "AI: Connected — Qwen 2.5 Coder";
    }

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

    assertMinimumGeneratedInputSize(plan, analyzedQuestion);

    const trace = createExecutionTrace(plan);

    await loadGeneratedTrace(trace, plan);

    elements.approvalStatus.textContent =
      "Visualization loaded. Playback started.";

    elements.analysisStatus.textContent =
      "Animation is running.";

    elements.aiStatus.textContent =
      plan.planningSource === "deterministic_fallback"
        ? "AI: Local deterministic planner"
        : "AI: Connected — Qwen 2.5 Coder";

    if (plan.planningSource === "deterministic_fallback") {
      elements.approvalStatus.textContent =
        `Qwen planning unavailable. A validated local ${plan.selectedApproach.pattern} plan was generated.`;
    }

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
  await initialVisualizationReady;

  await visualizationManager.configure(trace.visualizations);

  executionController.initialize(
    trace.algorithmName,
    trace.initialState,
    trace.initialVisualStates
  );

  // Register deterministic steps.
  trace.steps.forEach(step => {
    executionController.recordStep(step);
  });

  // VisualizationManager.configure() renders all initial visual states.

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
