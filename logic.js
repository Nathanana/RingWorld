export const state = {
    n: 5,
    a: 0,
    b: 3,
    operation: "addition",
    sequence: [],
    startNum: 0,
    stepSize: 0,
    maxSteps: 0,
    currentStep: 0,
    // animation control (shared)
    isRunning: false,
    isAnimatingStep: false,
    animationDuration: 300,
    animationStartTime: 0,
    animationFrameId: null,
    intervalId: null
}

export function validateAndGetParams() {
    const modEl = document.getElementById("modulus-input")
    const aEl = document.getElementById("a-number-input")
    const bEl = document.getElementById("b-number-input")
    const opEl = document.getElementById("operation-select")

    const modulusVal = parseInt(modEl?.value || "5", 10)
    const aVal = parseInt(aEl?.value || "0", 10)
    const bVal = parseInt(bEl?.value || "0", 10)
    const opVal = opEl?.value || "addition"

    if (!Number.isInteger(modulusVal) || modulusVal < 2) {
        state.n = 5
    } else {
        state.n = modulusVal
    }

    // clamp a to [0, n-1]
    const aClamped = Number.isInteger(aVal) ? Math.max(0, Math.min(aVal, state.n - 1)) : 0
    state.a = aClamped

    state.b = Number.isInteger(bVal) ? Math.max(0, bVal) : 0
    state.operation = opVal
    // ensure UI sliders reflect any clamping done here (ui will call syncDisplays)
    return true
}

export function generateSequence() {
    state.sequence = []
    state.currentStep = 0

    if (state.operation === "addition") {
        state.startNum = state.a
        state.stepSize = state.b

        if (state.b === 0) {
            state.maxSteps = 0
            return
        }

        const sum = BigInt(state.a) + BigInt(state.b)
        const result = Number(sum % BigInt(state.n))

        state.sequence.push({
            k: 1,
            calc_a: state.a,
            calc_b: state.b,
            sum: sum.toString(),
            result
        })
        state.maxSteps = 1
        return
    }

    if (state.operation === "multiplication") {
        state.startNum = 0
        state.stepSize = state.a
        let total = BigInt(0)
        const limit = 1000
        for (let k = 1; k <= state.b && k <= limit; k++) {
            total += BigInt(state.a)
            state.sequence.push({
                k,
                calc_a: state.a,
                calc_b: k,
                sum: total.toString(),
                result: Number(total % BigInt(state.n))
            })
        }
        state.maxSteps = state.sequence.length
    }
}

export function getCurrentResult() {
    if (state.currentStep === 0) return state.startNum
    return state.sequence[state.currentStep - 1]?.result ?? state.startNum
}

export function gotoStep(k) {
    state.currentStep = Math.max(0, Math.min(k, state.maxSteps))
}

export function resetStateForPlay() {
    gotoStep(0)
    state.isRunning = false
    state.isAnimatingStep = false
    state.animationStartTime = 0
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId)
        state.animationFrameId = null
    }
    if (state.intervalId) {
        clearInterval(state.intervalId)
        state.intervalId = null
    }
}
