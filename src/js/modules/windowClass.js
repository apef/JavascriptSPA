'use strict'

// The element which will host application icons
const taskbar = document.getElementById('taskbar')

export class windowClass {
  constructor (newTitle = undefined, newIcon = undefined) {
    this.icon = null
    this.start = null
    this.dragArea = null
    this.title = null
    this.header = null
    this.menubar = null
    this.dropdownMenu = null
    this.main = null
    this.footer = null
    this.base = null
    this.defaultIcon = '../img/tempWindowBaseIcon.png'

    // Creates an area that serves as a zone which listens to drop events (used when a user drops a dragged window onto it)
    const dropZone = document.querySelector('main')
    this.dragArea = dropZone
    dropZone.addEventListener('dragover', (event) => {
      event.preventDefault()
    })

    // Adds an event listener for drop events, which when triggered adds the current position that an item was dropped on to the item itself
    dropZone.addEventListener('drop', (event) => {
      if (this.base.classList.contains('active')) {
        const start = JSON.parse(event.dataTransfer.getData('application/json'))

        // Get the item that was dragged
        const targetedWindow = this.base
        const dropX = event.clientX
        const dropY = event.clientY

        // Update the position of the dropped item with the new position
        targetedWindow.style.left = (dropX + start.posX) + 'px'
        targetedWindow.style.top = (dropY + start.posY) + 'px'
      }
    })

    this.init(newTitle, newIcon)
  }

  init (newTitle, newIcon) {
    this.createWindowHeader(newTitle, newIcon)
    this.createWindowMenuBar()
    this.createWindowMain()
    this.createWindowFooter()
    this.createWindowBase()
    this.dragArea.appendChild(this.base)
  }

  createWindowFooter () {
    this.footer = document.createElement('div')
    this.footer.className = 'windowFooter'
  }

  createWindowMenuBar () {
    this.menubar = document.createElement('div')
    this.menubar.setAttribute('id', 'windowMenuBar')
  }

  /**
   * Creates the base for the window application and adds draggable functionality to it.
   */
  createWindowBase () {
    this.base = document.createElement('div')
    this.base.setAttribute('id', 'item')
    this.base.classList.add('item')

    // If the window is clicked anywhere by the user, it shall be focused (which unfocuses all the other windows)
    this.base.addEventListener('click', (event) => {
      this.focusNewWindow(this)
    })

    this.base.setAttribute('draggable', 'false')
    this.base.appendChild(this.header)
    this.base.appendChild(this.menubar)
    this.base.appendChild(this.main)
    this.base.appendChild(this.footer)
  }

  /**
   * Creates the header of a window. The header will contain the icon, minimizebutton and exit button for the application's window.
   * @param {*} newTitle a string that details the name of the application
   * @param {*} newIcon an icon that is displayed in the header for the application
   */
  createWindowHeader (newTitle = undefined, newIcon = undefined) {
    // Set default title if none was provided
    if (newTitle !== undefined) {
      this.title = newTitle
    } else {
      this.title = 'Window'
    }

    this.header = document.createElement('div')
    this.header.classList.add('windowHeader')
    this.header.setAttribute('draggable', 'true')

    // If the window is dragged by the user, it shall copy its current position (the pixels it currently resided on when it began to get dragged)
    this.header.addEventListener('dragstart', (event) => {
      event.dataTransfer.dropEffect = 'move'

      // Get original position
      const style = window.getComputedStyle(this.base, null)
      const startX = parseInt(style.getPropertyValue('left'), 10) - event.clientX
      const startY = parseInt(style.getPropertyValue('top'), 10) - event.clientY

      const movedWindow = {
        posX: startX,
        posY: startY
      }

      // add the position it was in to the event that occured as a transferred object
      event.dataTransfer.setData('application/json', JSON.stringify(movedWindow))
      this.focusNewWindow(this)
    })

    // Creates the icon image element
    this.icon = document.createElement('img')
    this.icon.classList.add('icon')

    // If an icon was not provided, add the default icon.
    if (newIcon !== undefined) {
      this.icon.src = newIcon
    } else {
      this.icon.src = this.defaultIcon
    }

    // Adds functionality to the icon where if clicked, the window (if hidden) shall be displayed again to the user
    // Is used for the corresponding icon that is appended to the taskbar element to show a window again after it has been minimized
    this.icon.addEventListener('click', (event) => {
      if (this.base.classList.contains('minimizing')) {
        this.base.classList.remove('minimizing')
      }

      this.focusNewWindow(this)
    })

    // Add the icon to the taskbar
    taskbar.appendChild(this.icon)

    const buttonsDiv = document.createElement('div')
    buttonsDiv.classList.add('headerButtons')

    // Creates the exit button for the application (which deletes the window when pressed)
    this.exitButton = document.createElement('button')
    this.exitButton.classList.add('windowCloseButton')

    // Adding the letter 'X' as the content of the exit button
    const exitButtonIcon = document.createElement('span')
    exitButtonIcon.setAttribute('id', 'windowExitButtonIcon')
    exitButtonIcon.textContent = 'X'
    this.exitButton.appendChild(exitButtonIcon)

    // When the exit button is clicked it deletes the application window and accompanied taskbar icon
    this.exitButton.addEventListener('click', (event) => {
      this.base.remove()
      taskbar.removeChild(this.icon)
    })
    // this.header.append(this.exitButton)

    const minimizeButton = document.createElement('button')
    minimizeButton.classList.add('windowMinimizeButton')

    const minimizeButtonIcon = document.createElement('span')
    minimizeButtonIcon.setAttribute('id', 'windowMinimizeButtonIcon')
    minimizeButtonIcon.textContent = '-'
    minimizeButton.appendChild(minimizeButtonIcon)

    // The minimize button for the application hides the window when pressed (with the class minimizing)
    minimizeButton.addEventListener('click', (event) => {
      this.base.classList.add('minimizing')
    })
    // this.header.append(minimizeButton)

    buttonsDiv.appendChild(minimizeButton)
    buttonsDiv.appendChild(this.exitButton)
    this.header.appendChild(buttonsDiv)

    // Creates the box that contains the icon and application title in the header
    const windowTitleBox = document.createElement('div')
    windowTitleBox.setAttribute('id', 'windowTitleBox')

    // Clones the taskbar icon with a deep clone (instead of a reference)
    const windowIcon = this.icon.cloneNode(true)
    windowIcon.setAttribute('id', 'windowTitleIcon')
    windowTitleBox.appendChild(windowIcon)

    const windowTitle = document.createElement('span')
    windowTitle.setAttribute('id', 'windowTitle')
    windowTitle.textContent = this.title
    windowTitleBox.appendChild(windowTitle)

    this.header.appendChild(windowTitleBox)
  }

  /**
   * Creates a HTML div element that is used as the window's main area (where applications main functionality will be displayed)
   */
  createWindowMain () {
    this.main = document.createElement('div')
    this.main.classList.add('windowMain')
  }

  /**
   * Focues the current window and sets all other windows to not in focus
   */
  focusNewWindow () {
    // If another window is found that has the active class, remove it
    if (document.querySelector('.active')) {
      document.querySelector('.active').classList.remove('active')
    }
    // Does the same for all the icons in the element with id taskbar, remove their active class
    const allICons = taskbar.querySelectorAll('#taskbar .icon')
    allICons.forEach(icon => icon.classList.remove('active'))

    // Set this window's base and icon as active (which puts it in focus)
    this.base.classList.add('active')
    this.icon.classList.add('active')
  }

  /**
   * Creates a menu with a dropdown that is inserted in the menu bar below a window's header.
   * @returns {HTMLElement} the dropdown element that was created and inserted beneath the menu button
   */
  createMenu () {
    const dropdownMenu = document.createElement('div')
    dropdownMenu.className = 'dropdownMenu'
    dropdownMenu.classList.add('hidden')

    const menuItem = document.createElement('div')
    menuItem.className = 'menuItem'

    const menuButton = document.createElement('button')
    menuButton.className = 'menuButton'
    menuButton.textContent = 'Menu'

    // If the menu button that was created is clicked it shall reveal or hide the drop down menu
    menuButton.addEventListener('click', (event) => {
      if (dropdownMenu.classList.contains('hidden')) {
        dropdownMenu.classList.remove('hidden')
      } else {
        dropdownMenu.classList.add('hidden')
      }
    })

    menuItem.appendChild(menuButton)
    menuItem.appendChild(dropdownMenu)
    this.menubar.appendChild(menuItem)
    return dropdownMenu
  }

  /**
   * Creates a dropdown menu item element which can be appended as a child element to the parent element
   * Is used to add more elements into a drop down menu.
   * @param {HTMLElement} parent the parent element which the new dropdown menu item shall be appended to
   * @param {string} buttonLabel the label for the new drop down menu button
   * @param {string} textboxPlaceholder the placeholder for the text box created within the function
   * @param {Function} onActionCallback the action callback to the confirm button that is created by the function
   * @param {boolean} subMenu determines if the dropdownitem created should have a sub menu with accompanied text box and buttons
   */
  createDropdownItem (parent, buttonLabel = '', textboxPlaceholder = '', onActionCallback, subMenu = true) {
    const menuItemButton = document.createElement('button')
    menuItemButton.textContent = buttonLabel
    menuItemButton.classList.add('dropdownItem')

    parent.appendChild(menuItemButton)
    if (subMenu) {
      menuItemButton.addEventListener('click', () => {
        // As this function cannot call to other drop down buttons that are created outside of the function
        // Find all the other dropdown buttons and hide them, including the current menuItemButton above (this dropdown button)
        // This hides the drop down menu buttons when a user has clicked one of them, which then reveals the corresponding
        // functionality behind that drop down menu button.
        const allDropdownbuttons = parent.querySelectorAll('.dropdownItem')
        allDropdownbuttons.forEach(dropdownbutton => {
          dropdownbutton.classList.add('hidden')
        })

        const menuitemBox = document.createElement('div')
        menuitemBox.setAttribute('id', 'menuItemChangeBox')

        const textBox = document.createElement('input')
        textBox.type = 'text'
        textBox.setAttribute('placeholder', textboxPlaceholder)

        const buttonsBox = document.createElement('div')
        buttonsBox.className = 'rowFlex'

        const confirmButton = document.createElement('button')
        confirmButton.textContent = 'Confirm'

        const cancelButton = document.createElement('button')
        cancelButton.textContent = 'Cancel'

        buttonsBox.appendChild(cancelButton)
        buttonsBox.appendChild(confirmButton)

        menuitemBox.appendChild(textBox)
        menuitemBox.appendChild(buttonsBox)
        parent.appendChild(menuitemBox)

        confirmButton.addEventListener('click', () => {
          const inputValue = textBox.value
          menuItemButton.classList.remove('hidden')
          menuitemBox.remove()
          allDropdownbuttons.forEach(dropdownbutton => {
            dropdownbutton.classList.remove('hidden')
          })
          onActionCallback(inputValue)
        })

        cancelButton.addEventListener('click', () => {
          menuitemBox.remove()
          allDropdownbuttons.forEach(dropdownbutton => {
            dropdownbutton.classList.remove('hidden')
          })
          menuItemButton.classList.remove('hidden')
        })
      })
    } else {
      menuItemButton.textContent = buttonLabel
      menuItemButton.addEventListener('click', () => {
        onActionCallback()
      })
    }
  }
}
