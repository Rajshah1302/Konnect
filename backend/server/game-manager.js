class GameManager {
  constructor() {
    this.games = {} // Store all active games
    this.playerToGame = {} // Map player socket IDs to contract addresses
  }

  // Generate random ENS-like name
  generateRandomName() {
    const adjectives = [
      'red',
      'blue',
      'swift',
      'brave',
      'cool',
      'fire',
      'ice',
      'storm',
      'shadow',
      'mystic'
    ]
    const nouns = [
      'trainer',
      'walker',
      'explorer',
      'mage',
      'knight',
      'ranger',
      'hero',
      'warrior',
      'scout',
      'hunter'
    ]
    const numbers = Math.floor(Math.random() * 9999) + 1

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]

    // ENS names are usually lowercase + .eth
    return `${adjective}${noun}${numbers}.eth`
  }

  // Generate random starting position
  generateStartingPosition() {
    // Random position within a reasonable spawn area
    return {
      x: Math.floor(Math.random() * 200) + 400, // Random between 400-600
      y: Math.floor(Math.random() * 200) + 200 // Random between 200-400
    }
  }

  // Create new game if it doesn't exist
  createGame(contractAddress) {
    if (!this.games[contractAddress]) {
      this.games[contractAddress] = {
        contractAddress,
        players: {},
        createdAt: Date.now(),
        lastActivity: Date.now()
      }
      console.log(`📦 Created new game: ${contractAddress}`)
    }
    return this.games[contractAddress]
  }

  // Add player to a game
  addPlayer(contractAddress, playerId, providedName = null) {
    // Create game if it doesn't exist
    const game = this.createGame(contractAddress)

    // Generate player name if not provided
    const playerName = providedName || this.generateRandomName()

    // Create player object
    const player = {
      id: playerId,
      name: playerName,
      position: this.generateStartingPosition(),
      direction: 'down', // Default sprite direction
      animate: false,
      joinedAt: Date.now(),
      lastUpdate: Date.now()
    }

    // Add player to game
    game.players[playerId] = player
    game.lastActivity = Date.now()

    // Map player to game
    this.playerToGame[playerId] = contractAddress

    console.log(`👤 Player ${playerName} joined game ${contractAddress}`)

    return {
      contractAddress,
      players: game.players,
      playerCount: Object.keys(game.players).length
    }
  }

  // Update player data
  updatePlayer(contractAddress, playerId, updateData) {
    const game = this.games[contractAddress]

    if (!game || !game.players[playerId]) {
      return false
    }

    // Update player data
    Object.assign(game.players[playerId], updateData)
    game.lastActivity = Date.now()

    return true
  }

  // Get specific player data
  getPlayer(contractAddress, playerId) {
    const game = this.games[contractAddress]
    return game ? game.players[playerId] : null
  }

  // Get all players in a game
  getGamePlayers(contractAddress) {
    const game = this.games[contractAddress]
    return game ? game.players : {}
  }

  // Get game state
  getGameState(contractAddress) {
    const game = this.games[contractAddress]

    if (!game) {
      return null
    }

    return {
      contractAddress,
      players: game.players,
      playerCount: Object.keys(game.players).length,
      createdAt: game.createdAt
    }
  }

  // Remove player from game
  removePlayer(playerId) {
    const contractAddress = this.playerToGame[playerId]

    if (!contractAddress) {
      return null
    }

    const game = this.games[contractAddress]

    if (game && game.players[playerId]) {
      const playerName = game.players[playerId].name
      delete game.players[playerId]
      game.lastActivity = Date.now()

      console.log(`👋 Player ${playerName} left game ${contractAddress}`)
    }

    // Remove player to game mapping
    delete this.playerToGame[playerId]

    return contractAddress
  }

  // Clean up empty games
  cleanupEmptyGames() {
    const now = Date.now()
    const EMPTY_GAME_TIMEOUT = 10 * 60 * 1000 // 10 minutes

    let cleanedCount = 0

    Object.keys(this.games).forEach((contractAddress) => {
      const game = this.games[contractAddress]
      const playerCount = Object.keys(game.players).length
      const timeSinceActivity = now - game.lastActivity

      // Remove games that are empty for more than 10 minutes
      if (playerCount === 0 && timeSinceActivity > EMPTY_GAME_TIMEOUT) {
        delete this.games[contractAddress]
        cleanedCount++
        console.log(`🧹 Cleaned up empty game: ${contractAddress}`)
      }
    })

    if (cleanedCount > 0) {
      console.log(`✨ Cleaned up ${cleanedCount} empty games`)
    }
  }

  // Get server stats
  getStats() {
    let totalPlayers = 0
    const gameCount = Object.keys(this.games).length

    Object.values(this.games).forEach((game) => {
      totalPlayers += Object.keys(game.players).length
    })

    return {
      activeGames: gameCount,
      totalPlayers,
      gamesData: Object.keys(this.games).map((contractAddress) => ({
        contractAddress,
        playerCount: Object.keys(this.games[contractAddress].players).length,
        createdAt: this.games[contractAddress].createdAt,
        lastActivity: this.games[contractAddress].lastActivity
      }))
    }
  }

  // Check if player exists in any game
  playerExists(playerId) {
    return this.playerToGame[playerId] !== undefined
  }

  // Get contract address for a player
  getPlayerGame(playerId) {
    return this.playerToGame[playerId] || null
  }
}

module.exports = GameManager
