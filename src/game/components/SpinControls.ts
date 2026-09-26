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
  private readonly spinFx: Graphics
  private readonly turboIcon: Sprite
  private readonly autoIcon: Sprite
  private isSpinning = false
  private spinStarted = 0

  constructor(actions: SpinActions, ui: UiTextures) {
    super()
    this.addChild(new Graphics().rect(0, 0, 445, 4).fill({ color: '#4d2417', alpha: .75 }))
    this.turboIcon = this.iconButton(ui.controls.turbo, 49, 63, 21, 23, actions.toggleTurbo)
    this.iconButton(ui.controls.minus, 121, 63, 18, 3, actions.decreaseBet)
    this.spinFx = new Graphics()
      .circle(0, 0, 51).stroke({ color: '#ffe66d', width: 5, alpha: .9 })
      .circle(0, 0, 45).stroke({ color: '#fff6b7', width: 2, alpha: .65 })
      .moveTo(-61, 0).lineTo(-52, 0).moveTo(61, 0).lineTo(52, 0)
      .moveTo(0, -61).lineTo(0, -52).moveTo(0, 61).lineTo(0, 52)
      .stroke({ color: '#ffd22e', width: 4, alpha: .8 })
    this.spinFx.position.set(222.5, 58)
    this.spinFx.visible = false
    this.addChild(this.spinFx)
    this.spinButton = this.makeSpin(actions.spin, ui.spinButton, ui.spinArrows)
    this.iconButton(ui.controls.plus, 324, 63, 20, 20, actions.increaseBet)
    this.autoIcon = this.iconButton(ui.controls.auto, 396, 63, 23, 23, actions.toggleAuto)
    this.spinGlyph = this.spinButton.children[1] as Sprite

    const animateSpin = () => {
      if (this.isSpinning) {
        const elapsed = performance.now() - this.spinStarted
        const launch = Math.min(1, elapsed / 360)
        this.spinGlyph.rotation += .075 + launch * .075
        this.spinFx.visible = true
        this.spinFx.rotation -= .035
        if (launch < 1) {
          this.spinFx.alpha = (1 - launch) * .95
          this.spinFx.scale.set(.72 + launch * .58)
        } else {
          this.spinFx.alpha = .2 + Math.sin(elapsed / 110) * .08
          this.spinFx.scale.set(1.03 + Math.sin(elapsed / 150) * .025)
        }
      }
      requestAnimationFrame(animateSpin)
    }
    requestAnimationFrame(animateSpin)
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
    this.spinButton.alpha = 1
    this.spinGlyph.rotation = 0
    this.spinStarted = performance.now()
    this.spinFx.visible = active
    this.spinFx.alpha = active ? 1 : 0
    this.spinFx.scale.set(active ? .72 : 1)
  }

  setTurbo(active: boolean) { this.turboIcon.tint = active ? '#fff08a' : '#ffffff' }
  setAuto(active: boolean) {
    this.autoIcon.tint = active ? '#fff08a' : '#ffffff'
  }
}
