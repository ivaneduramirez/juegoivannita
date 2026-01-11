export class InputHandler {
    constructor() {
        this.keys = {
            a: { pressed: false },
            d: { pressed: false },
            w: { pressed: false },
            ArrowRight: { pressed: false },
            ArrowLeft: { pressed: false },
            ArrowUp: { pressed: false }
        }

        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                // Player 1
                case 'd':
                    this.keys.d.pressed = true
                    break
                case 'a':
                    this.keys.a.pressed = true
                    break
                case 'w':
                    this.keys.w.pressed = true
                    break

                // Player 2
                case 'ArrowRight':
                    this.keys.ArrowRight.pressed = true
                    break
                case 'ArrowLeft':
                    this.keys.ArrowLeft.pressed = true
                    break
                case 'ArrowUp':
                    this.keys.ArrowUp.pressed = true
                    break
            }
        })

        window.addEventListener('keyup', (event) => {
            switch (event.key) {
                // Player 1
                case 'd':
                    this.keys.d.pressed = false
                    break
                case 'a':
                    this.keys.a.pressed = false
                    break
                case 'w':
                    this.keys.w.pressed = false
                    break

                // Player 2
                case 'ArrowRight':
                    this.keys.ArrowRight.pressed = false
                    break
                case 'ArrowLeft':
                    this.keys.ArrowLeft.pressed = false
                    break
                case 'ArrowUp':
                    this.keys.ArrowUp.pressed = false
                    break
            }
        })
    }
}
