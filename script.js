import { setupControls, syncDisplays } from "./ui.js"
import { initCanvas, drawRing } from "./visual.js"
import { validateAndGetParams, generateSequence, state } from "./logic.js"

window.onload = () => {
    initCanvas()
    validateAndGetParams()
    generateSequence()
    syncDisplays()
    drawRing(1)
    setupControls()
}