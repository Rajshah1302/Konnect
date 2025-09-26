// Get canvas and context
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

// Socket.io connection
const socket = io()

// Game state
let gameState = {
  contractAddress: null,
  myPlayerId: null,
  myPlayerName: null,
  otherPlayers: {},
  connected: false,
  chatting: false
}

// Get contract address from URL
function getContractAddress() {
  const path = window.location.pathname
  console.log('🌐 Current URL path:', path)
  const match = path.match(/\/game\/(.+?)(?:\/|$)/) // Fixed regex to handle trailing slash
  let address = match ? match[1] : null
  
  // Remove any trailing slash if present
  if (address && address.endsWith('/')) {
    address = address.slice(0, -1)
  }
  
  console.log('📍 Extracted contract address:', address)
  return address
}

// Update UI elements
function updateUI() {
  document.getElementById('playerInfo').textContent = `Player: ${gameState.myPlayerName || 'Loading...'}`
  document.getElementById('roomInfo').textContent = `Room: ${gameState.contractAddress?.slice(0, 10)}...`
  document.getElementById('playersCount').textContent = `Players: ${Object.keys(gameState.otherPlayers).length + 1}`
  
  const statusEl = document.getElementById('connectionStatus')
  if (gameState.connected) {
    statusEl.textContent = 'Connected'
    statusEl.className = 'connected'
  } else {
    statusEl.textContent = 'Disconnected'
    statusEl.className = 'disconnected'
  }
}

// Collision detection
const collisionsMap = []
for (let i = 0; i < collisions.length; i += 70) {
  collisionsMap.push(collisions.slice(i, 70 + i))
}

const boundaries = []
const offset = {
  x: -735,
  y: -650
}

collisionsMap.forEach((row, i) => {
  row.forEach((symbol, j) => {
    if (symbol === 1025)
      boundaries.push(
        new Boundary({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height + offset.y
          }
        })
      )
  })
})

// Load images
const image = new Image()
image.src = './img/Pellet Town.png'

const foregroundImage = new Image()
foregroundImage.src = './img/foregroundObjects.png'

const playerDownImage = new Image()
playerDownImage.src = './img/playerDown.png'

const playerUpImage = new Image()
playerUpImage.src = './img/playerUp.png'

const playerLeftImage = new Image()
playerLeftImage.src = './img/playerLeft.png'

const playerRightImage = new Image()
playerRightImage.src = './img/playerRight.png'

// Create main player
const player = new Sprite({
  position: {
    x: canvas.width / 2 - 192 / 4 / 2,
    y: canvas.height / 2 - 68 / 2
  },
  image: playerDownImage,
  frames: {
    max: 4,
    hold: 10
  },
  sprites: {
    up: playerUpImage,
    left: playerLeftImage,
    right: playerRightImage,
    down: playerDownImage
  }
})

// Create background and foreground
const background = new Sprite({
  position: {
    x: offset.x,
    y: offset.y
  },
  image: image
})

const foreground = new Sprite({
  position: {
    x: offset.x,
    y: offset.y
  },
  image: foregroundImage
})

// Key handling - CHANGED TO ARROW KEYS
const keys = {
  ArrowUp: { pressed: false },
  ArrowDown: { pressed: false },
  ArrowLeft: { pressed: false },
  ArrowRight: { pressed: false }
}

const movables = [background, ...boundaries, foreground]

let lastKey = ''
let lastMovementTime = 0
const MOVEMENT_SYNC_INTERVAL = 100 // Send position every 100ms

// Calculate player's world position based on background offset
function getPlayerWorldPosition() {
  // The player stays centered on screen, but the world moves
  // So the player's world position is the inverse of the background movement
  return {
    x: (canvas.width / 2 - 192 / 4 / 2) - background.position.x,
    y: (canvas.height / 2 - 68 / 2) - background.position.y
  }
}

// Movement function
function handleMovement() {
  let moving = true
  player.animate = false
  let moved = false

  if (keys.ArrowUp.pressed && lastKey === 'ArrowUp') {
    player.animate = true
    player.image = player.sprites.up

    for (let i = 0; i < boundaries.length; i++) {
      const boundary = boundaries[i]
      if (rectangularCollision({
        rectangle1: player,
        rectangle2: {
          ...boundary,
          position: {
            x: boundary.position.x,
            y: boundary.position.y + 3
          }
        }
      })) {
        moving = false
        break
      }
    }

    if (moving) {
      movables.forEach((movable) => {
        movable.position.y += 3
      })
      moved = true
    }
  } else if (keys.ArrowLeft.pressed && lastKey === 'ArrowLeft') {
    player.animate = true
    player.image = player.sprites.left

    for (let i = 0; i < boundaries.length; i++) {
      const boundary = boundaries[i]
      if (rectangularCollision({
        rectangle1: player,
        rectangle2: {
          ...boundary,
          position: {
            x: boundary.position.x + 3,
            y: boundary.position.y
          }
        }
      })) {
        moving = false
        break
      }
    }

    if (moving) {
      movables.forEach((movable) => {
        movable.position.x += 3
      })
      moved = true
    }
  } else if (keys.ArrowDown.pressed && lastKey === 'ArrowDown') {
    player.animate = true
    player.image = player.sprites.down

    for (let i = 0; i < boundaries.length; i++) {
      const boundary = boundaries[i]
      if (rectangularCollision({
        rectangle1: player,
        rectangle2: {
          ...boundary,
          position: {
            x: boundary.position.x,
            y: boundary.position.y - 3
          }
        }
      })) {
        moving = false
        break
      }
    }

    if (moving) {
      movables.forEach((movable) => {
        movable.position.y -= 3
      })
      moved = true
    }
  } else if (keys.ArrowRight.pressed && lastKey === 'ArrowRight') {
    player.animate = true
    player.image = player.sprites.right

    for (let i = 0; i < boundaries.length; i++) {
      const boundary = boundaries[i]
      if (rectangularCollision({
        rectangle1: player,
        rectangle2: {
          ...boundary,
          position: {
            x: boundary.position.x - 3,
            y: boundary.position.y
          }
        }
      })) {
        moving = false
        break
      }
    }

    if (moving) {
      movables.forEach((movable) => {
        movable.position.x -= 3
      })
      moved = true
    }
  }

  // Send position update to server if moved
  if (moved && gameState.connected) {
    const now = Date.now()
    if (now - lastMovementTime > MOVEMENT_SYNC_INTERVAL) {
      const direction = lastKey.replace('Arrow', '').toLowerCase()
      const worldPos = getPlayerWorldPosition()
      socket.emit('playerMove', {
        contractAddress: gameState.contractAddress,
        position: worldPos, // Send world position
        direction: direction,
        animate: player.animate
      })
      lastMovementTime = now
    }
  }
}

// Main animation loop
function animate() {
  window.requestAnimationFrame(animate)
  
  // Clear canvas
  c.clearRect(0, 0, canvas.width, canvas.height)
  
  // Draw background
  background.draw()
  
  // Draw boundaries (for debugging - usually invisible)
  // boundaries.forEach(boundary => boundary.draw())
  
  // Draw other players with proper positioning
  Object.values(gameState.otherPlayers).forEach(otherPlayer => {
    // Update the render position based on their world position and current camera offset
    otherPlayer.renderPosition = {
      x: otherPlayer.worldPosition.x + background.position.x,
      y: otherPlayer.worldPosition.y + background.position.y
    }
    otherPlayer.draw()
  })
  
  // Draw main player
  player.draw()
  
  // Draw foreground
  foreground.draw()
  
  // Handle movement
  if (!gameState.chatting) {
    handleMovement()
  }
}

// Socket event handlers
socket.on('connect', () => {
  console.log('Connected to server')
  gameState.connected = true
  gameState.contractAddress = getContractAddress()
  
  if (gameState.contractAddress) {
    // Join the game
    socket.emit('joinGame', {
      contractAddress: gameState.contractAddress,
      playerName: null // Server will generate random name
    })
  } else {
    console.error('No contract address in URL')
  }
  
  updateUI()
})

socket.on('disconnect', () => {
  console.log('Disconnected from server')
  gameState.connected = false
  updateUI()
})

socket.on('gameState', (data) => {
  console.log('Received game state:', data)
  gameState.myPlayerId = socket.id
  
  // Find our player name
  if (data.players[socket.id]) {
    gameState.myPlayerName = data.players[socket.id].name
  }
  
  // Create other players
  Object.keys(data.players).forEach(playerId => {
    if (playerId !== socket.id) {
      const playerData = data.players[playerId]
      gameState.otherPlayers[playerId] = new OtherPlayer({
        position: playerData.position, // This is world position
        playerId: playerId,
        playerName: playerData.name,
        direction: playerData.direction || 'down'
      })
    }
  })
  
  updateUI()
})

socket.on('playerJoined', (data) => {
  console.log('🎉 Player joined:', data.player.name)
  console.log('👤 Player data:', data)
  
  if (data.playerId !== socket.id) {
    gameState.otherPlayers[data.playerId] = new OtherPlayer({
      position: data.player.position, // This is world position
      playerId: data.playerId,
      playerName: data.player.name,
      direction: data.player.direction || 'down'
    })
    console.log('✅ Added to otherPlayers. Total other players:', Object.keys(gameState.otherPlayers).length)
  }
  
  updateUI()
})

socket.on('playerLeft', (playerId) => {
  console.log('Player left:', playerId)
  delete gameState.otherPlayers[playerId]
  updateUI()
})

socket.on('playerUpdate', (data) => {
  const otherPlayer = gameState.otherPlayers[data.playerId]
  if (otherPlayer) {
    // Update world position
    otherPlayer.update({
      position: data.position, // This is world position from server
      direction: data.direction,
      animate: data.animate
    })
  }
})

socket.on('chatMessage', (data) => {
  console.log('Chat message:', data)
  
  if (data.playerId === socket.id) {
    // Show our own message above our player
    player.setChat(data.message)
  } else {
    // Show message above other player
    const otherPlayer = gameState.otherPlayers[data.playerId]
    if (otherPlayer) {
      otherPlayer.setChat(data.message)
    }
  }
})

// Chat system
const chatInput = document.getElementById('chatInput')

function openChat() {
  gameState.chatting = true
  chatInput.style.display = 'block'
  chatInput.focus()
}

function closeChat() {
  gameState.chatting = false
  chatInput.style.display = 'none'
  chatInput.value = ''
}

function sendChat() {
  const message = chatInput.value.trim()
  if (message && gameState.connected) {
    socket.emit('chatMessage', {
      contractAddress: gameState.contractAddress,
      message: message
    })
  }
  closeChat()
}

// Chat input handlers
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendChat()
  } else if (e.key === 'Escape') {
    closeChat()
  }
})

// Keyboard event handlers - CHANGED TO ARROW KEYS
window.addEventListener('keydown', (e) => {
  // Handle chat opening
  if (e.key === 'Enter' && !gameState.chatting) {
    e.preventDefault()
    openChat()
    return
  }
  
  // Handle movement only when not chatting
  if (!gameState.chatting) {
    switch (e.key) {
      case 'ArrowUp':
        keys.ArrowUp.pressed = true
        lastKey = 'ArrowUp'
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = true
        lastKey = 'ArrowLeft'
        break
      case 'ArrowDown':
        keys.ArrowDown.pressed = true
        lastKey = 'ArrowDown'
        break
      case 'ArrowRight':
        keys.ArrowRight.pressed = true
        lastKey = 'ArrowRight'
        break
    }
  }
})

window.addEventListener('keyup', (e) => {
  if (!gameState.chatting) {
    switch (e.key) {
      case 'ArrowUp':
        keys.ArrowUp.pressed = false
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = false
        break
      case 'ArrowDown':
        keys.ArrowDown.pressed = false
        break
      case 'ArrowRight':
        keys.ArrowRight.pressed = false
        break
    }
  }
})

// Audio handling (from your original code)
let clicked = false
addEventListener('click', () => {
  if (!clicked && typeof audio !== 'undefined' && audio.Map) {
    audio.Map.play()
    clicked = true
  }
})

// Start the game
animate()
console.log('Multiplayer Pokemon game initialized!')