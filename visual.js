import { state } from "./logic.js"

let canvas, ctx
const CANVAS_SIZE = 400
const CENTER = CANVAS_SIZE / 2
const RADIUS = CANVAS_SIZE * 0.4
const NODE_SIZE = 12

export function initCanvas() {
    canvas = document.getElementById("ringCanvas")
    if (!canvas) return
    ctx = canvas.getContext("2d")
}

const angleFromValue = (value) => (value / state.n) * 2 * Math.PI - Math.PI / 2
const getCoords = (value) => {
    const angle = angleFromValue(value)
    return {
        x: CENTER + RADIUS * Math.cos(angle),
        y: CENTER + RADIUS * Math.sin(angle)
    }
}

export function drawRing(currentProgress = 1) {
    if (!ctx) return
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const currentResult = state.currentStep > 0 && state.sequence.length >= state.currentStep
        ? state.sequence[state.currentStep - 1].result
        : state.startNum

    const visited = new Set([state.startNum])
    for (let i = 0; i < Math.max(0, state.currentStep); i++) {
        if (state.sequence[i]) visited.add(state.sequence[i].result)
    }

    // outer circle
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, RADIUS, 0, 2 * Math.PI)
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 1
    ctx.stroke()

    const stepsToConsider = Math.min(state.maxSteps, state.currentStep + (state.isAnimatingStep ? 1 : 0))
    for (let k = 1; k <= stepsToConsider; k++) {
        const startVal = (k === 1) ? state.startNum : state.sequence[k - 2].result
        const endVal = state.sequence[k - 1].result
        const startAngle = angleFromValue(startVal)

        let totalAngularDiff = ((endVal - startVal + state.n) % state.n) / state.n * 2 * Math.PI
        let angleProgress = 1
        let strokeStyle = "rgba(109,140,255,0.4)"
        let lineWidth = 2.5

        const isCurrentAnimatingStep = state.isAnimatingStep && (k === state.currentStep + 1)
        if (isCurrentAnimatingStep) {
            angleProgress = currentProgress
            strokeStyle = "#4f46e5"
            lineWidth = 4
            totalAngularDiff = (state.stepSize / state.n) * 2 * Math.PI
        }

        if (totalAngularDiff > 0) {
            ctx.beginPath()
            const pathRadius = RADIUS * 0.9
            const animatedAngle = startAngle + totalAngularDiff * angleProgress
            ctx.arc(CENTER, CENTER, pathRadius, startAngle, animatedAngle, false)
            ctx.strokeStyle = strokeStyle
            ctx.lineWidth = lineWidth
            ctx.stroke()

            if (isCurrentAnimatingStep && angleProgress < 1) {
                const movingX = CENTER + pathRadius * Math.cos(animatedAngle)
                const movingY = CENTER + pathRadius * Math.sin(animatedAngle)
                ctx.beginPath()
                ctx.arc(movingX, movingY, 6, 0, 2 * Math.PI)
                ctx.fillStyle = "#f97316"
                ctx.fill()
            }
        }
    }

    // nodes
    for (let i = 0; i < state.n; i++) {
        const { x, y } = getCoords(i)
        const stepToAnimate = (state.currentStep < state.maxSteps) ? state.sequence[state.currentStep] : null
        const targetVal = stepToAnimate ? stepToAnimate.result : currentResult

        const isFinalResult = i === currentResult && !state.isAnimatingStep
        const isAnimationTarget = state.isAnimatingStep && i === targetVal
        const startOfCurrentJump = (state.currentStep === 0 ? state.startNum : state.sequence[state.currentStep - 1]?.result)
        const isStartOfJump = i === startOfCurrentJump && state.isAnimatingStep
        const isVisited = visited.has(i)

        let nodeFill = "#f1f5f9"
        let nodeStroke = "#94a3b8"
        let textFill = "#1e293b"
        let nodeSize = NODE_SIZE

        if (isFinalResult || (isAnimationTarget && currentProgress === 1)) {
            nodeFill = "#4f46e5"
            nodeStroke = "#3730a3"
            textFill = "#ffffff"
            nodeSize = NODE_SIZE * 1.2
        } else if (isStartOfJump) {
            nodeFill = "#f97316"
            nodeStroke = "#c2410c"
            textFill = "#ffffff"
            nodeSize = NODE_SIZE * 1.1
        } else if (isVisited) {
            nodeFill = "#e0e7ff"
            nodeStroke = "#a5b4fc"
            if (i === state.startNum && i !== currentResult) {
                nodeFill = "#fef3c7"
                nodeStroke = "#fcd34d"
            }
        }

        ctx.beginPath()
        ctx.arc(x, y, nodeSize, 0, 2 * Math.PI)
        ctx.fillStyle = nodeFill
        ctx.strokeStyle = nodeStroke
        ctx.lineWidth = 1.5
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = textFill
        ctx.font = (isFinalResult || i === state.startNum || isStartOfJump || isAnimationTarget) ? "bold 16px Inter, sans-serif" : "14px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(i.toString(), x, y)
    }

    // center label
    const centerLabel = state.operation === "addition" ? `+${state.b}` : `×${state.a}`
    ctx.font = "bold 24px Inter, sans-serif"
    ctx.fillStyle = "#1e293b"
    ctx.fillText(centerLabel, CENTER, CENTER - 12)
    ctx.font = "16px Inter, sans-serif"
    ctx.fillStyle = "#4f46e5"
    ctx.fillText(`mod ${state.n}`, CENTER, CENTER + 18)
}
