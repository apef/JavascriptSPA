'use strict'
import { ChatApplication } from './applications/chatApplication.js'
import { MemoryApplication } from './applications/memoryApplication.js'
import { SnakeApplication } from './applications/snakeApplication.js'
import { PaintApplication } from './applications/paintApplication.js'

const backgroundImage = '/img/DesktopPicture.jpg'
const main = document.querySelector('main')
main.style.backgroundImage = `url(${backgroundImage})`

const chatwindowGenerator = document.getElementById('ChatWindowGenerator')
chatwindowGenerator.addEventListener('click', (event) => {
  const chatApp = new ChatApplication()
  chatApp.createWindow()
})

const memorywindowgenerator = document.getElementById('MemoryWindowGenerator')
memorywindowgenerator.addEventListener('click', (event) => {
  const memoryApp = new MemoryApplication()
  memoryApp.createWindow()
})

const snakewindowgenerator = document.getElementById('SnakeWindowGenerator')
snakewindowgenerator.addEventListener('click', (event) => {
  const snakeApp = new SnakeApplication()
  snakeApp.createWindow()
})

const paintwindowgenerator = document.getElementById('PaintWindowGenerator')
paintwindowgenerator.addEventListener('click', (event) => {
  const paintApp = new PaintApplication()
  paintApp.createWindow()
})

// The local browser storage
const localStore = window.localStorage

initStorage()

const mainArea = document.querySelector('main')
mainArea.style.backgroundImage = backgroundImage

/**
 * Intializes the browser storages with the chat application chatlog
 */
function initStorage () {
  const localChatLog = localStore.getItem('chatLog')

  if (localChatLog == null) {
    localStore.setItem('chatLog', JSON.stringify([]))
  }
}
