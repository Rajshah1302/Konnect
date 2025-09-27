const CANVAS_WIDTH = 1024
const CANVAS_HEIGHT = 576
const MOVEMENT_SPEED = 3
const MOVEMENT_SYNC_INTERVAL = 100
const SPRITE_FRAME_HOLD = 10
const COLLISION_MAP_WIDTH = 70
const keyMap = {
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight'
}
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = CANVAS_WIDTH
canvas.height = CANVAS_HEIGHT

const socket = io()

const gameState = {
  paused: false,
  contractAddress: null,
  myPlayerId: null,
  myPlayerName: null,
  otherPlayers: new Map(),
  connected: false,
  chatting: false,
  lastMovementTime: 0,
  lastKey: '',
  moving: false
}

const battle = {
  intiated: false
}

const domElements = {
  playerInfo: document.getElementById('playerInfo'),
  roomInfo: document.getElementById('roomInfo'),
  playersCount: document.getElementById('playersCount'),
  connectionStatus: document.getElementById('connectionStatus'),
  chatInput: document.getElementById('chatInput')
}

function getNearbyPlayers(radius = 50) {
  const me = getPlayerWorldPosition()
  const nearby = []

  for (const [id, other] of gameState.otherPlayers.entries()) {
    const dx = me.x - other.worldPosition.x
    const dy = me.y - other.worldPosition.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist <= radius) {
      nearby.push({ id, name: other.playerName })
    }
  }
  return nearby
}

function getContractAddress() {
  const path = window.location.pathname
  console.log('🌐 Current URL path:', path)

  const match = path.match(/\/game\/([^\/]+)/)
  const address = match?.[1]

  console.log('📍 Extracted contract address:', address)
  return address
}

let uiUpdateScheduled = false
function updateUI() {
  if (uiUpdateScheduled) return

  uiUpdateScheduled = true
  requestAnimationFrame(() => {
    const { myPlayerName, contractAddress, connected } = gameState
    player.name = myPlayerName
    const playerCount = gameState.otherPlayers.size + 1

    domElements.playerInfo.textContent = `Player: ${
      myPlayerName || 'Loading...'
    }`
    domElements.roomInfo.textContent = `Room: ${contractAddress?.slice(
      0,
      10
    )}...`
    domElements.playersCount.textContent = `Players: ${playerCount}`

    const statusEl = domElements.connectionStatus
    if (connected) {
      statusEl.textContent = 'Connected'
      statusEl.className = 'connected'
    } else {
      statusEl.textContent = 'Disconnected'
      statusEl.className = 'disconnected'
    }

    uiUpdateScheduled = false
  })
}

function createCollisionMap() {
  const collisionsMap = []
  for (let i = 0; i < collisions.length; i += COLLISION_MAP_WIDTH) {
    collisionsMap.push(collisions.slice(i, COLLISION_MAP_WIDTH + i))
  }
  return collisionsMap
}

function createBoundaries() {
  const collisionsMap = createCollisionMap()
  const boundaries = []
  const offset = { x: -735, y: -610 }

  collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
      if (symbol === 1025) {
        boundaries.push(
          new Boundary({
            position: {
              x: j * Boundary.width + offset.x,
              y: i * Boundary.height + offset.y
            }
          })
        )
      }
    })
  })

  return { boundaries, offset }
}

const { boundaries, offset } = createBoundaries()

async function loadImages() {
  const imageUrls = {
    background: './img/Pellet Town.png',
    foreground: './img/foregroundObjects.png',
    playerDown: './img/playerDown.png',
    playerUp: './img/playerUp.png',
    playerLeft: './img/playerLeft.png',
    playerRight: './img/playerRight.png'
  }

  const imagePromises = Object.entries(imageUrls).map(([key, src]) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve([key, img])
      img.onerror = reject
      img.src = src
    })
  })

  const loadedImages = await Promise.all(imagePromises)
  return Object.fromEntries(loadedImages)
}

let player, background, foreground, movables, images

async function initializeGame() {
  try {
    images = await loadImages()

    player = new Sprite({
      position: {
        x: CANVAS_WIDTH / 2 - 192 / 4 / 2,
        y: CANVAS_HEIGHT / 2 - 68 / 2
      },
      image: images.playerDown,
      frames: {
        max: 4,
        hold: SPRITE_FRAME_HOLD
      },
      sprites: {
        up: images.playerUp,
        left: images.playerLeft,
        right: images.playerRight,
        down: images.playerDown
      }
    })

    background = new Sprite({
      position: { x: offset.x, y: offset.y },
      image: images.background
    })

    foreground = new Sprite({
      position: { x: offset.x, y: offset.y },
      image: images.foreground
    })

    movables = [background, ...boundaries, foreground]

    animate()
    console.log('Multiplayer Pokemon game initialized!')
  } catch (error) {
    console.error('Failed to load game images:', error)
  }
}

const keys = {
  ArrowUp: { pressed: false },
  ArrowDown: { pressed: false },
  ArrowLeft: { pressed: false },
  ArrowRight: { pressed: false }
}

function getPlayerWorldPosition() {
  return {
    x: CANVAS_WIDTH / 2 - 192 / 4 / 2 - background.position.x,
    y: CANVAS_HEIGHT / 2 - 68 / 2 - background.position.y
  }
}

function checkCollision(direction) {
  let offsetX = 0,
    offsetY = 0

  switch (direction) {
    case 'ArrowUp':
      offsetY = MOVEMENT_SPEED
      break
    case 'ArrowDown':
      offsetY = -MOVEMENT_SPEED
      break
    case 'ArrowLeft':
      offsetX = MOVEMENT_SPEED
      break
    case 'ArrowRight':
      offsetX = -MOVEMENT_SPEED
      break
  }

  for (const boundary of boundaries) {
    if (
      rectangularCollision({
        rectangle1: player,
        rectangle2: {
          ...boundary,
          position: {
            x: boundary.position.x + offsetX,
            y: boundary.position.y + offsetY
          }
        }
      })
    ) {
      return true
    }
  }
  return false
}

function handleMovement() {
  const direction = gameState.lastKey
  if (!keys[direction]?.pressed) {
    player.animate = false
    return
  }

  if (checkCollision(direction)) {
    player.animate = false
    return
  }

  player.animate = true
  gameState.moving = true

  switch (direction) {
    case 'ArrowUp':
      player.image = player.sprites.up
      movables.forEach((movable) => (movable.position.y += MOVEMENT_SPEED))
      break
    case 'ArrowDown':
      player.image = player.sprites.down
      movables.forEach((movable) => (movable.position.y -= MOVEMENT_SPEED))
      break
    case 'ArrowLeft':
      player.image = player.sprites.left
      movables.forEach((movable) => (movable.position.x += MOVEMENT_SPEED))
      break
    case 'ArrowRight':
      player.image = player.sprites.right
      movables.forEach((movable) => (movable.position.x -= MOVEMENT_SPEED))
      break
  }

  syncPlayerPosition()
}

function syncPlayerPosition() {
  if (!gameState.connected || !gameState.moving) return

  const now = Date.now()
  if (now - gameState.lastMovementTime <= MOVEMENT_SYNC_INTERVAL) return

  const direction = gameState.lastKey.replace('Arrow', '').toLowerCase()
  const worldPos = getPlayerWorldPosition()

  socket.emit('playerMove', {
    contractAddress: gameState.contractAddress,
    position: worldPos,
    direction: direction,
    animate: player.animate
  })

  gameState.lastMovementTime = now
  gameState.moving = false
}

let animationId
function animate() {
  if (gameState.paused) return
  animationId = requestAnimationFrame(animate)
  c.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  background.draw()

  for (const otherPlayer of gameState.otherPlayers.values()) {
    otherPlayer.renderPosition = {
      x: otherPlayer.worldPosition.x + background.position.x,
      y: otherPlayer.worldPosition.y + background.position.y
    }
    otherPlayer.draw()
  }

  player.draw()

  foreground.draw()

  if (battle.intiated) {
    const btn = document.getElementById('challengeBtn')
    btn.style.display = 'none'
    return
  }

  handleMovement()
  const nearby = getNearbyPlayers()
  const btn = document.getElementById('challengeBtn')

  if (nearby.length > 0) {
    btn.style.display = 'block'
    btn.onclick = () => {
      socket.emit('challengePlayer', {
        contractAddress: gameState.contractAddress,
        targetId: nearby[0].id
      })
    }
  } else {
    btn.style.display = 'none'
  }
}

socket.on('challenged', ({ fromId, name }) => {
  gameState.paused = true
  const popup = document.getElementById('challengePopup')
  document.getElementById(
    'challengeText'
  ).innerText = `${name} has challenged you!`
  popup.style.display = 'block'

  try {
    document.getElementById('acceptBtn').onclick = () => {
      socket.emit('challengeResponse', {
        contractAddress: gameState.contractAddress,
        to: fromId,
        accepted: true
      })
      popup.style.display = 'none'
      battle.intiated = true
    }

    document.getElementById('declineBtn').onclick = () => {
      socket.emit('challengeResponse', {
        contractAddress: gameState.contractAddress,
        to: fromId,
        accepted: false
      })

      popup.style.display = 'none'

      // Reset back to overworld mode
      gameState.paused = false
      battle.initiated = false // 🔑 ensure no “battle mode” flag lingers
      if (!animationId) {
        animate() // 🔑 restart main loop if you stopped it earlier
      }
    }
  } finally {
    gameState.paused = false
  }
})

socket.on('battleStart', ({ room, players }) => {
  console.log('⚔️ Entering battle:', room, players)
  const btn = document.getElementById('challengeBtn')
  btn.style.display = 'none'
  battle.intiated = true
  // Stop overworld loop
  cancelAnimationFrame(animationId)

  // Transition effect
  document.body.style.transition = 'background 1s'
  document.body.style.background = 'black'

  setTimeout(() => {
    startBattleScene(players)
  }, 1000)
})

function startBattleScene(players) {
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')

  // Clear screen
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Example: draw battle UI
  ctx.fillStyle = 'white'
  ctx.font = '20px Arial'
  ctx.fillText('⚔️ Battle Start!', 50, 50)
  ctx.fillText('Player 1: ' + players[0], 50, 100)
  ctx.fillText('Player 2: ' + players[1], 50, 150)

  // TODO: load battle sprites, abilities, etc.
}

socket.on('connect', () => {
  console.log('Connected to server')
  gameState.connected = true
  gameState.contractAddress = getContractAddress()

  if (gameState.contractAddress) {
    socket.emit('joinGame', {
      contractAddress: gameState.contractAddress,
      playerName: null
    })
  } else {
    console.error('No contract address in URL')
  }
  updateUI()
})

socket.on('disconnect', () => {
  console.log('Disconnected from server')
  gameState.connected = false
  gameState.otherPlayers.clear()
  updateUI()
})

socket.on('gameState', (data) => {
  console.log('Received game state:', data)
  gameState.myPlayerId = socket.id

  if (data.players[socket.id]) {
    gameState.myPlayerName = data.players[socket.id].name
  }

  gameState.otherPlayers.clear()
  Object.entries(data.players).forEach(([playerId, playerData]) => {
    if (playerId !== socket.id) {
      const otherPlayer = new OtherPlayer({
        position: playerData.position,
        playerId: playerId,
        playerName: playerData.name,
        direction: playerData.direction || 'down'
      })
      otherPlayer.worldPosition = playerData.position
      gameState.otherPlayers.set(playerId, otherPlayer)
    }
  })

  updateUI()
})

socket.on('playerJoined', (data) => {
  console.log('🎉 Player joined:', data.player.name)

  if (data.playerId !== socket.id) {
    const otherPlayer = new OtherPlayer({
      position: data.player.position,
      playerId: data.playerId,
      playerName: data.player.name,
      direction: data.player.direction || 'down'
    })
    otherPlayer.worldPosition = data.player.position
    gameState.otherPlayers.set(data.playerId, otherPlayer)
  }

  updateUI()
})

socket.on('playerLeft', (playerId) => {
  console.log('Player left:', playerId)
  gameState.otherPlayers.delete(playerId)
  updateUI()
})

socket.on('playerUpdate', (data) => {
  const otherPlayer = gameState.otherPlayers.get(data.playerId)
  if (otherPlayer) {
    otherPlayer.worldPosition = data.position
    otherPlayer.update({
      position: data.position,
      direction: data.direction,
      animate: data.animate
    })
  }
})

socket.on('chatMessage', (data) => {
  console.log('Chat message:', data)

  if (data.playerId === socket.id) {
    player.setChat(data.message)
  } else {
    const otherPlayer = gameState.otherPlayers.get(data.playerId)
    if (otherPlayer) {
      otherPlayer.setChat(data.message)
    }
  }
})

domElements.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    sendChat()
  }
})

function sendChat() {
  const message = domElements.chatInput.value.trim()
  if (message && gameState.connected) {
    socket.emit('chatMessage', {
      contractAddress: gameState.contractAddress,
      message: message
    })
  }
  domElements.chatInput.value = ''
}

window.addEventListener('keydown', (e) => {
  const key = keyMap[e.key]
  if (key) {
    keys[key].pressed = true
    gameState.lastKey = key
  }
})

window.addEventListener('keyup', (e) => {
  const key = keyMap[e.key]
  if (key) {
    keys[key].pressed = false
  }
})

initializeGame()
