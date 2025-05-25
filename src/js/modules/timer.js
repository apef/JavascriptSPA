'use strict'
/**
 * A pseudo-timer that checks the time taken each interval
 * @param outputElement the element which recieves the time taken
 */
export class Timer {
  constructor (outputElement) {
    this.currentTime = 0
    this.outputElement = outputElement
    this.timer = null
  }

  start () {
    const startTime = new Date().getTime() / 1000
    // Each second, check how much time has passed since initialization and output it to the given outputElement
    this.timer = setInterval(() => {
      const deltaTime = Math.round(((new Date().getTime() / 1000) - startTime))
      this.currentTime = deltaTime
      this.outputElement.innerHTML = `Time taken: ${deltaTime} seconds`
    }, 1000)
    return this.timer
  }

  stop () {
    clearInterval(this.gameTimer)
  }

  getCurrentDuration () {
    return this.currentTime
  }
}
