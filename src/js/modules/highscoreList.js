'use strict'
export class HighscoreList {
  constructor (maxListedPlayers, isDescending) {
    this.list = null
    this.maxListedPlayers = maxListedPlayers
    this.descending = isDescending
    this.initList()
  }

  initList () {
    const prevhighscores = JSON.parse(window.localStorage.getItem('highscoreList'))

    // If the browser storage contained a highscorelist, proceed with using it. Otherwise create a new empty list
    if (prevhighscores !== null) {
      this.list = prevhighscores
    } else {
      this.list = []
    }
  }

  /**
   * Filters the highscores that are stored within the browsers local storage. Filters them based on which
   * application they belong to.
   * @param {string} application the application the highscores belongs to
   * @param {boolean} omit if true, select all the other applications highscores. (Omit this application)
   * @returns {object} a filtered list of highscores
   */
  filterHighscores (application, omit) {
    let scores = JSON.parse(window.localStorage.getItem('highscoreList'))
    // Filter out entries from other applications using the provided string
    if (application !== '') {
      // Each object in the list contains an attribute that details which application they were created from
      // filter out all the ones that do not contain the attribute string that matches with the provided application string.
      if (omit) {
        scores = application ? scores.filter(entry => entry.application !== application) : scores
      } else {
        scores = application ? scores.filter(entry => entry.application === application) : scores
      }
    }
    return scores
  }

  /**
   * Deletes the highscores for a specific application
   * @param {string} application the string that is used to filter the highscores with
   */
  clearHighscores (application) {
    const scores = this.filterHighscores(application, true)
    window.localStorage.setItem('highscoreList', JSON.stringify(scores))
  }

  /**
   * Adds a new entry to the highscore list, which represents a player with their username and completion time
   * @param {object} newEntry the object that serves as a new entry to the list (a player)
   */
  addEntry (newEntry) {
    let listEntries = this.list
    listEntries = newEntry.application ? listEntries.filter(entry => entry.application === newEntry.application) : listEntries
    listEntries = Object.entries(listEntries)

    if (listEntries.length < this.maxListedPlayers) {
      this.list.push(newEntry)
    } else {
      const lastListEntry = listEntries[listEntries.length - 1][1]

      if ((!this.descending && lastListEntry.score > newEntry.score) || (this.descending && lastListEntry.score < newEntry.score)) {
        this.list.pop()
        this.list.push(newEntry)
      }
    }
    this.sortList()

    window.localStorage.setItem('highscoreList', JSON.stringify(this.list))
  }

  /**
   * Simple sort function of the highscore list. It compares the score values for each entry in the list and sorts accordingly
   *
   */
  sortList () {
    if (this.list.length > 1) {
      let sortOrder = null

      // Set the sorting order, for example: if 1 it should sort based on highest first.
      if (this.descending) {
        sortOrder = -1
      } else {
        sortOrder = 1
      }

      // Sort the entries in the highscorelist based on their scores
      // Example: p1.score = 1, p2.score = 2
      // If sortOrder = 1 --> (1 - 2) * 1 = -1  (-1 in sort, sorts the current entry to be lower in the list, closer to index 0)
      // If sortOrder = -1 --> (1 - 2) * -1 = 1 (1 in sort does the opposite, moves the current entry further from index 0)
      // in both cases it swaps the players, but based on score (if higher should be closer to index 0 or vice versa)
      this.list.sort((p1, p2) => (p1.score - p2.score) * sortOrder)
    }
  }

  /**
   * Creates a table HTMLElement which is then populated with values.
   * @param {string} application the string that is used to filter out objects in a list
   * @returns {HTMLElement} the table HTMLElement that was created and populated.
   */
  getDisplayHighScoreElement (application = '') {
    const emptyListMsg = 'No scores set yet'
    const scoresTable = document.createElement('table')

    const scores = this.filterHighscores(application, false)
    if (scores && scores.length > 0) {
      // Get all the properties of the first object in the list ({property: value}) and create a row populated with them
      // All objects have the same structure, which is why I take the first object when initializing the properties row.
      const playerProperties = Object.keys(scores[0])
      const tableHeadRow = this.createRow(playerProperties, 'th', 'application')
      scoresTable.appendChild(tableHeadRow)

      // Go through each of the objects and create rows filled with all their values, instead of properties.
      scores.forEach(entry => {
        const playerValues = Object.values(entry)
        const playerValueRow = this.createRow(playerValues, 'td', application)
        scoresTable.appendChild(playerValueRow)
      })
    } else {
      const emptyListElement = document.createElement('tr').appendChild(document.createTextNode(emptyListMsg))
      scoresTable.appendChild(emptyListElement)
    }

    return scoresTable
  }

  /**
   * Creates a table row in HTML. Is used to create and populate a table row with values
   * @param {object} obj the object that contains the values that shall populate the row
   * @param {string} htmlElementType the string that details which HTMLElement the DOM shall create
   * @param {string} ignoreValue the string to ignore when populating the row
   * @returns {HTMLElement} the table row that was created and populated with the given object's values
   */
  createRow (obj, htmlElementType, ignoreValue) {
    const tableRow = document.createElement('tr')
    obj.forEach(objValue => {
      if (objValue !== ignoreValue) {
        const cell = this.createCell(htmlElementType, objValue)
        tableRow.appendChild(cell)
      }
    })
    return tableRow
  }

  /**
   * Creates a textnode of a given element type (for instance, table data cell elements: td)
   * is used to create table cell elements in order to populate a table.
   * @param {string} htmlElementType the HTMLElement that shall be created
   * @param {string} text the string that the element shall contain
   * @returns {HTMLElement} the created HTMLElement table cell
   */
  createCell (htmlElementType, text) {
    const cellElement = document.createElement(htmlElementType)
    const cellText = document.createTextNode(text)
    cellElement.appendChild(cellText)
    return cellElement
  }

  getList () {
    return this.list
  }

  /**
   * Generates HTMLElements to manipulate the DOM, where it creates a table that contains values representing a list of highscores
   * @param {object} applicationWindow the object that shall recieve the highscore list visual representation of elements
   * @param {object} values the set of values that a new entry to the highscore list contains.
   */
  createHighScoreArea (applicationWindow, values) {
    // Empty out the previous elements/text from both main and footer
    applicationWindow.main.innerHTML = ''
    applicationWindow.footer.innerHTML = ''

    // Create the parent div named Highscore area and populate it with its child nodes
    const highScoreArea = document.createElement('div')
    highScoreArea.className = 'highScoreArea'

    const highscoreHeaderTextElement = document.createElement('h1')
    highscoreHeaderTextElement.textContent = 'Highscores'
    highScoreArea.appendChild(highscoreHeaderTextElement)

    // Add the player values that was provided, into the list
    this.addEntry(values)

    // Generate the list elements that shall be appended to the highscoreArea
    const highScoreListTable = this.getDisplayHighScoreElement(values.application)
    highScoreArea.appendChild(highScoreListTable)

    const retryButton = document.createElement('button')
    retryButton.textContent = 'Retry'
    retryButton.addEventListener('click', (event) => {
      highScoreArea.remove()
      applicationWindow.createWindow(true)
    })

    highScoreArea.appendChild(retryButton)
    applicationWindow.main.appendChild(highScoreArea)
  }
}
