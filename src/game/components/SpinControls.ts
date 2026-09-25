import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import type { UiTextures } from '../uiTextures'

export type SpinActions = {
  spin: () => void
  decreaseBet: () => void
  increaseBet: () => void
  toggleTurbo: () => void
  toggleAuto: () => void
}

export class SpinControls extends Container {
  private readonly spinButton: Container
  private readonly spinGlyph: Sprite
  private readonly turboIcon: Sprite
  private readonly autoIcon: Sprite
  private isSpinning = false

  constructor(actions: SpinActions, ui: UiTextures) {
    super()
    this.addChild(new Graphics().rect(0, 0, 445, 4).fill({ color: '#4d2417', alpha: .75 }))
    this.turboIcon = this.iconButton(ui.controls.turbo, 49, 63, 21, 23, actions.toggleTurbo)
    this.iconButton(ui.controls.minus, 121, 63, 18, 3, actions.decreaseBet)
    this.spinButton = this.makeSpin(actions.spin, ui.spinButton, ui.spinArrows)
    this.iconButton(ui.controls.plus, 324, 63, 20, 20, actions.increaseBet)
    this.autoIcon = this.iconButton(ui.controls.auto, 396, 63, 23, 23, actions.toggleAuto)
    this.spinGlyph = this.spinButton.children[1] as Sprite

    const rotateIdle = () => {
      if (this.isSpinning) this.spinGlyph.rotation += 0.08
      requestAnimationFrame(rotateIdle)
    }
    requestAnimationFrame(rotateIdle)
  }

  private iconButton(texture: Texture, x: number, y: number, width: number, height: number, action: () => void) {
    const button = new Container()
    button.position.set(x, y)
    button.addChild(new Graphics().circle(0, 0, 23).fill({ color: '#1f110d', alpha: .75 }))
    const icon = new Sprite(texture)
    icon.anchor.set(.5)
    icon.width = width
    icon.height = height
    button.addChild(icon)
    this.activate(button, action)
    this.addChild(button)
    return icon
  }

  private makeSpin(action: () => void, texture: Texture, arrows: Texture) {
    const button = new Container()
    button.position.set(222.5, 58)
    const capturedButton = new Sprite(texture)
    capturedButton.anchor.set(.5)
    capturedButton.width = 110
    capturedButton.height = 100
    capturedButton.position.x = -6
    button.addChild(capturedButton)
    const glyph = new Sprite(arrows)
    glyph.anchor.set(.5)
    glyph.width = 77
    glyph.height = 77
    button.addChild(glyph)
    this.activate(button, action)
    this.addChild(button)
    return button
  }

  private activate(button: Container, action: () => void) {
    button.eventMode = 'static'; button.cursor = 'pointer'
    button.on('pointerdown', () => button.scale.set(.94))
    button.on('pointerupoutside', () => button.scale.set(1))
    button.on('pointerup', () => { button.scale.set(1); action() })
  }

  setSpinning(active: boolean) {
    this.isSpinning = active
    this.spinButton.alpha = active ? .65 : 1
    this.spinGlyph.rotation = 0
  }

  setTurbo(active: boolean) { this.turboIcon.tint = active ? '#fff08a' : '#ffffff' }
  setAuto(active: boolean) {
    this.autoIcon.tint = active ? '#fff08a' : '#ffffff'
  }
}
