'use strict'
/**
 * Returns a random integer from 0 to the limit requested
 * @param {number} max the maxmium upper limit
 * @returns {number} an integer between 0 and max
 */
export function getRandInt (max) {
  return Math.floor(Math.random() * max)
}

/**
 * Shuffles a given array until the order within it is random.
 * @param {Array} arr the array to shuffle
 * @returns {Array} a shuffled array
 */
export function shuffleArray (arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = getRandInt(i + 1)

    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr
}
