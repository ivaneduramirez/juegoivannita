export class Fighter {
    constructor({ position, velocity, color, imageSrc, context, offset = { x: 0, y: 0 }, sheetCols = 1, sheetRows = 1, sprites, scale = 1, framesMax = 1 }) {
        this.position = position
        this.velocity = velocity
        this.width = 80
        this.height = 220
        this.color = color
        this.lastKey
        this.context = context

        // Spritesheet Layout
        this.sheetCols = sheetCols
        this.sheetRows = sheetRows

        // Animation State
        this.framesMax = framesMax // Frames per animation cycle (default 1 for static)
        this.framesCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 5

        this.offset = offset
        this.scale = scale
        this.sprites = sprites
        this.frameY = 0 // Vertical row
        this.startFrame = 0 // Starting column for current animation

        this.transparentLoaded = false
        this.image = new Image()
        this.image.crossOrigin = "Anonymous"
        this.image.src = imageSrc
        this.image.onload = () => { this.processTransparency() }

        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            offset: offset,
            width: 150,
            height: 50
        }

        this.gravity = 0.7
        this.isAttacking = false
        this.health = 100
        this.dead = false
        this.isCoolingDown = false
        this.currSprite = null // Allow first switch to happen
        this.attackSprite = 'attack'
        this.hitStunUntil = 0
        this.attackHoldUntil = 0
        this.facingRight = true
        this.hitFacingRight = null

        // Immediately trigger idle state setup if sprites exist
        if (this.sprites) {
            this.switchSprite('idle')
        }
    }

    processTransparency() {
        try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = this.image.width
            canvas.height = this.image.height
            ctx.drawImage(this.image, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data

            // Calibrate background color (sample top-left area)
            const candidates = []
            const sampleLimit = Math.min(64, canvas.width, canvas.height)
            for (let y = 4; y < sampleLimit; y += 8) {
                for (let x = 4; x < sampleLimit; x += 8) {
                    const idx = (y * canvas.width + x) * 4
                    const r = data[idx]
                    const g = data[idx + 1]
                    const b = data[idx + 2]
                    const max = Math.max(r, g, b)
                    const min = Math.min(r, g, b)
                    const brightness = (r + g + b) / 3
                    if (brightness > 30 && brightness < 245) {
                        candidates.push({ r, g, b, brightness })
                    }
                }
            }

            let bgColor = null
            if (candidates.length >= 10) {
                // Background color: pick most common bucket
                const buckets = new Map()
                for (const c of candidates) {
                    const key = `${Math.round(c.r / 16)},${Math.round(c.g / 16)},${Math.round(c.b / 16)}`
                    buckets.set(key, (buckets.get(key) || 0) + 1)
                }
                let bestKey = null
                let bestCount = 0
                for (const [key, count] of buckets.entries()) {
                    if (count > bestCount) {
                        bestKey = key
                        bestCount = count
                    }
                }
                if (bestKey) {
                    const [kr, kg, kb] = bestKey.split(',').map((v) => parseInt(v, 10) * 16)
                    bgColor = { r: kr, g: kg, b: kb }
                }

            }

            const nearBgColor = (r, g, b) => {
                if (!bgColor) return false
                const dr = r - bgColor.r
                const dg = g - bgColor.g
                const db = b - bgColor.b
                return (dr * dr + dg * dg + db * db) < (72 * 72)
            }
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i]
                const g = data[i + 1]
                const b = data[i + 2]
                const max = Math.max(r, g, b)
                const min = Math.min(r, g, b)
                const brightness = (r + g + b) / 3

                // Remove only the sampled background color (e.g. violet)
                if (nearBgColor(r, g, b)) {
                    data[i + 3] = 0
                } else if (bgColor) {
                    const dr = r - bgColor.r
                    const dg = g - bgColor.g
                    const db = b - bgColor.b
                    const dist2 = dr * dr + dg * dg + db * db
                    // Feather edge to reduce halos near background
                    if (dist2 < (110 * 110)) {
                        const alpha = Math.min(255, Math.max(0, (dist2 - (72 * 72)) / ((110 * 110) - (72 * 72)) * 255))
                        data[i + 3] = Math.min(data[i + 3], alpha)
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0)
            this.processedImage = new Image()
            this.processedImage.src = canvas.toDataURL()
            this.processedImage.onload = () => { this.transparentLoaded = true }
        } catch (e) {
            console.error('Transparency Error:', e)
        }
    }

    draw() {
        const img = this.transparentLoaded ? this.processedImage : this.image

        if (!img || !img.complete || img.naturalWidth === 0) {
            this.context.fillStyle = this.color
            this.context.fillRect(this.position.x, this.position.y, this.width, this.height)
            return
        }

        const rows = this.sheetRows || 1
        const frameWidth = img.width / this.sheetCols
        const frameHeight = img.height / rows

        const facingRightDefault = !this.enemy || this.position.x < this.enemy.position.x
        if (this.currSprite !== 'takeHit') {
            this.facingRight = facingRightDefault
        }
        const facingRight = this.currSprite === 'takeHit' && this.hitFacingRight !== null
            ? this.hitFacingRight
            : facingRightDefault
        let shouldFlip = !facingRight
        if (this.currSprite === 'takeHit') {
            shouldFlip = facingRightDefault
        }

        this.context.save()

        if (shouldFlip) {
            this.context.translate(this.position.x + this.width / 2, this.position.y)
            this.context.scale(-1, 1)
            this.context.translate(-(this.position.x + this.width / 2), -this.position.y)
        }

        const renderScale = this.scale || 1
        const drawWidth = frameWidth * renderScale
        const drawHeight = frameHeight * renderScale

        // Bobbing
        let bobOffset = 0
        if (this.currSprite === 'idle') {
            bobOffset = Math.sin(Date.now() / 200) * 3
        }

        // Per-sprite state offset
        let stateOffset = { x: 0, y: 0 }
        if (this.sprites && this.currSprite && this.sprites[this.currSprite]?.offset) {
            const sOff = this.sprites[this.currSprite].offset
            stateOffset.x = sOff.x || 0
            stateOffset.y = sOff.y || 0
        }

        let xPos = this.position.x - (drawWidth - this.width) / 2 + this.offset.x + stateOffset.x
        let yPos = (this.position.y + this.height) - drawHeight + this.offset.y + bobOffset + stateOffset.y

        // Source Clipping (remove 1px from edges to fix lines)
        const clipX = 1
        const clipY = 1
        const srcW = frameWidth - 2
        const srcH = frameHeight - 2

        this.context.drawImage(
            img,
            this.framesCurrent * frameWidth + clipX,
            this.frameY * frameHeight + clipY,
            srcW,
            srcH,
            xPos,
            yPos,
            drawWidth,
            drawHeight
        )
        this.context.restore()

        // Debug Hitbox
        // this.context.strokeStyle = 'rgba(0, 255, 0, 0.5)'
        // this.context.lineWidth = 1
        // this.context.strokeRect(this.position.x, this.position.y, this.width, this.height)
    }

    animateFrames() {
        this.framesElapsed++

        if (this.framesElapsed % this.framesHold === 0) {
            // Loop between startFrame and startFrame + framesMax - 1
            const endFrame = this.startFrame + this.framesMax - 1

            if (this.framesCurrent < endFrame) {
                this.framesCurrent++
            } else {
                this.framesCurrent = this.startFrame
            }
        }
    }

    update() {
        this.draw()
        if (!this.dead) this.animateFrames()

        // Sync animation state
        if (this.sprites && !this.dead) {
            if (this.currSprite === 'takeHit' && this.health > 0) {
                const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
                if (now < this.hitStunUntil) return
                this.switchSprite('idle')
                return
            }

            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
            if (now < this.attackHoldUntil) {
                this.switchSprite(this.attackSprite || 'attack')
            } else if (this.isAttacking) {
                this.switchSprite(this.attackSprite || 'attack')
            } else if (this.velocity.y < 0) {
                this.switchSprite('jump')
            } else if (this.velocity.y > 0) {
                this.switchSprite('fall')
            } else if (this.velocity.x !== 0) {
                this.switchSprite('run')
            } else {
                this.switchSprite('idle')
            }
        }

        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        const groundLevel = this.context.canvas.height - 94
        if (this.position.y + this.height + this.velocity.y >= groundLevel) {
            this.velocity.y = 0
            this.position.y = groundLevel - this.height
        } else {
            this.velocity.y += this.gravity
        }

        if (this.position.x < 0) this.position.x = 0
        if (this.position.x + this.width > this.context.canvas.width) this.position.x = this.context.canvas.width - this.width

        const facingRight = !this.enemy || this.position.x < this.enemy.position.x
        this.attackBox.position.x = facingRight ?
            this.position.x + this.attackBox.offset.x :
            this.position.x - this.attackBox.width + this.width - this.attackBox.offset.x

        this.attackBox.position.y = this.position.y + 50
    }

    attack() {
        if (this.isCoolingDown || this.dead || this.isAttacking) return
        if (this.sprites?.attack2) {
            this.attackSprite = this.attackSprite === 'attack' ? 'attack2' : 'attack'
        } else {
            this.attackSprite = 'attack'
        }
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
        this.attackHoldUntil = now + 180
        this.isAttacking = true
        this.isCoolingDown = true

        setTimeout(() => {
            this.isAttacking = false
        }, 500)
        setTimeout(() => {
            this.isCoolingDown = false
        }, 800)
    }

    takeHit() {
        this.health -= 10
        if (this.sprites?.takeHit) this.switchSprite('takeHit')
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
        this.hitStunUntil = now + 320
        this.hitFacingRight = this.facingRight
        if (this.health <= 0) {
            this.health = 0
            this.dead = true
        }
    }

    switchSprite(name) {
        if (!this.sprites?.[name]) return

        if (this.currSprite === name) return

        this.currSprite = name
        if (name !== 'takeHit') this.hitFacingRight = null
        const s = this.sprites[name]

        this.frameY = s.row
        this.startFrame = s.col
        this.framesCurrent = s.col

        // Use frames from config or default to 1 (fix for constructor override)
        this.framesMax = s.frames || 1

        this.framesElapsed = 0
    }
}
