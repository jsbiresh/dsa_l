/* ============================================
   DSA_L — APPLICATION ENTRY POINT
   File: js/app.js
============================================ */


/* ============================================
   1. APPLICATION CONFIGURATION
============================================ */

const APP_CONFIG = {
    name: "DSA_L",
    version: "0.1.0",
    serverPort: 4888,
    defaultSpeed: 1,
    defaultSize: 10
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

    theme: "dark"

};


/* ============================================
   3. DOM ELEMENT REFERENCES
============================================ */

const elements = {

    // Brain

    questionInput: document.getElementById("questionInput"),
    analyseButton: document.getElementById("analyseButton"),
    aiStatus: document.getElementById("aiStatus"),
    analysisStatus: document.getElementById("analysisStatus"),

    // Visualization

    visualizationCanvas:
        document.getElementById("visualizationCanvas"),

    visualizationSubtitle:
        document.getElementById("visualizationSubtitle"),

    executionStatus:
        document.getElementById("executionStatus"),

    emptyState:
        document.getElementById("emptyState"),

    // Navigation

    structureNavigation:
        document.getElementById("structureNavigation"),

    // Code

    codeEditor:
        document.getElementById("codeEditor"),

    codeExecutionStatus:
        document.getElementById("codeExecutionStatus"),

    // Execution controls

    playButton:
        document.getElementById("playButton"),

    pauseButton:
        document.getElementById("pauseButton"),

    nextButton:
        document.getElementById("nextButton"),

    previousButton:
        document.getElementById("previousButton"),

    restartButton:
        document.getElementById("restartButton"),

    speedSlider:
        document.getElementById("speedSlider"),

    sizeSlider:
        document.getElementById("sizeSlider"),

    speedValue:
        document.getElementById("speedValue"),

    sizeValue:
        document.getElementById("sizeValue"),

    // Progress

    stepCounter:
        document.getElementById("stepCounter"),

    progressFill:
        document.getElementById("progressFill"),

    // Inspector

    inspectorStatus:
        document.getElementById("inspectorStatus")

};


/* ============================================
   4. APPLICATION INITIALIZATION
============================================ */

function initializeApp() {

    console.log("--------------------------------");
    console.log("DSA_L INITIALIZING");
    console.log("--------------------------------");

    initializeNavigation();

    initializeSliders();

    initializeExecutionControls();

    initializeBrain();

    initializeTheme();

    updateApplicationVersion();

    console.log("DSA_L successfully initialized.");

    console.log("Application configuration:", APP_CONFIG);

    console.log("Application state:", appState);

}


/* ============================================
   5. NAVIGATION
============================================ */

function initializeNavigation() {

    const navigationButtons =
        document.querySelectorAll(".nav-item");

    navigationButtons.forEach(button => {

        button.addEventListener("click", () => {

            navigationButtons.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            const structure = button.dataset.structure;

            const section = button.dataset.section;

            if (structure) {

                appState.selectedStructure = structure;

                appState.selectedSection = null;

                const formattedName = structure
                    .split("-")
                    .map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(" ");

                elements.visualizationSubtitle.textContent =
                    `${formattedName} Visualization`;

                console.log("Selected structure:", structure);

            }

            if (section) {

                appState.selectedSection = section;

                console.log("Selected learning section:", section);

                elements.visualizationSubtitle.textContent =
                    section
                        .split("-")
                        .map(word =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ");

            }

        });

    });

}


/* ============================================
   6. SLIDER INITIALIZATION
============================================ */

function initializeSliders() {

    // Animation speed

    elements.speedSlider.addEventListener("input", event => {

        const speed = Number(event.target.value);

        appState.animationSpeed = speed;

        elements.speedValue.textContent =
            `${speed.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}x`;

    });


    // Data structure size

    elements.sizeSlider.addEventListener("input", event => {

        const size = Number(event.target.value);

        appState.dataSize = size;

        elements.sizeValue.textContent = size;

    });


    // Initial values

    elements.speedValue.textContent =
        `${appState.animationSpeed.toFixed(1)}x`;

    elements.sizeValue.textContent =
        appState.dataSize;

}


/* ============================================
   7. EXECUTION CONTROL INITIALIZATION
============================================ */

function initializeExecutionControls() {

    elements.playButton.addEventListener("click", () => {

        setExecutionMessage(
            "Execution engine is being developed."
        );

    });


    elements.pauseButton.addEventListener("click", () => {

        setExecutionMessage(
            "No active execution to pause."
        );

    });


    elements.nextButton.addEventListener("click", () => {

        setExecutionMessage(
            "Step execution will be available with the execution engine."
        );

    });


    elements.previousButton.addEventListener("click", () => {

        setExecutionMessage(
            "Step history will be available with the state recorder."
        );

    });


    elements.restartButton.addEventListener("click", () => {

        appState.currentStep = 0;

        elements.stepCounter.textContent = "0 / 0";

        elements.progressFill.style.width = "0%";

        setExecutionMessage(
            "Execution position reset."
        );

    });

}


function setExecutionMessage(message) {

    elements.executionStatus.textContent = "READY";

    elements.inspectorStatus.textContent = message;

}


/* ============================================
   8. BRAIN INITIALIZATION
============================================ */

function initializeBrain() {

    elements.aiStatus.textContent =
        "AI: Awaiting connection";

    elements.analyseButton.addEventListener("click", () => {

        const question =
            elements.questionInput.value.trim();

        if (!question) {

            elements.analysisStatus.textContent =
                "Please enter a DSA question first.";

            elements.questionInput.focus();

            return;

        }

        elements.analysisStatus.textContent =
            "Question received. AI integration is pending.";

        console.log("Question submitted:", question);

    });

}


/* ============================================
   9. THEME INITIALIZATION
============================================ */

function initializeTheme() {

    document.documentElement.dataset.theme =
        appState.theme;

}


/* ============================================
   10. APPLICATION VERSION
============================================ */

function updateApplicationVersion() {

    const versionElement =
        document.getElementById("appVersion");

    if (versionElement) {

        versionElement.textContent =
            `v${APP_CONFIG.version}`;

    }

}


/* ============================================
   11. START APPLICATION
============================================ */

initializeApp();