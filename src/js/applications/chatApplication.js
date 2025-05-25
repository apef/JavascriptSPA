'use strict'
import { windowClass } from '../modules/windowClass.js'
import { encrypt, decrypt } from '../modules/encryption.js'

const localStore = window.localStorage

export class ChatApplication extends windowClass {
  constructor () {
    const title = 'Chat'
    const icon = '/img/ChatAppLogo.png'
    super(title, icon)

    this.connectUrl = null
    this.channel = null
    this.websocket = null
    this.localUpdates = false
    this.connectionIntervalDuration = 100 // Is used to check the websocket connection each 100ms
    this.connectionTimeoutDuration = 10000 // Is used to break the connection checking interval if the elasped time reach 10 seconds
    this.emojiList = ['😎', '🙃', '🙂', '🤔', '😢', '👍', ' 👈', '👋']
    this.broadcastChannel = 'broadcast'
    this.sendKey = 'Enter' // The string representation of the key that is used to send chat messages

    // A hardcoded encrypted channel string, is used to send encrypted messages and decrypt incoming messages
    this.encryptedChannelStr = 'encryptedChannel'

    // Add a way to close the websocket when the user closes the application
    this.exitButton.addEventListener('click', (event) => this.closeWebSocket(this))
  }

  /**
   * Creates a chat application window and displays a login screen if the local browser storage does not contain a user name yet.
   */
  createWindow () {
    // Retrieve the username, webserver URL and channel from the browser's local storage and drecrypt them
    const username = decrypt(localStore.getItem('username'))
    this.connectUrl = decrypt(localStore.getItem('serverURL'))
    this.channel = decrypt(localStore.getItem('serverChannel'))

    if (!username) {
      this.displayLoginScreen(this)
    } else {
      this.connectWebSocket(this)
      this.displayChatScreen(this)
    }
  }

  /**
   * Creates a message object from the text input provided by the user
   * @param {string} message the text message that a user wants to send
   */
  sendMessage (message) {
    if (message) {
      const messageBody = {
        type: 'message',
        data: (this.channel === this.encryptedChannelStr) ? encrypt(message) : message, // Encrypt the message if the user is using an encrypted channel
        username: decrypt(localStore.getItem('username')), // Decrypt the stored username from the browser's local storage
        channel: this.channel,
        key: decrypt(localStore.getItem('serverKey'))
      }

      const strmessageBody = JSON.stringify(messageBody)

      this.websocket.send(strmessageBody)

      // If a user has enabled local updates, the message should be directly manually inserted into the chat log when sent
      if (this.localUpdates) {
        this.updateChatLog(strmessageBody)
      }
    }
  }

  /**
   * Performs a check to see if the object that was received was valid JSON
   * @param {object} message the message object that should contain the chat message (with username, channel and text message)
   * @returns {object} an object containing the result of the performed JSON parsing and the message that was parsed (or the original message if not valid JSON)
   */
  isJSON (message) {
    let isJSON = false

    // Try to parse the message and catch any error that occured
    try {
      message = JSON.parse(message)
      isJSON = true
    } catch (error) {
      console.log('Exception when parsing JSON')
    }
    // Return the result of checking if the message was valid JSON or not, and return the message back (if parsed or not)
    return [isJSON, message]
  }

  /**
   * Updates the chat applications chat log section with a new message (inserts it into the chat log)
   * @param {object} message the message that shall be inserted into the chat log
   */
  updateChatLog (message) {
    // Get the chat log box element
    const chatLogBox = this.main.querySelector('#chatLogBox')

    const ChatMessageElement = document.createElement('div')

    // Check if the message is valid JSON, and retrieve a parsed JSON object if valid
    const [result, parsedMessage] = this.isJSON(message)

    // If the message was valid JSON then act accordingly
    if (result) {
      if (parsedMessage.channel === this.channel || this.channel === this.broadcastChannel) {
        // Ignore messages with the type 'heartbeat'
        if (message.type !== 'heartbeat') {
          // Get the text string containing the actual chat message content a user has sent.
          // If the channel the message was sent on corresponds to the predefined encrypted channel string then the message shall be decrypted
          const messageData = (parsedMessage.channel === this.encryptedChannelStr && this.channel === this.encryptedChannelStr) ? decrypt(parsedMessage.data) : parsedMessage.data

          // Create a div that will contain the username that was stored in the message, and the timestamp it was received at
          const chatUsernameBox = document.createElement('div')
          chatUsernameBox.className = 'chatUsernameBox'
          chatUsernameBox.classList.add('rowFlex') // Make the div display the items in a row

          const userNameText = document.createElement('p')
          userNameText.textContent = parsedMessage.username

          const timeStampText = document.createElement('span')
          const chatTimeStamp = this.getTimeStamp() // The current time that the message was recieved at, as a string
          timeStampText.textContent = chatTimeStamp

          chatUsernameBox.appendChild(userNameText)
          chatUsernameBox.appendChild(timeStampText)

          // Create a div that will contain the chat message's text content (the message)
          const chatContentBox = document.createElement('div')
          chatContentBox.className = 'chatContent'
          chatContentBox.textContent = messageData

          ChatMessageElement.appendChild(chatUsernameBox)
          ChatMessageElement.appendChild(chatContentBox)
        }
      }
    } else {
      // If the message was not valid JSON, simply add it into a chat message
      ChatMessageElement.textContent = parsedMessage
    }

    ChatMessageElement.classList.add('chatMessage')

    // Insert the chat message (that was filled with the content of the received message) into the chat log
    chatLogBox.appendChild(ChatMessageElement)

    // Scroll down to the bottom of the chatbox automatically for the user
    chatLogBox.scrollTop = chatLogBox.scrollHeight

    // Store the message in the web browser's local storage
    this.storeChatLog(message)
  }

  /**
   * Retrieves the stored chat messages and inserts them one by one inside the chat window's chat log
   */
  restoreChatLog () {
    const storedChatLog = JSON.parse(localStore.getItem('chatLog'))
    storedChatLog.forEach(message => {
      this.updateChatLog(message)
    })
  }

  /**
   * Stores a chat message in the chat log that is stored within the browser's local storage
   * @param {object} message the message object that shall be stored (example: {type: message, data: message, username: user, channel: channel1, key: key1})
   */
  storeChatLog (message) {
    // Retrieve the stored chat log (an array of message objects)
    let storedChatLog = JSON.parse(localStore.getItem('chatLog'))
    if (!storedChatLog) {
      storedChatLog = []
    }
    // Store only the 20 last messages (remove the first chat message in the chat log if needed)
    if (storedChatLog.length > 20) {
      storedChatLog.shift()
    }

    storedChatLog.push(message)
    localStore.setItem('chatLog', JSON.stringify(storedChatLog))
  }

  /**
   * Creates a string containing the current hours and minutes and orders them into a string resembling a timestamp
   * @returns {string} a string that represents a timestamp with hours and minutes (example: 15:30)
   */
  getTimeStamp () {
    const now = new Date()

    // Get the hours and minutes and prepend a 0 in the first position if needed
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const updateText = `${hours}: ${minutes}`
    return updateText
  }

  /**
   * Retrieves the message data from an event and updates the chat log with it
   * @param {Event} event the event that contains the message data
   */
  recieveMessage (event) {
    const message = event.data
    this.updateChatLog(message)
  }

  /**
   *  Creates a websocket that connects to the webserver URL that is stored in the window's local storage
   */
  connectWebSocket () {
    const connectUrl = decrypt(localStore.getItem('serverURL'))
    this.websocket = new WebSocket(connectUrl)

    // If a message is received, handle it accordingly
    this.websocket.onmessage = (event) => this.recieveMessage(event)
  }

  /**
   *  Closes the current active websocket that is used in the chat application
   */
  closeWebSocket () {
    if (this.websocket != null) {
      try {
        this.websocket.send('Client has closed its connection')
      } catch {
        console.log('Websocket exception occured')
      }

      this.websocket.close()
      this.websocket = null
    } else {
      console.log('No websocket to close')
    }
  }

  /**
   * Generates and displays the main chat window functionality, such as the chat box and the messages within.
   */
  displayChatScreen () {
    this.generateSettingsBox()
    this.generateChatMain()
    this.setChatFooter()
  }

  /**
   * Generates the settings menu for the application, a drop down menu appended to the super class's menu bar.
   * It manipulates the DOM to create new elements during run time, the elements of which are tied specifically to
   * the object that this class creates upon initialization.
   */
  generateSettingsBox () {
    const dropdownMenu = this.createMenu()

    // Adding the change username menu choice
    this.createDropdownItem(dropdownMenu, 'Change Username', 'Enter new username..', (newUsername) => {
      if (newUsername) {
        this.username = newUsername

        // Encrypt the username string before storing it in the browser's local storage
        const encryptedUsername = encrypt(newUsername)
        localStore.setItem('username', encryptedUsername)
      }
    })

    // Adding the change webserver menu choice
    this.createDropdownItem(dropdownMenu, 'Change Webserver', 'Enter new URL..', (newServerURL) => {
      if (newServerURL) {
        this.connectUrl = newServerURL
        const encryptedNewServerURL = encrypt(newServerURL)
        localStore.setItem('serverURL', encryptedNewServerURL)
        this.closeWebSocket()
        this.connectWebSocket()
        this.setChatFooter()
      }
    })

    this.createDropdownItem(dropdownMenu, 'Change Channel', 'Enter a new channel', (newChannel) => {
      if (newChannel) {
        this.channel = newChannel
        const encryptedChannel = encrypt(newChannel)
        localStore.setItem('serverChannel', encryptedChannel)
        this.setChatFooter()
      }
    })

    // Adds a button in the drop down menu which enables the chat section to append messages sent locally
    // (the chat message the user sends is added directly to the chat application's chat log if toggled)
    this.createDropdownItem(dropdownMenu, 'Toggle local updates', '', () => {
      if (this.localUpdates) {
        this.localUpdates = false
      } else {
        this.localUpdates = true
      }
    }, false)

    // Adds a button in the drop down menu that lets the user add the stored chat messages from the window's local storage.
    this.createDropdownItem(dropdownMenu, 'Restore previous session', '', () => {
      this.restoreChatLog()
    }, false)
  }

  /**
   * Generates the main chat area by manipulating the DOM, where messages can be read and sent by the user.
   * It contains the chat log (where messages appear), an input box where the user enters their chat message.
   * It also contains a button which reveals a set of possible emoji that can be added to the message they are currently writing,
   * and another button to send the message.
   */
  generateChatMain () {
    // The main div that will contain the interactable chat related elements
    const chatSection = document.createElement('div')
    chatSection.setAttribute('id', 'chatSection')

    // Creates the div that will be filled with the chat messages
    const chatLogBox = document.createElement('div')
    chatLogBox.setAttribute('id', 'chatLogBox')
    chatLogBox.style.overflowY = 'auto'

    // A wrapper div for the input control elements
    const inputControlsBox = document.createElement('div')
    inputControlsBox.className = 'inputControlsBox'

    const userMessageInput = document.createElement('input')
    userMessageInput.setAttribute('id', 'chatUserMessageInput')
    userMessageInput.setAttribute('placeholder', '...')

    userMessageInput.addEventListener('keydown', (event) => {
      if (event.key === this.sendKey) {
        const chatMsg = userMessageInput.value
        this.sendMessage(chatMsg)
      }
    })

    // The send button
    const sendbtn = document.createElement('button')
    sendbtn.setAttribute('id', 'chatSendBtn')
    sendbtn.textContent = 'Send'

    // Send a message only if the chat input text box is not empty
    sendbtn.addEventListener('click', (event) => {
      const chatMsg = userMessageInput.value
      this.sendMessage(chatMsg)
    })

    // Creates a button which will host the possible emoji that the user can send
    const emojiBtn = document.createElement('button')
    emojiBtn.textContent = '😎'

    // When the button is clicked it creates a grid that contains all the emoji and places it over the button
    emojiBtn.addEventListener('click', (event) => {
      // Hide the emoji button's displayed example emoji
      emojiBtn.textContent = ''

      const emojiGrid = document.createElement('div')
      emojiGrid.className = 'grid'

      // Create a div for each possible emoji accompanied with an eventlistener that adds the represented emoji in the textbox
      // and appends the created emoji div in the array list to the grid
      this.emojiList.forEach(emoji => {
        const emojiElement = document.createElement('div')
        emojiElement.className = 'emoji'
        emojiElement.textContent = emoji
        emojiElement.addEventListener('click', (event) => {
          userMessageInput.value = userMessageInput.value + emoji
        })

        emojiGrid.appendChild(emojiElement)
      })
      emojiBtn.appendChild(emojiGrid)
      emojiGrid.addEventListener('mouseleave', (event) => {
        emojiBtn.textContent = '😎'
        emojiGrid.remove()
      })
    })

    inputControlsBox.appendChild(userMessageInput)
    inputControlsBox.appendChild(emojiBtn)
    inputControlsBox.appendChild(sendbtn)

    chatSection.appendChild(chatLogBox)
    chatSection.appendChild(inputControlsBox)
    this.main.appendChild(chatSection)
  }

  /**
   * Adds and displays the webserver and channel that a user has connected the chat application to, in the application windows footer
   */
  setChatFooter () {
    // Clear the application window's footer (if it already contained elements)
    this.footer.innerHTML = ''
    const footerTextBox = document.createElement('div')
    footerTextBox.className = 'footerTextBox'

    const webserverText = document.createElement('span')
    const channelText = document.createElement('span')
    webserverText.textContent = `Connecting to webserver: ${this.connectUrl}`

    let elapsedTime = 0
    // Using an interval to check if the websocket has made a connection, each interval.
    // If the elapsed time exceeds a predetermined timeout length, then clear the interval and display that the user could not connect.
    const connectionInterval = setInterval(() => {
      if (this.websocket.readyState === this.websocket.OPEN) {
        clearInterval(connectionInterval)
        webserverText.textContent = `Connected to webserver: ${this.connectUrl}`
        channelText.textContent = `Using channel: ${this.channel}`
      } else if (elapsedTime >= this.connectionTimeoutDuration) {
        clearInterval(connectionInterval)
        webserverText.textContent = `A connection could not be established to webserver: ${this.connectUrl}`
      }

      elapsedTime += this.connectionIntervalDuration
    }, this.connectionIntervalDuration)

    footerTextBox.appendChild(webserverText)
    footerTextBox.appendChild(channelText)
    this.footer.appendChild(footerTextBox)
  }

  /**
   * Generates and displays a simple login screen to a chat window by manipulating the DOM
   */
  displayLoginScreen () {
    // The main div that will contain the HTML elements that are created further on
    const loginScreenBox = document.createElement('div')
    loginScreenBox.classList.add('loginScreenBox')

    const chatWelcomeText = document.createElement('h1')
    chatWelcomeText.textContent = 'Welcome to the chatroom!'

    const chatInfoText = document.createElement('h3')
    chatInfoText.textContent = 'Please enter your username'

    // Creating the text input where a user can input the username they want
    const setUsernameTextBox = document.createElement('input')
    setUsernameTextBox.setAttribute('placeholder', 'Username')
    setUsernameTextBox.setAttribute('id', 'setUsernameTextBox')

    // Creates a text box where a user enters the webserver URL they want to connect to
    const setServerTextBox = document.createElement('input')
    setServerTextBox.setAttribute('id', 'setServerTextBox')
    setServerTextBox.setAttribute('placeholder', 'Server URL')

    const setServerKeyTextBox = document.createElement('input')
    setServerKeyTextBox.setAttribute('placeholder', 'key')

    const loginButton = document.createElement('button')
    loginButton.setAttribute('id', 'chatLoginButton')
    loginButton.appendChild(document.createTextNode('Login'))

    // Creates a small div containing an error text which informs the user that they need to enter values into the text boxes
    const loginErrorMSGBox = document.createElement('div')
    loginErrorMSGBox.appendChild(document.createTextNode('Please enter username and server URL'))
    loginErrorMSGBox.classList.add('hidden')

    // Adds an eventlistener to the button which represents the login button, where it takes the values
    // of the input text boxes and encrypts them before they get stored in the browsers local storage.
    loginButton.addEventListener('click', (event) => {
      const chosenUsername = setUsernameTextBox.value
      const chosenServerURL = setServerTextBox.value
      const chosenServerKey = setServerKeyTextBox.value

      // Only proceed if the text boxes are not empty
      if (chosenUsername === '' || chosenServerURL === '' || chosenServerKey === '') {
        if (loginErrorMSGBox.classList.contains('hidden')) {
          loginErrorMSGBox.classList.remove('hidden')
        }
        loginScreenBox.appendChild(loginErrorMSGBox)
      } else {
        const encryptedchosenUsername = encrypt(chosenUsername)
        const encryptedServerKey = encrypt(chosenServerKey)
        const encryptedServerURL = encrypt(chosenServerURL)
        localStore.setItem('username', encryptedchosenUsername)
        localStore.setItem('serverURL', encryptedServerURL)
        localStore.setItem('serverKey', encryptedServerKey)
        loginScreenBox.remove()

        // Recreate the chat application window
        this.createWindow()
      }
    })

    loginScreenBox.appendChild(chatWelcomeText)
    loginScreenBox.appendChild(chatInfoText)
    loginScreenBox.appendChild(setUsernameTextBox)
    loginScreenBox.appendChild(setServerTextBox)
    loginScreenBox.appendChild(setServerKeyTextBox)
    loginScreenBox.appendChild(loginButton)
    loginScreenBox.appendChild(loginErrorMSGBox)

    this.main.appendChild(loginScreenBox)
  }
}
