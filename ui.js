import { state, validateAndGetParams, generateSequence, getCurrentResult, resetStateForPlay } from "./logic.js"
import { drawRing } from "./visual.js"

let playPauseBtn = null
let speedSlider = null
let speedDisplay = null
let animateCheckbox = null
let modulusInput = null
let aInput = null
let bInput = null
let operationSelect = null
let modeSelect = null
let equationDisplay = null
let modulusDisplay = null
let aDisplay = null
let bDisplay = null
let stepCounter = null
let stepBackBtn = null
let stepForwardBtn = null

export function setupControls() {
    playPauseBtn = document.getElementById("play-pause-btn")
    speedSlider = document.getElementById("speed-slider")
    speedDisplay = document.getElementById("speed-display")
    animateCheckbox = document.getElementById("animate-checkbox")
    modulusInput = document.getElementById("modulus-input")
    aInput = document.getElementById("a-number-input")
    bInput = document.getElementById("b-number-input")
    operationSelect = document.getElementById("operation-select")
    modeSelect = document.getElementById("mode-select")
    equationDisplay = document.getElementById("equation-display")
    modulusDisplay = document.getElementById("modulus-display")
    aDisplay = document.getElementById("a-number-display")
    bDisplay = document.getElementById("b-number-display")
    stepCounter = document.getElementById("step-counter")
    stepBackBtn = document.getElementById("step-back-btn")
    stepForwardBtn = document.getElementById("step-forward-btn")

    if (modulusInput) {
        modulusInput.addEventListener("input", (e) => {
            modulusDisplay.textContent = e.target.value
        })
        modulusInput.addEventListener("change", () => {
            state.n = parseInt(modulusInput.value, 10)
            handleParamChange()
        })
    }

    if (aInput) {
        aInput.addEventListener("input", (e) => {
            aDisplay.textContent = e.target.value
        })
        aInput.addEventListener("change", () => {
            state.a = parseInt(aInput.value, 10)
            handleParamChange()
        })
    }

    if (bInput) {
        bInput.addEventListener("input", (e) => {
            bDisplay.textContent = e.target.value
        })
        bInput.addEventListener("change", () => {
            state.b = parseInt(bInput.value, 10)
            handleParamChange()
        })
    }

    if (operationSelect) {
        operationSelect.addEventListener("change", () => {
            state.operation = operationSelect.value
            handleParamChange()
        })
    }

    if (modeSelect) {
        modeSelect.addEventListener("change", () => {
            state.mode = modeSelect.value
            handleParamChange()
        })
    }

    if (speedSlider) {
        speedSlider.addEventListener("input", () => {
            state.animationDuration = parseInt(speedSlider.value, 10)
            updateSpeedDisplay()
            pause()
        })
    }

    if (animateCheckbox) {
        animateCheckbox.addEventListener("change", () => pause())
    }

    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", () => {
            state.isRunning ? pause() : play()
        })
    }

    if (stepBackBtn) {
        stepBackBtn.addEventListener("click", () => stepBack())
    }

    if (stepForwardBtn) {
        stepForwardBtn.addEventListener("click", () => stepForward())
    }

    const exampleBtns = document.querySelectorAll(".example-btn")
    exampleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const n = parseInt(btn.dataset.n, 10)
            const a = parseInt(btn.dataset.a, 10)
            const b = parseInt(btn.dataset.b, 10)
            const op = btn.dataset.op
            const mode = btn.dataset.mode || "numeric"
            
            loadExample(n, a, b, op, mode)
        })
    })

    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return
        if (e.code === "Space") {
            e.preventDefault()
            playPauseBtn?.click()
        } else if (e.code === "ArrowRight") {
            e.preventDefault()
            stepForward()
        } else if (e.code === "ArrowLeft") {
            e.preventDefault()
            stepBack()
        }
    })

    updateSpeedDisplay()
}

function loadExample(n, a, b, op, mode = "numeric") {
    pause()
    
    state.n = n
    state.a = a
    state.b = b
    state.operation = op
    state.mode = mode
    
    modulusInput.value = n
    aInput.value = a
    bInput.value = b
    operationSelect.value = op
    modeSelect.value = mode
    
    syncDisplays()
    clampInputs()
    validateAndGetParams()
    generateSequence()
    state.currentStep = 0
    drawRing(1)
    renderEquation()
    updateStepCounter()
}

function updateSpeedDisplay() {
    if (!speedDisplay || !speedSlider) return
    const speed = parseInt(speedSlider.value, 10)
    if (speed <= 200) speedDisplay.textContent = "Fast"
    else if (speed <= 500) speedDisplay.textContent = "Medium"
    else speedDisplay.textContent = "Slow"
}

function handleParamChange() {
    pause()
    validateAndGetParams()
    clampInputs()
    generateSequence()
    drawRing(1)
    renderEquation()
    updateStepCounter()
}

function clampInputs() {
    if (!aInput || !modulusInput) return
    const newMax = state.n - 1
    aInput.max = newMax
    if (parseInt(aInput.value || "0", 10) > newMax) {
        aInput.value = newMax
        aDisplay.textContent = newMax
        state.a = newMax
    }
}

export function syncDisplays() {
    modulusDisplay && (modulusDisplay.textContent = String(state.n))
    aDisplay && (aDisplay.textContent = String(state.a))
    bDisplay && (bDisplay.textContent = String(state.b))
    if (modulusInput) modulusInput.value = String(state.n)
    if (aInput) aInput.value = String(state.a)
    if (bInput) bInput.value = String(state.b)
}

function renderEquation() {
    if (!equationDisplay) return
    if (state.maxSteps === 0) {
        let finalResult = 0
        if (state.operation === "addition" && state.b === 0) finalResult = state.a
        else if (state.operation === "multiplication" && (state.a === 0 || state.b === 0)) finalResult = 0
        const finalOp = state.operation === "addition" ? `${state.a} + ${state.b}` : `${state.a} \\cdot ${state.b}`
        equationDisplay.innerHTML = `$$\\text{Result: } ${finalOp} \\equiv ${finalResult} \\pmod{${state.n}}$$`
    } else if (state.currentStep === 0) {
        const totalOp = state.operation === "addition" ? `${state.a} + ${state.b}` : `${state.a} \\cdot ${state.b}`
        equationDisplay.innerHTML = `$$\\text{Computing: } ${totalOp} \\pmod{${state.n}}$$`
    } else if (state.currentStep > 0 && state.sequence[state.currentStep - 1]) {
        const stepData = state.sequence[state.currentStep - 1]
        if (state.operation === "addition") {
            equationDisplay.innerHTML = `$$ ${state.a} + ${state.b} = ${stepData.sum} \\equiv ${stepData.result} \\pmod{${state.n}}$$`
        } else {
            equationDisplay.innerHTML = `$$ ${state.a} \\cdot ${stepData.k} = ${stepData.sum} \\equiv ${stepData.result} \\pmod{${state.n}}$$`
        }
    } else if (state.currentStep >= state.maxSteps) {
        const final = state.sequence[state.maxSteps - 1]?.result ?? 0
        const totalOp = state.operation === "addition" ? `${state.a} + ${state.b}` : `${state.a} \\cdot ${state.b}`
        const sum = state.sequence[state.maxSteps - 1]?.sum ?? 0
        equationDisplay.innerHTML = `$$\\text{Final: } ${totalOp} = ${sum} \\equiv ${final} \\pmod{${state.n}}$$`
    }

    if (typeof renderMathInElement !== "undefined") {
        renderMathInElement(equationDisplay, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false }
            ]
        })
    }
}

function updateStepCounter() {
    if (!stepCounter) return
    if (state.maxSteps === 0) {
        stepCounter.textContent = "No steps needed"
    } else {
        stepCounter.textContent = `Step ${state.currentStep} of ${state.maxSteps}`
    }
}

function updatePlayButton() {
    if (!playPauseBtn) return
    const isAtMax = state.currentStep >= state.maxSteps
    if (state.isRunning) {
        playPauseBtn.innerHTML = "Pause"
        playPauseBtn.classList.remove("from-purple-600", "to-indigo-600")
        playPauseBtn.classList.add("from-orange-500", "to-red-500")
    } else {
        playPauseBtn.innerHTML = isAtMax ? "Replay" : "Play"
        playPauseBtn.classList.remove("from-orange-500", "to-red-500")
        playPauseBtn.classList.add("from-purple-600", "to-indigo-600")
        playPauseBtn.disabled = (state.maxSteps === 0 && state.currentStep === 0)
    }
}

function updateUI(forceProgress = 1) {
    syncDisplays()
    renderEquation()
    updateStepCounter()
    drawRing(forceProgress)
    updatePlayButton()
}

function stepForward() {
    if (state.currentStep < state.maxSteps && !state.isAnimatingStep) {
        startNextStepAnimation()
    }
}

function stepBack() {
    if (state.currentStep > 0 && !state.isAnimatingStep) {
        state.currentStep--
        updateUI(1)
    }
}

function startNextStepAnimation() {
    if (state.isAnimatingStep || state.currentStep >= state.maxSteps) {
        pause()
        return
    }
    if (state.isRunning && state.intervalId) {
        clearInterval(state.intervalId)
        state.intervalId = null
    }

    state.isAnimatingStep = true
    state.animationStartTime = 0
    state.animationDuration = parseInt(speedSlider?.value || "400", 10)

    const animateStep = (timestamp) => {
        if (!state.animationStartTime) state.animationStartTime = timestamp
        const elapsed = timestamp - state.animationStartTime
        const progress = Math.min(1, elapsed / state.animationDuration)
        updateUI(progress)
        if (progress < 1) {
            state.animationFrameId = requestAnimationFrame(animateStep)
        } else {
            state.isAnimatingStep = false
            state.animationStartTime = 0
            if (state.animationFrameId) {
                cancelAnimationFrame(state.animationFrameId)
                state.animationFrameId = null
            }
            setTimeout(() => {
                state.currentStep++
                if (state.isRunning && state.currentStep < state.maxSteps) {
                    state.intervalId = setTimeout(() => startNextStepAnimation(), 50)
                } else {
                    updateUI(1)
                }
            }, 0)
        }
    }

    state.animationFrameId = requestAnimationFrame(animateStep)
    updateUI(0)
}

function play() {
    validateAndGetParams()
    clampAfterParamChange()
    generateSequence()
    if (state.maxSteps === 0) {
        updateUI(1)
        return
    }
    if (state.currentStep >= state.maxSteps) state.currentStep = 0
    state.isRunning = true
    updateUI(1)

    const animate = animateCheckbox?.checked ?? true
    state.animationDuration = parseInt(speedSlider?.value || "400", 10)

    if (!animate) {
        state.currentStep = state.maxSteps
        state.isRunning = false
        updateUI(1)
        return
    }

    startNextStepAnimation()
}

function pause() {
    state.isRunning = false
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId)
        state.animationFrameId = null
    }
    if (state.intervalId) {
        clearTimeout(state.intervalId)
        state.intervalId = null
    }
    state.isAnimatingStep = false
    updateUI(1)
}

function clampAfterParamChange() {
    const aEl = document.getElementById("a-number-input")
    if (!aEl) return
    const newMax = state.n - 1
    aEl.max = newMax
    if (parseInt(aEl.value || "0", 10) > newMax) {
        aEl.value = newMax
        state.a = newMax
    }
}

export function resetAll() {
    pause()
    validateAndGetParams()
    clampAfterParamChange()
    generateSequence()
    state.currentStep = 0
    updateUI(1)
    renderEquation()
    updateStepCounter()
}