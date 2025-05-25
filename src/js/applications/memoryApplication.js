'use strict'
import { windowClass } from '../modules/windowClass.js'
import { Timer } from '../modules/timer.js'
import { decrypt } from '../modules/encryption.js'
import { HighscoreList } from '../modules/highscoreList.js'
import { shuffleArray } from '../modules/random.js'

export class MemoryApplication extends windowClass {
  constructor () {
    const title = 'Memory'
    const icon = '/img/MemoryAppLogo.png'
    super(title, icon)

    this.playArea = null
    this.scoreArea = null
    this.uniqueCardAmount = 9
    this.activeCard = null
    this.highlightedCard = null
    this.cards = null
    this.wait = false
    this.gameTimer = null
    this.highscorePlayerLimit = 5
    this.amountPairsTextElement = null
    this.tempUsername = 'MemoryPlayer'

    // Keep all the card images as references in an object
    this.cardImages = {
      0: '/img/MemoryApplication/0.png',
      1: '/img/MemoryApplication/1.png',
      2: '/img/MemoryApplication/2.png',
      3: '/img/MemoryApplication/3.png',
      4: '/img/MemoryApplication/4.png',
      5: '/img/MemoryApplication/5.png',
      6: '/img/MemoryApplication/6.png',
      7: '/img/MemoryApplication/7.png',
      8: '/img/MemoryApplication/8.png',
      played: '/img/MemoryApplication/played.png'
    }

    // Add a way to stop the game timer from continuing counting up after the window has been removed.
    this.exitButton.addEventListener('click', (event) => {
      if (this.gameTimer) {
        this.gameTimer.stop()
      }
    })
  }

  /**
   * Initializes the components of this window application (the neccessary elements such as playArea, scoreArea)
   * @param {boolean} recreate is used to switch between a full initialization or just a selection of it.
   */
  createWindow (recreate = false) {
    if (!recreate) {
      this.createSettingsMenu()
      this.base.setAttribute('tabindex', 0)
      this.base.focus()
      this.base.addEventListener('keydown', (event) => {
        this.keyboardMoveTile(event.key)
      })
    }
    // If recreate was true, it skipped adding the menu and button eventlistener again (leading to duplicates)
    this.playArea = document.createElement('div')
    this.playArea.setAttribute('id', 'memoryPlayArea')
    this.main.appendChild(this.playArea)
    this.createScoreArea()
    this.initializeGame()
  }

  /**
   * Reveals each of the hidden cards in the memory application.
   */
  revealCards () {
    // Retrieve all the tiles that have not been played yet (found pairs)
    const tiles = this.getTiles(false)
    tiles.forEach(tile => {
      // Edit the image source for the current card to reveal to the user which card it actually is
      // Since the image files are named 0.png, 1.png ... (tile.src will look like this example: ../img/MemoryApplication/1.png)
      // tile.src = this.imgSourceFolder + `${this.cards[tile.id]}` + '.png'
      tile.src = this.cardImages[this.cards[tile.id]]
    })
    setTimeout(() => {
      tiles.forEach(tile => {
        tile.src = this.cardImages[0]
      })

      // If the user has selected a card prior to revealing them, it shall stay revealed afterwards
      if (this.activeCard) {
        this.activeCard.src = this.cardImages[this.cards[this.activeCard.id]]
      }
    }, 1000)
  }

  /**
   * Generates a settings drop down menu in the application menubar node.
   */
  createSettingsMenu () {
    const dropdownMenu = this.createMenu()
    this.createDropdownItem(dropdownMenu, 'Reveal cards', '', () => {
      this.revealCards()
    }, false)

    this.createDropdownItem(dropdownMenu, 'Delete Highscores', '', () => {
      const highscoreList = new HighscoreList()
      highscoreList.clearHighscores('memory')
    }, false)
  }

  /**
   * A function that retrieves a selection of tiles from the collection of tiles/cards.
   * @param {boolean} played a boolean which is used to set which cards should be retrieved
   * @returns {Array} a selection of tiles
   */
  getTiles (played) {
    let tiles = Array.from(this.playArea.querySelectorAll('.MemoryCard'))
    // If played is true, return only the tiles/cards that have been played. Otherwise return only the non-played tiles/cards
    if (played) {
      tiles = tiles.filter(tile => tile.src.includes('played.png'))
    } else {
      tiles = tiles.filter(tile => !tile.src.includes('played.png'))
    }
    return tiles
  }

  /**
   * Keyboard movement functionality, it moves through the ID's of all the tiles/cards that exists within the game area.
   * @param {string} keyDirection the string that details which key was pressed
   */
  keyboardMoveTile (keyDirection) {
    // Get all the cards within the play area
    const tiles = Array.from(this.playArea.querySelectorAll('.MemoryCard'))

    if (!this.highlightedCard) {
      this.highlightedCard = tiles[0] // Take the first element in the list as starting tile, if the player hasn't chosen one yet
    }

    this.highlightedCard.classList.add('selectedCard')
    let currentId = parseInt(this.highlightedCard.id)

    let selectedTile = null

    // Use the given keydirection to move through the id's (if starting on 0, moving right would end up on ID: 1)
    switch (keyDirection) {
      case 'ArrowLeft':
        currentId = currentId - 1
        break
      case 'ArrowRight':
        currentId = currentId + 1
        break
      case 'ArrowUp':
        currentId = currentId - 4
        break
      case 'ArrowDown':
        currentId = currentId + 4
        break
      case 'Enter':
        this.checkPairs(this.highlightedCard)
        this.activeCard = this.highlightedCard
        break
    }
    // added constraint, the player cannot move outside of the maximum and minimum amount of tiles
    if (currentId >= 0 && currentId < tiles.length) {
      selectedTile = tiles[currentId]

      if (selectedTile) {
        this.highlightedCard.classList.remove('selectedCard')
        this.highlightedCard = selectedTile
        this.highlightedCard.classList.add('selectedCard')
      }
    }
  }

  /**
   * Checks whether the current card, which is provided, is a pair. It reveals the image behind the card when
   * executed, and if the player currently hasn't flipped any card yet it stores the current flipped card.
   * @param {HTMLElement} currentCard the currently revealed card that the user has chosen
   */
  checkPairs (currentCard) {
    // In order to not let other code execute (if this function is called again during its execution)
    // do nothing until wait has been set to false again
    if (!this.wait) {
      if (!currentCard.src.includes('played.png')) { // Do not let the user pick a card that is already played (found with a pair)
        // reveal the card by using its id, to get the index it resides in within the stored array of randomized cards
        currentCard.src = this.cardImages[this.cards[currentCard.id]]

        if (this.activeCard != null) {
          const previousActiveCard = this.activeCard
          if (previousActiveCard !== currentCard) {
            this.wait = true // make the other functions of the application wait until this boolean is false again

            // Keep both cards revealed for 1 second, while checking if they are pairs (or if the game has ended)
            setTimeout(() => {
              if (this.cards[previousActiveCard.id] === this.cards[currentCard.id]) {
                currentCard.src = this.cardImages.played
                previousActiveCard.src = this.cardImages.played
              } else {
                previousActiveCard.src = this.cardImages[0]
                currentCard.src = this.cardImages[0]
              }

              this.wait = false
              this.activeCard = null
              this.checkGameOver()
            }, 1000)
          }
        } else {
          this.activeCard = currentCard
        }
      }
    }
  }

  /**
   * Creates an image element that represents a tile/card used in the memory application
   * @param {number} indx the index that will serve as the ID for the new card
   */
  createCard (indx) {
    const tempCard = document.createElement('img')
    tempCard.classList.add('MemoryCard')
    tempCard.setAttribute('id', indx)

    // Add the 'hidden' card image to the current card
    tempCard.src = this.cardImages[0]

    this.playArea.appendChild(tempCard)

    tempCard.addEventListener('click', (event) => {
      this.checkPairs(tempCard)
    })
  }

  /**
   * Initializes the game by creating all the cards that the user shall try to find pairs of
   */
  initializeGame () {
    const pairsArr = []

    // Populate the pairs array with duplicates for each index (1,1,2,2,3,3...)
    for (let i = 1; i < this.uniqueCardAmount; i++) {
      pairsArr.push(i, i)
    }

    for (let i = 0; i < pairsArr.length; i++) {
      this.createCard(i)
    }
    // Randomize the order of all the values in the array
    this.cards = shuffleArray(pairsArr)
  }

  /**
   * Creates an area within the application window's footer that displays the current time duration since initialized
   */
  createScoreArea () {
    // Creates a div that shall contain the score and timer
    this.scoreArea = document.createElement('div')
    this.scoreArea.className = 'memoryScoreArea'
    this.footer.appendChild(this.scoreArea)

    const timerTextElement = document.createElement('p')
    this.gameTimer = new Timer(timerTextElement)
    this.scoreArea.append(timerTextElement)

    this.amountPairsTextElement = document.createElement('p')
    this.scoreArea.appendChild(this.amountPairsTextElement)

    this.gameTimer.start()
  }

  /**
   * Checks if the player has found all pairs and ends the game which then displays the highscore list
   * Otherwise it displays the current amount of found pairs within the application window's footer.
   */
  checkGameOver () {
    const tiles = this.getTiles(true)
    if (tiles.length >= this.cards.length) {
      this.gameTimer.stop()
      this.playArea.remove()
      this.scoreArea.remove()
      this.displayHighscores()
    } else {
      this.amountPairsTextElement.textContent = `Pairs: ${tiles.length / 2}`
    }
  }

  /**
   * Displays an area in the application window that shows the current best scores, the highscores that players have set.
   */
  displayHighscores () {
    const highscoreList = new HighscoreList(this.highscorePlayerLimit, false)
    const time = this.gameTimer.getCurrentDuration()

    // Retrieve the username in the local browser's storage
    let storedUsername = decrypt(localStorage.getItem('username'))

    if (!storedUsername) {
      // If a user has no username yet, give them a default username
      storedUsername = this.tempUsername
    }

    const player = { username: storedUsername, score: time, application: 'memory' }

    // Add the player into the highscores and display the highscore area
    highscoreList.createHighScoreArea(this, player)
  }
}
