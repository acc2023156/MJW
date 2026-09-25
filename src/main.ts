import './style.css'
import { Application } from 'pixi.js'
import { GAME_HEIGHT, GAME_WIDTH } from './game/config'
import { GameScene } from './game/GameScene'
import { loadSymbolTextures } from './game/symbolTextures'
import { loadUiTextures } from './game/uiTextures'

const syncVisualViewport = () => {
  const viewport = window.visualViewport
  const width = viewport?.width ?? window.innerWidth
  const height = viewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--viewport-width', `${Math.round(width)}px`)
  document.documentElement.style.setProperty('--viewport-height', `${Math.round(height)}px`)
}

syncVisualViewport()
window.addEventListener('resize', syncVisualViewport, { passive: true })
window.addEventListener('orientationchange', syncVisualViewport, { passive: true })
window.visualViewport?.addEventListener('resize', syncVisualViewport, { passive: true })
window.visualViewport?.addEventListener('scroll', syncVisualViewport, { passive: true })

document.documentElement.style.setProperty(
  '--backplate-image',
  `url("${import.meta.env.BASE_URL}assets/mahjong-backplate.png")`,
)

const app = new Application()
await app.init({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundAlpha: 0,
  antialias: true,
  resolution: Math.min(devicePixelRatio, 2),
  autoDensity: true,
})

document.querySelector<HTMLDivElement>('#app')!.appendChild(app.canvas)
const [symbolTextures, uiTextures] = await Promise.all([
  loadSymbolTextures(),
  loadUiTextures(),
])
const scene = new GameScene(symbolTextures, uiTextures)
app.stage.addChild(scene)
if (new URLSearchParams(location.search).has('audioReview')) {
  const { showAudioReview } = await import('./game/audioReview')
  void showAudioReview()
}
// Local-only visual check: all symbol types, transparent specials, and UI states.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('artPreview')) {
  const params = new URLSearchParams(location.search)
  scene.showAssetPreview(Number(params.get('multiplier') ?? 1), params.has('free'))
}
