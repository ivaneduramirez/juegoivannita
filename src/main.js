import './style.css'
import { Game } from './game/CoreGame.js'

window.onerror = function (msg, url, lineNo, columnNo, error) {
  alert('Error: ' + msg + '\nLine: ' + lineNo);
  return false;
};

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

// Initialize Game
const game = new Game(canvas, c)
window.__game = game

// Start Screen Logic
const startScreen = document.getElementById('startScreen')
const startButton = document.getElementById('startButton')
startButton.addEventListener('click', () => {
  startScreen.style.opacity = '0'
  setTimeout(() => {
    startScreen.style.display = 'none'
  }, 500)
  game.start()
})
