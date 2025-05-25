'use strict'
import { windowClass } from '../modules/windowClass.js'

export class PaintApplication extends windowClass {
  constructor () {
    const title = 'Paint'
    const icon = '/img/PaintAppLogo.png'

    super(title, icon)

    this.localStorage = window.localStorage
    this.grid = null
    this.colorsArea = null
    this.gridSize = 20
    this.selectedColor = 2 // The current selected color, a value that is used to retrieve a color string from an object of color strings
    this.isMouseDown = false // Check if the left mouse button is held down

    // All the possible colors (each value is a string that can be used as CSS styling colors)
    this.colors = {
      0: 'white',
      1: 'black',
      2: 'red',
      3: 'blue',
      4: 'green',
      5: 'yellow',
      6: 'purple',
      7: 'pink',
      8: 'brown',
      9: 'gray',
      10: 'silver',
      11: 'gold'
    }
  }

  /**
   * Initiates the application window and adds neccessary event listeners prior to displaying the paint grid to the user
   */
  createWindow () {
    // Event listeners that listens to if the left mouse button is held down or not
    this.main.addEventListener('mousedown', () => {
      this.isMouseDown = true
    })

    this.main.addEventListener('mouseup', () => {
      this.isMouseDown = false
    })

    this.createSettingsMenu()
    this.initGrid()
    this.createSelectColorArea()
  }

  /**
   * Creates a drop down menu below the application window's header.
   */
  createSettingsMenu () {
    this.paintSectionWrapper = document.createElement('div')
    this.paintSectionWrapper.className = 'paintSection'

    const dropdownMenu = this.createMenu()

    this.createDropdownItem(dropdownMenu, 'Save Image', '', () => {
      this.displayPopupWindow('Save Image')
    }, false)

    this.createDropdownItem(dropdownMenu, 'Load Image', '', () => {
      this.loadImage()
    }, false)

    this.createDropdownItem(dropdownMenu, 'Clear grid', '', () => {
      this.grid = null
      this.initGrid()
    }, false)
  }

  /**
   * Creates a small window that is positioned in the center of a div, above other elements.
   * It represents a 'pop-up' window and provides the user with a set of interactable elements.
   * @param {string} title a string that will be displayed as a title for the div element that is created
   * @param {object} content a list of objects that represents saved images, with names and corresponding nested arrays
   */
  displayPopupWindow (title, content = null) {
    const popUpBox = document.createElement('div')
    popUpBox.className = 'popUp'

    const titleTextElement = document.createElement('h2')
    titleTextElement.textContent = title
    popUpBox.appendChild(titleTextElement)

    // A HTMLElement div that will contain buttons that a user can click to confirm or cancel their choices
    const userChoiceBox = document.createElement('div')
    userChoiceBox.className = 'rowFlex'

    // If saved images were provided, create button elements that each contains the name of a saved image
    if (content) {
      const imageButtonsBox = document.createElement('div')
      imageButtonsBox.className = 'popUpImageButtons'

      // Create a button with the name of a saved image
      content.forEach(element => {
        const button = document.createElement('button')
        button.textContent = element.name

        // if the button is pressed, the nested array that is stored in this application shall be the grid from the stored image
        button.addEventListener('click', (event) => {
          this.grid = element.grid
          popUpBox.remove()
          this.initGrid()
        })

        imageButtonsBox.appendChild(button)
      })
      popUpBox.appendChild(imageButtonsBox)
    } else {
      // If no saved images were provided, display a textbox for the user where they can enter text
      const textInput = document.createElement('input')
      textInput.setAttribute('placeholder', 'Enter a name')
      const confirmButton = document.createElement('button')
      confirmButton.textContent = 'Confirm'

      // If the user clicks the confirm button, save the current stored array that is a variable in this application within the browser's local storage
      confirmButton.addEventListener('click', () => {
        const imgName = textInput.value

        if (imgName !== '') {
          this.saveImage(imgName)
          popUpBox.remove()
        }
      })
      popUpBox.appendChild(textInput)
      userChoiceBox.appendChild(confirmButton)
    }

    const cancelButton = document.createElement('button')
    cancelButton.textContent = 'Cancel'
    cancelButton.addEventListener('click', (event) => {
      popUpBox.remove()
    })

    userChoiceBox.appendChild(cancelButton)
    popUpBox.appendChild(userChoiceBox)
    this.main.appendChild(popUpBox)
  }

  /**
   * Retrieves a list of objects that represents saved images from the browser's local storage.
   * Then displays a small window for the user
   */
  loadImage () {
    const loadedImages = JSON.parse(this.localStorage.getItem('savedImages'))
    if (loadedImages) {
      this.displayPopupWindow('Load Image', loadedImages)
    }
  }

  /**
   * Saves a nested array that represents a grid with cell elements into the browser's local storage
   * @param {string} imgName a string that will be used as a name for the image
   */
  saveImage (imgName) {
    // Retrieve all the objects that represents saved images from the browser's local storage
    let storedImages = JSON.parse(this.localStorage.getItem('savedImages'))

    if (!storedImages) {
      storedImages = []
    }

    // Create an object that contains the name string that was provided, and the nested array stored in the application
    const image = {
      name: imgName,
      grid: this.grid
    }

    // Add the constructed image object into the list of images objects
    storedImages.push(image)
    this.localStorage.setItem('savedImages', JSON.stringify(storedImages))
  }

  /**
   * Initiates the area that will contain div HTMLElements that represents cells.
   * Draws the cells into the applications window's main element.
   */
  initGrid () {
    // Remove any content of the window's main
    this.main.innerHTML = ''

    // Create the area that will host the cell elements
    this.paintArea = document.createElement('div')
    this.paintArea.className = 'paintGrid'

    // Prevent the area from being dragged when a user holds down their left mousebutton within the area
    this.paintArea.addEventListener('dragstart', (event) => {
      event.preventDefault()
    })

    if (!this.grid) {
      this.grid = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(0))
    }

    // loops through the grid (nested array) and creates div elements for each index
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const cellColor = this.grid[i][j]
        const cellPosition = { posY: i, posX: j }

        const cell = this.createCell(this.colors[cellColor], () => {
          this.setCellColor(cell, cellPosition)
        })

        // If a user is hovering over the cell, then it shall be colored if the left mouse button is held down
        cell.addEventListener('mouseover', (event) => {
          if (this.isMouseDown) {
            this.setCellColor(cell, cellPosition)
          }
        })
        this.paintArea.appendChild(cell)
      }
    }
    this.main.appendChild(this.paintArea)
  }

  /**
   * Sets the background color of a HTMLElement that represents a cell in a grid
   * Also sets the value of said cell's position in the array it represents, to a value that represents a color
   * @param {HTMLElement} cell a HTMLElement div that represents a cell
   * @param {object} cellPosition an object containing the position of the cell in a nested array (Ex: array[2][3])
   */
  setCellColor (cell, cellPosition) {
    cell.style.background = this.colors[this.selectedColor]
    this.grid[cellPosition.posY][cellPosition.posX] = this.selectedColor
  }

  /**
   * Creates a div element that represents a cell in a grid
   * @param {string} color the background color for the cell
   * @param {Function} callBack a function that is added to the created cell's eventListener
   * @returns {HTMLElement} A HTMLElement div that represents a cell
   */
  createCell (color, callBack) {
    const cell = document.createElement('div')
    cell.className = 'colorCell'
    cell.style.background = `${color}`

    cell.addEventListener('click', (event) => {
      callBack()
    })
    return cell
  }

  /**
   * Creates a grid with div elements that represents color cells and is appended into the application's window footer.
   */
  createSelectColorArea () {
    // Empty the footer if it contains any previous elements
    this.footer.innerHTML = ''
    this.colorsArea = document.createElement('div')
    this.colorsArea.className = 'colorsArea'

    // Retrieve all the keys for the colors object, (returns: [1,2,3,4,5...this.colors.length])
    const colorsKeys = Object.keys(this.colors)

    // Create and array that is the length of the amount of available colors and fill it with default zeroes
    const colorsArr = Array.from({ length: colorsKeys.length }, () => Array(colorsKeys.length).fill(0))

    for (let i = 0; i < colorsArr.length; i++) {
      // Create a cell with the color that is specified at the color array index
      const color = this.colors[i]
      const cell = this.createCell(color, () => {
        // When clicked, retrieve the name for the color that the cell has
        const selectedCellColor = cell.style.background

        // The name can then be searched for in the colors object (search all the values to see if they match the cell color, then get the key)
        // Example: if color = 'black', search through [0: 'white', 1: 'black', 2: 'red'...] --> found value 'black' then get key --> 1
        const colorKey = Object.keys(this.colors).find(key => this.colors[key] === selectedCellColor)
        this.selectedColor = colorKey
      })
      this.colorsArea.appendChild(cell)
    }
    this.footer.appendChild(this.colorsArea)
  }
}
