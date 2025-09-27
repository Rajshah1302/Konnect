class Sprite {
  constructor({
    position,
    velocity,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    width,
    height,
    name = "Raj.eth"
  }) {
    this.position = position
    this.image = image ? new Image() : null
    this.frames = { ...frames, val: 0, elapsed: 0 }
    this.animate = animate
    this.sprites = sprites
    this.opacity = 1
    this.rotation = rotation
    this.velocity = velocity
    this.name = name
    // Chat functionality
    this.chatMessage = null
    this.chatTimer = null

    // Set dimensions if provided, otherwise calculate from image
    this.width = width
    this.height = height

    if (this.image && image) {
      this.image.onload = () => {
        if (!this.width) this.width = this.image.width / this.frames.max
        if (!this.height) this.height = this.image.height
      }
      this.image.src = image.src
    }
  }

  setChat(message) {
    this.chatMessage = message

    // Clear existing timer
    if (this.chatTimer) {
      clearTimeout(this.chatTimer)
    }

    // Set timer to clear message after 3 seconds
    this.chatTimer = setTimeout(() => {
      this.chatMessage = null
      this.chatTimer = null
    }, 3000)
  }

  drawChatBubble(c, bubbleX, bubbleY) {
    if (!this.chatMessage) return

    const padding = 8
    const maxWidth = 200

    c.font = '12px Arial'
    const textWidth = Math.min(c.measureText(this.chatMessage).width, maxWidth)
    const bubbleWidth = textWidth + padding * 2
    const bubbleHeight = 20

    // Draw chat bubble background
    c.fillStyle = 'rgba(255, 255, 255, 0.95)'
    c.strokeStyle = 'black'
    c.lineWidth = 2

    // Rounded rectangle for chat bubble
    const radius = 5
    c.beginPath()
    c.moveTo(bubbleX - bubbleWidth / 2 + radius, bubbleY - bubbleHeight)
    c.lineTo(bubbleX + bubbleWidth / 2 - radius, bubbleY - bubbleHeight)
    c.quadraticCurveTo(
      bubbleX + bubbleWidth / 2,
      bubbleY - bubbleHeight,
      bubbleX + bubbleWidth / 2,
      bubbleY - bubbleHeight + radius
    )
    c.lineTo(bubbleX + bubbleWidth / 2, bubbleY - radius)
    c.quadraticCurveTo(
      bubbleX + bubbleWidth / 2,
      bubbleY,
      bubbleX + bubbleWidth / 2 - radius,
      bubbleY
    )
    c.lineTo(bubbleX - bubbleWidth / 2 + radius, bubbleY)
    c.quadraticCurveTo(
      bubbleX - bubbleWidth / 2,
      bubbleY,
      bubbleX - bubbleWidth / 2,
      bubbleY - radius
    )
    c.lineTo(bubbleX - bubbleWidth / 2, bubbleY - bubbleHeight + radius)
    c.quadraticCurveTo(
      bubbleX - bubbleWidth / 2,
      bubbleY - bubbleHeight,
      bubbleX - bubbleWidth / 2 + radius,
      bubbleY - bubbleHeight
    )
    c.closePath()

    c.fill()
    c.stroke()

    // Draw chat text
    c.fillStyle = 'black'
    c.font = '12px Arial'
    c.textAlign = 'center'
    c.fillText(this.chatMessage, bubbleX, bubbleY - 6, maxWidth)
  }

  draw() {
    const c = document.querySelector('canvas').getContext('2d')

    if (!this.image || !this.image.complete) return

    c.save()
    c.translate(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    )
    c.rotate(this.rotation)
    c.translate(
      -this.position.x - this.width / 2,
      -this.position.y - this.height / 2
    )
    c.globalAlpha = this.opacity

    const crop = {
      position: {
        x: this.frames.val * this.width,
        y: 0
      },
      width: this.width,
      height: this.height
    }

    const image = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      width: this.width,
      height: this.height
    }

    c.drawImage(
      this.image,
      crop.position.x,
      crop.position.y,
      crop.width,
      crop.height,
      image.position.x,
      image.position.y,
      image.width,
      image.height
    )

    if (this.name) {
      c.fillStyle = 'white'
      c.strokeStyle = 'black'
      c.lineWidth = 3
      c.font = 'bold 14px Arial'
      c.textAlign = 'center'
      const nameY = this.position.y - 5
      c.strokeText(this.name, this.position.x + this.width / 2, nameY)
      c.fillText(this.name, this.position.x + this.width / 2, nameY)
    }
    c.restore()

    // Draw chat bubble if exists
    if (this.chatMessage) {
      const bubbleX = this.position.x + this.width / 2
      const bubbleY = this.position.y - 5
      this.drawChatBubble(c, bubbleX, bubbleY)
    }

    this.updateAnimation()
  }

  updateAnimation() {
    if (!this.animate) return

    if (this.frames.max > 1) {
      this.frames.elapsed++
    }

    if (this.frames.elapsed % this.frames.hold === 0) {
      if (this.frames.val < this.frames.max - 1) this.frames.val++
      else this.frames.val = 0
    }
  }
}

class Boundary {
  static width = 48
  static height = 48
  constructor({ position }) {
    this.position = position
    this.width = 48
    this.height = 48
  }

  draw() {
    const c = document.querySelector('canvas').getContext('2d')
    c.fillStyle = 'rgba(255, 0, 0, 0.0)'
    c.fillRect(this.position.x, this.position.y, this.width, this.height)
  }
}

class OtherPlayer extends Sprite {
  constructor({ position, playerId, playerName, direction = 'down' }) {
    // Call parent constructor with specific parameters for player
    super({
      position,
      frames: { max: 4, hold: 10 },
      animate: false,
      width: 48,
      height: 68
    })

    this.playerId = playerId
    this.playerName = playerName
    this.worldPosition = { ...position } // Store world position
    this.renderPosition = { ...position } // Position for rendering (will be updated each frame)
    this.direction = direction
    this.frames = { max: 4, current: 0, elapsed: 0, hold: 10 }

    // Load sprite images
    this.sprites = {
      down: new Image(),
      up: new Image(),
      left: new Image(),
      right: new Image()
    }

    this.sprites.down.src = './img/playerDown.png'
    this.sprites.up.src = './img/playerUp.png'
    this.sprites.left.src = './img/playerLeft.png'
    this.sprites.right.src = './img/playerRight.png'

    this.image = this.sprites[direction]
  }

  update({ position, direction, animate }) {
    // Update world position
    this.worldPosition = { ...position }

    // Update sprite based on direction
    if (direction && this.sprites[direction]) {
      this.direction = direction
      this.image = this.sprites[direction]
    }

    this.animate = animate
  }

  draw() {
    const c = document.querySelector('canvas').getContext('2d')

    // Only draw if the player is visible on screen
    if (
      this.renderPosition.x < -100 ||
      this.renderPosition.x > 1124 ||
      this.renderPosition.y < -100 ||
      this.renderPosition.y > 676
    ) {
      return // Don't draw if player is off-screen
    }

    // Draw the sprite
    if (this.image && this.image.complete) {
      const cropWidth = this.image.width / 4
      const crop = {
        x: this.frames.current * cropWidth,
        y: 0,
        width: cropWidth,
        height: this.image.height
      }

      c.drawImage(
        this.image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        this.renderPosition.x,
        this.renderPosition.y,
        crop.width,
        crop.height
      )

      // Animate sprite if moving
      if (this.animate) {
        this.frames.elapsed++
        if (this.frames.elapsed % this.frames.hold === 0) {
          if (this.frames.current < this.frames.max - 1) {
            this.frames.current++
          } else {
            this.frames.current = 0
          }
        }
      } else {
        this.frames.current = 0
      }
    }

    // Draw player name
    c.fillStyle = 'white'
    c.strokeStyle = 'black'
    c.lineWidth = 3
    c.font = 'bold 14px Arial'
    c.textAlign = 'center'

    const nameY = this.renderPosition.y - 5
    c.strokeText(this.playerName, this.renderPosition.x + this.width / 2, nameY)
    c.fillText(this.playerName, this.renderPosition.x + this.width / 2, nameY)

    // Draw chat message if exists (using inherited method)
    if (this.chatMessage) {
      const bubbleX = this.renderPosition.x + this.width / 2
      const bubbleY = nameY - 25
      this.drawChatBubble(c, bubbleX, bubbleY)
    }
  }
}
