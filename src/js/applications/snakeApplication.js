'use strict'
import { windowClass } from '../modules/windowClass.js'
import { getRandInt } from '../modules/random.js'
import { HighscoreList } from '../modules/highscoreList.js'

export class SnakeApplication extends windowClass {
  constructor () {
    const title = 'Snake'
    const icon = '/img/SnakeAppLogo.png'

    super(title, icon)

    // Represents the gameboard which will be a nested array
    this.gameBoard = null
    this.gridSize = 20
    this.gameArea = null
    this.gameInterval = null
    this.highscorePlayerLimit = 5
    this.dropdownMenu = null

    // The booleans that switches how the application functions (if it should spawn two snakes for example)
    this.twoplayermode = false
    this.endlessMode = false
    // The values that represent the different objects that can exist on the gameboard
    this.foodID = 3
    this.snakeplayer1ID = 1
    this.snakeplayer2ID = 2

    this.directions = {
      up: { x: -1, y: 0 },
      down: { x: 1, y: 0 },
      left: { x: 0, y: -1 },
      right: { x: 0, y: 1 }
    }
  }

  /**
   * Creates the window with a menu and displays the welcome screen
   */
  createWindow () {
    // if the game restarts (it re-executes this function) remove the old menu and recreate it (removes the possibility of duplicate menus)
    this.menubar.innerHTML = ''
    this.dropdownMenu = this.createMenu()
    this.createDropdownItem(this.dropdownMenu, 'Delete Highscores', '', () => {
      const highscoreList = new HighscoreList()
      highscoreList.clearHighscores('snake')
    }, false)

    this.displayWelcomeScreen()
  }

  /**
   * Displays a menu to the user where they can choose between two available gamemodes in the application
   */
  displayChooseMode () {
    const title = 'Game Modes'
    const modeText = 'Select mode'
    const button1 = 'Traditional'
    const button2 = 'Endless'

    // The first button is used to select the 'Traditional' gamemode, where the game ends if a snake hits itself or another snake
    const button1Callback = () => {
      this.displayControlScheme()
    }

    // The second button selects the 'Endless' mode where the game doesn't end but if a snake hits another snake they respawn as a new snake
    const button2Callback = () => {
      this.endlessMode = true
      this.displayControlScheme()
    }
    // Display the menu screen
    this.displaySimpleMenuScreen(title, modeText, button1, button2, button1Callback, button2Callback, true)
  }

  /**
   * Displays a welcome screen to the user where they can choose if they want to play singleplayer or local 2 player multiplayer
   */
  displayWelcomeScreen () {
    const title = 'Snake'
    const modeText = 'Select mode'
    const player1Button = '1 Player'
    const player2Button = '2 Players'

    // First button is used to select single player mode (1 player)
    const button1Callback = () => {
      this.displayChooseMode()
    }

    // Second button which is used to select 2 player local multiplayer
    const button2Callback = () => {
      this.twoplayermode = true
      this.displayChooseMode()
    }

    this.displaySimpleMenuScreen(title, modeText, player1Button, player2Button, button1Callback, button2Callback, true)
  }

  /**
   * Displays a screen that informs the user how they interact with the application (how they move the snakes)
   */
  displayControlScheme () {
    const title = 'Controls'
    const infoText = 'Player 1 moves with arrow keys. Player 2 moves with WASD'
    this.displaySimpleMenuScreen(title, infoText, '', '', '', '', false)

    // Display the screen for 3 seconds
    setTimeout(() => {
      this.initGame()
    }, 3000)
  }

  /**
   * Creates and displays a simple menu with text and buttons (if added) to the user.
   * @param {string} title the string that will be used as the title of the menu (a h1 element)
   * @param {string} menuSubText a string that is used to inform the user of the content in the menu
   * @param {string} button1Text a string that will be placed within the first button that is presented to the user
   * @param {string} button2Text a string that is placed in the second button that is presented to the user
   * @param {Function} button1Callback a function which is used within the button eventlistener of the first button
   * @param {Function} button2Callback a function for the second button's eventlistener
   * @param {boolean} addButtons a boolean that dictates whether the menu shall contain any clickable buttons
   */
  displaySimpleMenuScreen (title, menuSubText, button1Text, button2Text, button1Callback, button2Callback, addButtons = false) {
    this.main.innerHTML = ''
    const gameMenuBox = document.createElement('div')
    gameMenuBox.className = 'SnakeGameMenuBox'
    const gameTitleText = document.createElement('h1')
    gameTitleText.textContent = title

    const gameWelcomeText = document.createElement('p')
    gameWelcomeText.textContent = menuSubText
    gameMenuBox.appendChild(gameTitleText)
    gameMenuBox.appendChild(gameWelcomeText)

    if (addButtons) {
      const onePlayerButton = document.createElement('button')
      const twoPlayerButton = document.createElement('button')

      onePlayerButton.textContent = button1Text
      twoPlayerButton.textContent = button2Text

      // Add an eventlistener that performs the provided function
      onePlayerButton.addEventListener('click', (event) => {
        button1Callback()
      })

      twoPlayerButton.addEventListener('click', (event) => {
        button2Callback()
      })

      gameMenuBox.appendChild(onePlayerButton)
      gameMenuBox.appendChild(twoPlayerButton)
    }

    this.main.appendChild(gameMenuBox)
  }

  /**
   * Updates the application window with a drawn scoreboard, gameboard and moves the snake each time it is called upon
   * @param {object} applicationWindow the current window that contains the items that shall be updated.
   */
  update (applicationWindow) {
    if (applicationWindow.base.classList.contains('active')) {
      applicationWindow.drawScoreBoard()
      applicationWindow.moveSnake()
      applicationWindow.drawBoard()
    }
  }

  /**
   * Draws the gameboard visually to the player. Each index in the nested array that is used as the gameboard is given
   * a div with a classname in order to be regarded as a 'cell' which can separate it visually from other cells given the CSS styling it has.
   */
  drawBoard () {
    this.gameArea.innerHTML = '' // Clears the main game area of the window

    // loops through the gameboard (nested array) and creates div elements for each index
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const cell = document.createElement('div')
        cell.className = 'cell'

        // Depending on the values in the gameboard, they are given different classnames (the CSS styling can then differentiate them visually)
        if (this.gameBoard[i][j] === 1) {
          cell.className = 'player1snake'
        }

        if (this.gameBoard[i][j] === 2) {
          cell.className = 'player2snake'
        }

        if (this.gameBoard[i][j] === 3) {
          cell.className = 'food'
        }
        this.gameArea.appendChild(cell)
      }
    }
  }

  /**
   * Inserts a string in the window footer which represents the amount of score a player has during gameplay
   */
  drawScoreBoard () {
    if (this.twoplayermode) {
      const scores = []
      this.snakes.forEach(snake => {
        scores.push(snake.head.length)
      })
      this.footer.innerHTML = `Player1 score: ${scores[0] - 1} Player2 score: ${scores[1] - 1}`
    } else {
      const snake = this.snakes[0]
      this.footer.innerHTML = `Score: ${snake.head.length - 1}`
    }
  }

  /**
   * Ends the game by stopping the game from continuing updating and then displays a list of highscores.
   */
  endGame () {
    clearInterval(this.gameInterval)
    const highScoreList = new HighscoreList(this.highscorePlayerLimit, true)

    this.snakes.forEach(snake => {
      const score = snake.head.length
      const snakeID = snake.id
      highScoreList.createHighScoreArea(this, { username: `snakePlayer${snakeID}`, score, application: 'snake' })
    })
  }

  /**
   * Initializes the game by creating the neccessary variables such as the gameboard, snake and food (item to collect)
   * Also starts the interval that updates the game each time it reoccurs.
   */
  initGame () {
    // Adding a drop down item in the drop down menu where a user can end the game when clicked
    this.createDropdownItem(this.dropdownMenu, 'End session', '', () => {
      this.endGame()
    }, false)

    this.main.innerHTML = ''
    this.gameBoard = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(0))
    this.gameArea = document.createElement('div')
    this.gameArea.className = 'SnakeGameArea'

    if (this.twoplayermode) {
      this.snakes = [this.createSnake(this.snakeplayer1ID), this.createSnake(this.snakeplayer2ID)]
    } else {
      this.snakes = [this.createSnake(this.snakeplayer1ID)]
    }

    this.base.setAttribute('tabindex', 0)
    this.base.focus()
    this.base.addEventListener('keydown', (event) => {
      this.changeDirection(event.key)
    })
    this.main.appendChild(this.gameArea)

    this.gameInterval = setInterval(() => this.update(this), 200)

    this.exitButton.addEventListener('click', (event) => {
      clearInterval(this.gameInterval)
    })

    this.spawnFood()
    this.drawBoard()
  }

  /**
   * Changes the direction of where the snake moves towards
   * @param {string} keyDirection a string that details the name of a key that was captured by a keydown event listener
   */
  changeDirection (keyDirection) {
    // Depending on the key that was pressed, get the corresponding snake ID value
    const keyMappings = {
      ArrowUp: 0, // First snake (Arrow keys for snake 1)
      ArrowDown: 0,
      ArrowLeft: 0,
      ArrowRight: 0,
      w: 1, // Second snake (WASD for snake 2)
      s: 1,
      a: 1,
      d: 1
    }

    const snake = this.snakes[keyMappings[keyDirection]]
    let newDirection = null

    if (snake) {
      switch (keyDirection) {
        case 'w':
        case 'ArrowUp':
          newDirection = this.directions.up
          break
        case 's':
        case 'ArrowDown':
          newDirection = this.directions.down
          break
        case 'a':
        case 'ArrowLeft':
          newDirection = this.directions.left
          break
        case 'd':
        case 'ArrowRight':
          newDirection = this.directions.right
          break
        default:
          newDirection = snake.direction
          break
      }
      if ((snake.direction.x + newDirection.x !== 0)) {
        snake.direction = newDirection
      }
    }
  }

  /**
   * Generates a random set of values from the given constraints (upper and lower bound). The values serve as
   * 'coordinates' to form a spawnpoint.
   * @param {number} max the maximum upper bound limit
   * @param {number} lowBound the minimum lower bound limit
   * @returns {object} an object with the random coordinates that serves as a spawn point
   */
  getSpawnPoint (max, lowBound = 0) {
    const spawnPointX = getRandInt(max) + lowBound
    const spawnPointY = getRandInt(max) + lowBound
    return { x: spawnPointX, y: spawnPointY }
  }

  /**
   * Inserts the item that players try to collect in Snake. It inserts the item on a random given point on the
   * game board (random X and Y coordinates)
   */
  spawnFood () {
    let canSpawn = true
    // Check if a snake is occupying all the cells in the grid (which would make spawning the food not possible and loop forever)
    this.snakes.forEach(snake => {
      if (snake.head.length === this.gridSize - 1) {
        canSpawn = false
      }
    })

    if (canSpawn) {
      this.currentFoodLocation = this.getSpawnPoint(this.gridSize - 1)
      while ((this.gameBoard[this.currentFoodLocation.x][this.currentFoodLocation.y] === this.snakeplayer1ID || this.gameBoard[this.currentFoodLocation.x][this.currentFoodLocation.y] === this.snakeplayer2ID)) {
        this.spawnFood()
      }

      this.gameBoard[this.currentFoodLocation.x][this.currentFoodLocation.y] = this.foodID
    }
  }

  /**
   * Creates a snake object with a random spawn point in the nested array gameboard
   * @param {number} id the value that will represent the snake in the nested array gameboard
   * @returns {object} a snake object with a head, id and a default direction (up)
   */
  createSnake (id) {
    const snakeSpawnPoint = this.getSpawnPoint(10, 5)
    // Get the attributes from the directions object (get all the possible keys) (result: Array: ['up', 'down', 'left','right'])
    const directionsKeys = Object.keys(this.directions)

    // The keys can then be used to get a random value from the directions object, by choosing a random key
    const randomDirection = this.directions[directionsKeys[getRandInt(directionsKeys.length)]]
    return {
      head: [snakeSpawnPoint],
      id,
      direction: randomDirection
    }
  }

  /**
   * Removes a snake from the gameboard, by setting all the positions where a segment resided, into 0.
   * @param {object} snake the current snake object
   */
  resetSnake (snake) {
    // Go through all the snake's segments and set the gameboards value at that position to be 0 (a normal cell)
    snake.head.forEach(snakeSegment => {
      this.gameBoard[snakeSegment.x][snakeSegment.y] = 0
    })
    // Remove the segments
    snake.head = []
  }

  /**
   * Detects if the snake has collided with the 'walls' of the grid (the maximum or minimum value possible for an index in the nested array)
   * Also detects if the snake has collided with itself or another player. If a collision with self or another snake is detected it ends the game.
   * @param {object} snake the object that contains the X and Y coordinates of a specific segment of the snake
   */
  detectCollision (snake) {
    const snakeSegment = snake.head[0]

    // Detects whether the head of a snake has hit the grid.
    // If the snake did hit the grid, the head of the snake should be set to the grid's opposite value
    // (If met the minimum, 0, the snake will appear at the maximum gridsize position instead)
    if (snakeSegment.x < 0) {
      snakeSegment.x = this.gridSize - 1
    } else if (snakeSegment.x >= this.gridSize) {
      snakeSegment.x = 0
    }

    if (snakeSegment.y < 0) {
      snakeSegment.y = this.gridSize - 1
    } else if (snakeSegment.y >= this.gridSize) {
      snakeSegment.y = 0
    }

    // If the game is not in endless mode, it ends when a snake has either hit another snake or itself.
    if (!this.endlessMode) {
      if (this.gameBoard[snakeSegment.x][snakeSegment.y] === this.snakeplayer1ID || this.gameBoard[snakeSegment.x][snakeSegment.y] === this.snakeplayer2ID) {
        this.endGame()
      }
    } else {
      // In endless mode each snake respawns and has to begin collecting score's from the beginning again, when it hits another snake
      if (snake.id === this.snakeplayer1ID && this.gameBoard[snakeSegment.x][snakeSegment.y] === this.snakeplayer2ID) {
        this.resetSnake(snake)
        this.snakes[0] = this.createSnake(this.snakeplayer1ID)
      }

      if (snake.id === this.snakeplayer2ID && this.gameBoard[snakeSegment.x][snakeSegment.y] === this.snakeplayer1ID) {
        this.resetSnake(snake)
        this.snakes[1] = this.createSnake(this.snakeplayer2ID)
      }
    }
  }

  /**
   * Moves the snake on the gameboard by adding the X and Y coordinates with the current direction it is heading towards
   *
   */
  moveSnake () {
    this.snakes.forEach(snake => {
      // Position 2
      const prevSnakeHead = snake.head[0]

      // Create a new head for the snake based on the new location it resides in when added with the direction it was heading towards
      const newSnakeHead = { x: prevSnakeHead.x + snake.direction.x, y: prevSnakeHead.y + snake.direction.y }
      snake.head.unshift(newSnakeHead) // Insert the new head at the first index in the array (prepending)

      this.detectCollision(snake)

      if (snake.head.length > 0) {
        if (this.gameBoard[newSnakeHead.x][newSnakeHead.y] === this.foodID) {
          this.spawnFood()
        } else {
          // If a piece of food was not found, remove the last segment of the snake (otherwise it keeps growing)
          const tail = snake.head.pop()
          this.gameBoard[tail.x][tail.y] = 0 // reset the board location that the segment previously was in, with a normal cell
        }

        // Edit the gamboard to represent the snake in all the cells that a segment of the snake resides in
        snake.head.forEach(snakeSegment => {
          this.gameBoard[snakeSegment.x][snakeSegment.y] = snake.id
        })
      }
    })
  }
}
