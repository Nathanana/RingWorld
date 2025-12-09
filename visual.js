import { state } from "./logic.js"

let canvas, ctx
const CANVAS_SIZE = 500
const CENTER = CANVAS_SIZE / 2
const RADIUS = CANVAS_SIZE * 0.38
const NODE_SIZE = 16

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

    const ringGradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ringGradient.addColorStop(0, "#667eea")
    ringGradient.addColorStop(1, "#764ba2")
    
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, RADIUS, 0, 2 * Math.PI)
    ctx.strokeStyle = ringGradient
    ctx.lineWidth = 3
    ctx.stroke()

    const stepsToConsider = Math.min(state.maxSteps, state.currentStep + (state.isAnimatingStep ? 1 : 0))
    for (let k = 1; k <= stepsToConsider; k++) {
        const startVal = (k === 1) ? state.startNum : state.sequence[k - 2].result
        const endVal = state.sequence[k - 1].result
        const startAngle = angleFromValue(startVal)

        let totalAngularDiff = ((endVal - startVal + state.n) % state.n) / state.n * 2 * Math.PI
        let angleProgress = 1
        let strokeStyle = "rgba(102, 126, 234, 0.4)"
        let lineWidth = 4

        const isCurrentAnimatingStep = state.isAnimatingStep && (k === state.currentStep + 1)
        if (isCurrentAnimatingStep) {
            angleProgress = currentProgress
            strokeStyle = "#667eea"
            lineWidth = 6
            totalAngularDiff = (state.stepSize / state.n) * 2 * Math.PI
        }

        if (totalAngularDiff > 0) {
            ctx.beginPath()
            const pathRadius = RADIUS * 0.85
            const animatedAngle = startAngle + totalAngularDiff * angleProgress
            ctx.arc(CENTER, CENTER, pathRadius, startAngle, animatedAngle, false)
            ctx.strokeStyle = strokeStyle
            ctx.lineWidth = lineWidth
            ctx.lineCap = "round"
            ctx.stroke()

            if (isCurrentAnimatingStep && angleProgress < 1) {
                const movingX = CENTER + pathRadius * Math.cos(animatedAngle)
                const movingY = CENTER + pathRadius * Math.sin(animatedAngle)
                
                ctx.beginPath()
                ctx.arc(movingX, movingY, 12, 0, 2 * Math.PI)
                ctx.fillStyle = "rgba(251, 191, 36, 0.3)"
                ctx.fill()
                
                ctx.beginPath()
                ctx.arc(movingX, movingY, 8, 0, 2 * Math.PI)
                const dotGradient = ctx.createRadialGradient(movingX, movingY, 0, movingX, movingY, 8)
                dotGradient.addColorStop(0, "#fbbf24")
                dotGradient.addColorStop(1, "#f59e0b")
                ctx.fillStyle = dotGradient
                ctx.fill()
                
                ctx.strokeStyle = "white"
                ctx.lineWidth = 2
                ctx.stroke()
            }
        }
    }

    for (let i = 0; i < state.n; i++) {
        const { x, y } = getCoords(i)
        const stepToAnimate = (state.currentStep < state.maxSteps) ? state.sequence[state.currentStep] : null
        const targetVal = stepToAnimate ? stepToAnimate.result : currentResult

        const isFinalResult = i === currentResult && !state.isAnimatingStep
        const isAnimationTarget = state.isAnimatingStep && i === targetVal
        const startOfCurrentJump = (state.currentStep === 0 ? state.startNum : state.sequence[state.currentStep - 1]?.result)
        const isStartOfJump = i === startOfCurrentJump && state.isAnimatingStep
        const isVisited = visited.has(i)

        let nodeFill, nodeStroke, textFill, nodeSize

        if (isFinalResult || (isAnimationTarget && currentProgress === 1)) {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, NODE_SIZE * 1.4)
            grad.addColorStop(0, "#8b5cf6")
            grad.addColorStop(1, "#6366f1")
            nodeFill = grad
            nodeStroke = "#4f46e5"
            textFill = "#ffffff"
            nodeSize = NODE_SIZE * 1.4
            
            ctx.shadowColor = "#8b5cf6"
            ctx.shadowBlur = 15
        } else if (isStartOfJump) {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, NODE_SIZE * 1.2)
            grad.addColorStop(0, "#fbbf24")
            grad.addColorStop(1, "#f59e0b")
            nodeFill = grad
            nodeStroke = "#d97706"
            textFill = "#ffffff"
            nodeSize = NODE_SIZE * 1.2
            
            ctx.shadowColor = "#fbbf24"
            ctx.shadowBlur = 10
        } else if (isVisited) {
            nodeFill = "#ddd6fe"
            nodeStroke = "#a78bfa"
            textFill = "#4c1d95"
            nodeSize = NODE_SIZE
            if (i === state.startNum && i !== currentResult) {
                nodeFill = "#fef3c7"
                nodeStroke = "#fbbf24"
                textFill = "#92400e"
            }
            ctx.shadowBlur = 0
        } else {
            nodeFill = "#ffffff"
            nodeStroke = "#cbd5e1"
            textFill = "#475569"
            nodeSize = NODE_SIZE
            ctx.shadowBlur = 0
        }

        ctx.beginPath()
        ctx.arc(x, y, nodeSize, 0, 2 * Math.PI)
        ctx.fillStyle = nodeFill
        ctx.strokeStyle = nodeStroke
        ctx.lineWidth = 3
        ctx.fill()
        ctx.stroke()
        
        ctx.shadowBlur = 0

        ctx.fillStyle = textFill
        ctx.font = (isFinalResult || isStartOfJump || isAnimationTarget) 
            ? "bold 18px Inter" 
            : "600 16px Inter"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(i.toString(), x, y)
    }

    const centerLabel = state.operation === "addition" 
        ? `${state.a} + ${state.b}` 
        : `${state.a} × ${state.b}`
    ctx.font = "bold 32px Inter"
    const labelGradient = ctx.createLinearGradient(CENTER - 50, CENTER - 20, CENTER + 50, CENTER + 20)
    labelGradient.addColorStop(0, "#667eea")
    labelGradient.addColorStop(1, "#764ba2")
    ctx.fillStyle = labelGradient
    ctx.fillText(centerLabel, CENTER, CENTER - 15)
    
    ctx.font = "600 20px Inter"
    ctx.fillStyle = "#8b5cf6"
    ctx.fillText(`mod ${state.n}`, CENTER, CENTER + 20)
}