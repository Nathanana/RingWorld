import { state, validateAndGetParams, generateSequence, getCurrentResult, resetStateForPlay } from "./logic.js"
import { drawRing } from "./visual.js"

let playPauseBtn = null
let speedSlider = null
let animateCheckbox = null
let modulusInput = null
let aInput = null
let bInput = null
let operationSelect = null
let equationDisplay = null
let modulusDisplay = null
let aDisplay = null
let bDisplay = null

export function setupControls() {
    playPauseBtn = document.getElementById("play-pause-btn")
    speedSlider = document.getElementById("speed-slider")
    animateCheckbox = document.getElementById("animate-checkbox")
    modulusInput = document.getElementById("modulus-input")
    aInput = document.getElementById("a-number-input")
    bInput = document.getElementById("b-number-input")
    operationSelect = document.getElementById("operation-select")
    equationDisplay = document.getElementById("equation-display")
    modulusDisplay = document.getElementById("modulus-display")
    aDisplay = document.getElementById("a-number-display")
    bDisplay = document.getElementById("b-number-display")

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

    if (speedSlider) {
        speedSlider.addEventListener("input", () => {
            state.animationDuration = parseInt(speedSlider.value, 10)
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
}

function handleParamChange() {
    pause()
    validateAndGetParams()
    clampInputs()
    generateSequence()
    drawRing(1)
    renderEquation()
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
        equationDisplay.innerHTML = `$$\\text{Operation: } ${totalOp} \\pmod{${state.n}}$$`
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
        equationDisplay.innerHTML = `$$\\text{Final Result: } ${totalOp} = ${sum} \\equiv ${final} \\pmod{${state.n}}$$`
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

function updatePlayButton() {
    if (!playPauseBtn) return
    const isAtMax = state.currentStep >= state.maxSteps
    if (state.isRunning) {
        playPauseBtn.innerHTML = "Pause"
        playPauseBtn.classList.remove("bg-indigo-600")
        playPauseBtn.classList.add("bg-orange-500")
    } else {
        playPauseBtn.innerHTML = isAtMax ? "Replay" : "Play"
        playPauseBtn.classList.remove("bg-orange-500")
        playPauseBtn.classList.add("bg-indigo-600")
        playPauseBtn.disabled = (state.maxSteps === 0 && state.currentStep === 0)
    }
}

function updateUI(forceProgress = 1) {
    syncDisplays()
    renderEquation()
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
    // pause periodic playback while animating
    if (state.isRunning && state.intervalId) {
        clearInterval(state.intervalId)
        state.intervalId = null
    }

    state.isAnimatingStep = true
    state.animationStartTime = 0
    state.animationDuration = parseInt(speedSlider?.value || "300", 10)

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
            // finalize step: advance currentStep
            setTimeout(() => {
                state.currentStep++
                // if still running, schedule the next step after a small delay
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
    // validation
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
    state.animationDuration = parseInt(speedSlider?.value || "300", 10)

    if (!animate) {
        state.currentStep = state.maxSteps
        state.isRunning = false
        updateUI(1)
        return
    }

    // start the first step immediately
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
    // ensure a slider max updated and value clamped
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
}
