'use strict'
/**
 * A simple pseudo-encryption that takes a string and produces a result that hides the original string behind the
 * encryption.
 * @param {string} inputStr the string that shall be manipulated into an encrypted version
 * @returns {string} the string that was encrypted
 */
export function encrypt (inputStr) {
  inputStr = new TextEncoder().encode(inputStr)
  let returnStr = ''
  // Iterate through all the characters in the input string and increment their UTF-8 value
  for (const char of inputStr) {
    returnStr += String.fromCharCode(char + 1)
  }

  returnStr = btoa(returnStr) // Encode the string into a base64 representation instead of decimal
  return returnStr
}

/**
 * A simple pseudo-decryption that takes a string and produces a result that reveals the original string behind the
 * encryption.
 * @param {string} inputStr the string that shall be manipulated into the original readable version that was once encrypted
 * @returns {string} the string that was decrypted
 */
export function decrypt (inputStr) {
  let returnStr = ''
  if (inputStr) {
    inputStr = atob(inputStr) // Decode the string from base64 into decimal

    // Initialize a byte array that is going to hold each character value
    const byteArr = new Uint8Array(inputStr.length)
    for (let i = 0; i < inputStr.length; i++) {
      byteArr[i] = (inputStr.charCodeAt(i) - 1)
    }

    // Decode the bytearray using the textDecoder (which uses a stream of bytes as input)
    returnStr = new TextDecoder().decode(byteArr)
  }
  return returnStr
}
