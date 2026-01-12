import { Fighter } from './Fighter.js'
import { InputHandler } from './InputHandler.js'
import { rectangularCollision } from '../utils.js'

export class Game {
    constructor(canvas, context) {
        this.canvas = canvas
        this.context = context
        this.fighters = []
        this.inputInfo = new InputHandler()
        this.timer = 60
        this.timerId
        this.gameOver = false
        this.restartButton = document.getElementById('restartButton')
        this.impact = null

        if (this.restartButton) {
            this.restartButton.addEventListener('click', () => {
                this.resetGame()
            })
        }

        window.addEventListener('keydown', (event) => {
            if (this.gameOver) return

            switch (event.key) {
                // Player 1
                case 'd': this.player1.lastKey = 'd'; break
                case 'a': this.player1.lastKey = 'a'; break
                case ' ': this.player1.attack(); break

                // Player 2
                case 'ArrowRight': this.player2.lastKey = 'ArrowRight'; break
                case 'ArrowLeft': this.player2.lastKey = 'ArrowLeft'; break
                case 'ArrowDown': this.player2.attack(); break
            }
        })

        this.init()

        this.background = new Image()
        this.background.src = '/assets/background.png'
    }

    start() {
        this.decreaseTimer()
        this.animate()
    }

    init() {
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.player1 = new Fighter({
            position: { x: 150, y: 20 },
            velocity: { x: 0, y: 0 },
            color: 'red',
            imageSrc: '/assets/michael_spritesheet.png',
            sheetCols: 2,
            sheetRows: 2,
            scale: 0.8,
            sprites: {
                idle: { row: 0, col: 0 },
                run: { row: 0, col: 0 },
                jump: { row: 0, col: 0 },
                fall: { row: 0, col: 0 },
                attack: { row: 0, col: 1 },
                attack2: { row: 1, col: 0 },
                takeHit: { row: 1, col: 1, forceFlip: true }
            },
            context: this.context,
            offset: { x: 20, y: 0 }
        })

        this.player2 = new Fighter({
            position: { x: 800, y: 20 },
            velocity: { x: 0, y: 0 },
            color: 'blue',
            imageSrc: '/assets/chito_spritesheet.png',
            sheetCols: 2,
            sheetRows: 2,
            scale: 0.8,
            sprites: {
                idle: { row: 0, col: 0 },
                run: { row: 0, col: 0 },
                jump: { row: 0, col: 0 },
                fall: { row: 0, col: 0 },
                attack: { row: 0, col: 1 },
                attack2: { row: 1, col: 0 },
                takeHit: { row: 1, col: 1, noFlip: true }
            },
            context: this.context,
            offset: { x: 20, y: 0 }
        })

        this.player1.enemy = this.player2
        this.player2.enemy = this.player1
    }

    determineWinner({ player1, player2, timerId }) {
        clearTimeout(timerId)
        this.gameOver = true
        document.querySelector('#timer').innerHTML = 'KO'
        document.querySelector('#timer').style.backgroundColor = 'rgba(255, 0, 0, 0.5)'
        document.querySelector('#restartContainer').style.display = 'flex'

        if (player1.health === player2.health) {
            document.querySelector('#displayText').innerHTML = 'EMPATE'
        } else if (player1.health > player2.health) {
            document.querySelector('#displayText').innerHTML = 'MICHAEL MORALES GANA!'
        } else if (player1.health < player2.health) {
            document.querySelector('#displayText').innerHTML = 'CHITO VERA GANA!'
        }
    }

    resetGame() {
        this.player1.health = 100
        this.player2.health = 100
        this.player1.dead = false
        this.player2.dead = false
        this.player1.position = { x: 100, y: 20 }
        this.player2.position = { x: 800, y: 20 }
        this.player1.framesCurrent = 0
        this.player2.framesCurrent = 0

        document.querySelector('#player1Health').style.width = '100%'
        document.querySelector('#player2Health').style.width = '100%'
        document.querySelector('#timer').innerHTML = '60'
        document.querySelector('#timer').style.backgroundColor = 'black'
        document.querySelector('#displayText').innerHTML = ''
        document.querySelector('#restartContainer').style.display = 'none'

        this.timer = 60
        this.gameOver = false
        this.decreaseTimer()
    }

    decreaseTimer() {
        if (this.timer > 0) {
            this.timerId = setTimeout(() => this.decreaseTimer(), 1000)
            this.timer--
            document.querySelector('#timer').innerHTML = this.timer
        }

        if (this.timer === 0) {
            this.determineWinner({ player1: this.player1, player2: this.player2, timerId: this.timerId })
        }
    }

    animate() {
        window.requestAnimationFrame(() => this.animate())

        // Clear and Background
        this.context.fillStyle = 'black'
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)

        if (this.background.complete && this.background.naturalWidth > 0) {
            this.context.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height)
        } else {
            // Fallback octagon floor
            this.context.fillStyle = '#333'
            this.context.fillRect(0, this.canvas.height - 94, this.canvas.width, 94)
        }

        // Overlay for better contrast
        this.context.fillStyle = 'rgba(0,0,0,0.1)'
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)

        // Player 1 Movement
        this.player1.velocity.x = 0
        if (this.inputInfo.keys.a.pressed && this.player1.lastKey === 'a') {
            this.player1.velocity.x = -5
        } else if (this.inputInfo.keys.d.pressed && this.player1.lastKey === 'd') {
            this.player1.velocity.x = 5
        }

        // Player 2 Movement
        this.player2.velocity.x = 0
        if (this.inputInfo.keys.ArrowLeft.pressed && this.player2.lastKey === 'ArrowLeft') {
            this.player2.velocity.x = -5
        } else if (this.inputInfo.keys.ArrowRight.pressed && this.player2.lastKey === 'ArrowRight') {
            this.player2.velocity.x = 5
        }

        // Jumping
        const groundThreshold = this.canvas.height - 94
        if (this.inputInfo.keys.w.pressed && this.player1.position.y + this.player1.height >= groundThreshold - 1) {
            this.player1.velocity.y = -20
        }
        if (this.inputInfo.keys.ArrowUp.pressed && this.player2.position.y + this.player2.height >= groundThreshold - 1) {
            this.player2.velocity.y = -20
        }

        // Update Fighters (draw order affects visibility when overlapping)
        const p1 = this.player1
        const p2 = this.player2
        let first = p1
        let second = p2

        if (p1.isAttacking && !p2.isAttacking) {
            first = p2
            second = p1
        } else if (p2.isAttacking && !p1.isAttacking) {
            first = p1
            second = p2
        } else if (p1.position.x > p2.position.x) {
            first = p2
            second = p1
        }

        first.update()
        second.update()

        if (this.impact) {
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
            if (now < this.impact.until) {
                this.context.save()
                this.context.globalCompositeOperation = 'lighter'
                this.context.fillStyle = 'rgba(255, 235, 140, 0.85)'
                this.context.beginPath()
                this.context.arc(this.impact.x, this.impact.y, 12, 0, Math.PI * 2)
                this.context.fill()
                this.context.restore()
            } else {
                this.impact = null
            }
        }

        // Physics: Body Collision (Pushing)
        // If neither is jumping effectively (close to ground), prevent x-overlap
        // Simple bounding box push
        // Physics: Body Collision (Pushing)
        // Only push if both are on the ground (approximate check)
        // 94 is the ground offset, character height is roughly 220
        const groundY = this.canvas.height - 94 - 220
        const onGroundThreshold = 10 // pixels tolerance

        const p1OnGround = this.player1.position.y >= groundY - onGroundThreshold
        const p2OnGround = this.player2.position.y >= groundY - onGroundThreshold

        if (p1OnGround && p2OnGround) {
            const p1Right = this.player1.position.x + this.player1.width
            const p1Left = this.player1.position.x
            const p2Right = this.player2.position.x + this.player2.width
            const p2Left = this.player2.position.x

            if (p1Right > p2Left && p1Left < p2Right) {
                // Collision detected
                const p1Center = p1Left + this.player1.width / 2
                const p2Center = p2Left + this.player2.width / 2
                const overlap = Math.min(p1Right, p2Right) - Math.max(p1Left, p2Left)
                const movingTowards =
                    (this.player1.velocity.x > 0 && this.player2.velocity.x < 0) ||
                    (this.player2.velocity.x > 0 && this.player1.velocity.x < 0)

                // Only separate when actually pushing into each other or heavily overlapping
                if (movingTowards || overlap > 20) {
                    const push = Math.min(6, overlap / 2)
                    if (p1Center < p2Center) {
                        this.player1.position.x -= push
                        this.player2.position.x += push
                    } else {
                        this.player1.position.x += push
                        this.player2.position.x -= push
                    }
                }
            }
        }

        // Collision Detection
        if (
            rectangularCollision({ rectangle1: this.player1, rectangle2: this.player2 }) &&
            this.player1.isAttacking && !this.player2.dead
        ) {
            this.player1.isAttacking = false
            this.player2.takeHit()
            document.querySelector('#player2Health').style.width = this.player2.health + '%'
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
            this.impact = {
                x: this.player1.attackBox.position.x + this.player1.attackBox.width / 2,
                y: this.player1.attackBox.position.y + this.player1.attackBox.height / 2,
                until: now + 120
            }
        }

        if (
            rectangularCollision({ rectangle1: this.player2, rectangle2: this.player1 }) &&
            this.player2.isAttacking && !this.player1.dead
        ) {
            this.player2.isAttacking = false
            this.player1.takeHit()
            document.querySelector('#player1Health').style.width = this.player1.health + '%'
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
            this.impact = {
                x: this.player2.attackBox.position.x + this.player2.attackBox.width / 2,
                y: this.player2.attackBox.position.y + this.player2.attackBox.height / 2,
                until: now + 120
            }
        }

        // End Game
        if (!this.gameOver && (this.player1.health <= 0 || this.player2.health <= 0)) {
            this.determineWinner({ player1: this.player1, player2: this.player2, timerId: this.timerId })
        }
    }
}
