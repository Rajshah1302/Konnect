const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const path = require('path')
const GameManager = require('./game-manager')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 3000

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')))

// Handle static file routing explicitly for game pages
app.use('/game/:contractAddress', express.static(path.join(__dirname, '../client')))

// Game manager instance
const gameManager = new GameManager()

// Serve game page with contract address
app.get('/game/:contractAddress', (req, res) => {
  const { contractAddress } = req.params
  
  // Validate contract address format (basic ethereum address validation)
  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    return res.status(400).send('Invalid contract address format')
  }
  
  // Send the game page
  res.sendFile(path.join(__dirname, '../client/game.html'))
})

// Default route - redirect to a mock game
app.get('/', (req, res) => {
  const mockContracts = [
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xabcdef1234567890abcdef1234567890abcdef12'
  ]
  const randomContract = mockContracts[Math.floor(Math.random() * mockContracts.length)]
  res.redirect(`/game/${randomContract}`)
})

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`)
  
  // Player joins a game room
  socket.on('joinGame', (data) => {
    console.log('🎮 Join game request:', data)
    let { contractAddress, playerName } = data
    
    // Clean up contract address - remove trailing slash
    contractAddress = contractAddress.replace(/\/$/, '')
    console.log('🧹 Cleaned contract address:', contractAddress)
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      console.log('❌ Invalid contract address:', contractAddress)
      socket.emit('error', 'Invalid contract address')
      return
    }
    
    // Add player to game
    const gameState = gameManager.addPlayer(contractAddress, socket.id, playerName)
    console.log('✅ Player added to game. Game state:', {
      contractAddress,
      playerCount: Object.keys(gameState.players).length,
      players: Object.keys(gameState.players)
    })
    
    // Join the room
    socket.join(contractAddress)
    console.log('🏠 Socket joined room:', contractAddress)
    
    // Send current game state to new player
    socket.emit('gameState', gameState)
    console.log('📤 Sent game state to new player')
    
    // Notify other players in the room about new player
    socket.to(contractAddress).emit('playerJoined', {
      playerId: socket.id,
      player: gameState.players[socket.id]
    })
    console.log('📢 Notified other players about new player')
    
    console.log(`👤 Player ${gameState.players[socket.id].name} (${socket.id}) joined game ${contractAddress}`)
  })
  
  // Handle player movement
  socket.on('playerMove', (data) => {
    const { contractAddress, position, direction, animate } = data
    
    // Update player in game manager
    const updated = gameManager.updatePlayer(contractAddress, socket.id, {
      position,
      direction,
      animate,
      lastUpdate: Date.now()
    })
    
    if (updated) {
      // Broadcast movement to other players in the same room
      socket.to(contractAddress).emit('playerUpdate', {
        playerId: socket.id,
        position,
        direction,
        animate
      })
    }
  })
  
  // Handle chat messages
  socket.on('chatMessage', (data) => {
    const { contractAddress, message } = data
    
    if (!message || message.trim().length === 0 || message.length > 100) {
      return // Ignore empty or too long messages
    }
    
    const player = gameManager.getPlayer(contractAddress, socket.id)
    if (!player) return
    
    const chatData = {
      playerId: socket.id,
      playerName: player.name,
      message: message.trim(),
      timestamp: Date.now()
    }
    
    // Broadcast chat message to all players in the room (including sender)
    io.to(contractAddress).emit('chatMessage', chatData)
    
    console.log(`[${contractAddress}] ${player.name}: ${message}`)
  })
  
  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`)
    
    // Find and remove player from all games
    const contractAddress = gameManager.removePlayer(socket.id)
    
    if (contractAddress) {
      // Notify other players in the room
      socket.to(contractAddress).emit('playerLeft', socket.id)
      
      // Clean up empty games
      gameManager.cleanupEmptyGames()
    }
  })
  
  // Handle ping for connection testing
  socket.on('ping', () => {
    socket.emit('pong')
  })
})

// Cleanup inactive games every 5 minutes
setInterval(() => {
  gameManager.cleanupEmptyGames()
}, 5 * 60 * 1000)

// Start server
server.listen(PORT, () => {
  console.log(`🎮 Game server running on http://localhost:${PORT}`)
  console.log(`📝 Mock games available:`)
  console.log(`   - http://localhost:${PORT}/game/0x1234567890abcdef1234567890abcdef12345678`)
  console.log(`   - http://localhost:${PORT}/game/0xabcdef1234567890abcdef1234567890abcdef12`)
})