import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { ReelGrid } from './components/ReelGrid'
import { SpinControls } from './components/SpinControls'
import { StatusPanel } from './components/StatusPanel'
import { AudioEngine } from './AudioEngine'
import { FREE_SPINS_AWARDED } from './config'
import type { UiTextures } from './uiTextures'
import type { SymbolArt } from './symbolTextures'

export class GameScene extends Container {
  private balance = 1000
  private bet = 10
  private win = 0
  private spinning = false
  private turbo = false
  private auto = false
  private autoTimer: number | undefined
  private freeSpinsRemaining = 0
  private freeGameWin = 0
  private readonly reels: ReelGrid
  private readonly status = new StatusPanel()
  private readonly controls: SpinControls
  private readonly winBanner: Text
  private readonly winFx = new Graphics()
  private winFxToken = 0
  private readonly multiplierLabels: Sprite[] = []
  private readonly ui: UiTextures
  private readonly fxLayer = new Container()
  private readonly audio = new AudioEngine()
  private readonly modalLayer = new Container()

  constructor(symbolTextures: SymbolArt, ui: UiTextures) {
    super()
    this.ui = ui
    this.reels = new ReelGrid(symbolTextures, ui.reelFrame)

    const redPattern = new Sprite(ui.redPattern)
    redPattern.width = 445
    redPattern.height = 505
    const woodPanel = new Sprite(ui.woodPanel)
    woodPanel.position.set(0, 499)
    woodPanel.width = 445
    woodPanel.height = 239
    this.addChild(redPattern, woodPanel)
    this.addChild(new Graphics().rect(0, 109, 445, 390).fill('#31862c'))

    const waysBar = new Sprite(ui.waysBar)
    waysBar.width = 445
    waysBar.height = 64
    const multiplierBar = new Sprite(ui.multiplierBar)
    multiplierBar.position.set(0, 64)
    multiplierBar.width = 445
    multiplierBar.height = 45
    this.addChild(waysBar, multiplierBar)
    const ways = new Sprite(ui.waysLabel)
    ways.anchor.set(0.5)
    ways.width = 126
    ways.height = 24
    ways.position.set(222.5, 34)
    this.addChild(ways)
    ;[1, 2, 3, 5].forEach((value, i) => {
      const multiplier = new Sprite(ui.multipliers[value].normal)
      multiplier.anchor.set(0.5)
      multiplier.position.set(96 + i * 82, 85)
      this.addChild(multiplier)
      this.multiplierLabels.push(multiplier)
    })
    this.setMultiplier(1)

    this.reels.position.set(10, 109)
    this.addChild(this.reels)
    this.fxLayer.position.set(10, 109)
    this.addChild(this.fxLayer)

    const winRail = new Sprite(ui.winRail)
    winRail.position.set(0, 495)
    winRail.width = 445
    winRail.height = 77
    this.addChild(winRail)
    const winBar = new Sprite(ui.winBar)
    winBar.position.set(22, 508)
    winBar.width = 401
    winBar.height = 58
    this.addChild(winBar)
    this.winFx
      .roundRect(38, 514, 369, 46, 11).fill({ color: '#ffb51d', alpha: .12 })
      .roundRect(39, 515, 367, 44, 10).stroke({ color: '#ffe36d', width: 4, alpha: .92 })
      .roundRect(44, 520, 357, 34, 8).stroke({ color: '#fff4b0', width: 2, alpha: .45 })
    this.winFx.pivot.set(222.5, 537)
    this.winFx.position.set(222.5, 537)
    this.winFx.visible = false
    this.addChild(this.winFx)
    const totalWin = new Sprite(ui.totalWinLabel)
    totalWin.anchor.set(.5); totalWin.position.set(179, 537)
    totalWin.width = 42; totalWin.height = 27; this.addChild(totalWin)
    this.winBanner = new Text({ text: '0.00', style: { fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: '900', fontStyle: 'italic', fill: '#ffe064' } })
    this.winBanner.anchor.set(0.5)
    this.winBanner.position.set(270, 538)
    this.addChild(this.winBanner)
    this.status.position.set(0, 572)
    this.addChild(this.status)

    this.controls = new SpinControls({
      spin: () => this.spin(),
      decreaseBet: () => this.changeBet(-5),
      increaseBet: () => this.changeBet(5),
      toggleTurbo: () => { this.audio.toggle(); this.turbo = !this.turbo; this.controls.setTurbo(this.turbo) },
      toggleAuto: () => this.toggleAuto(),
    }, ui)
    this.controls.position.set(0, 619)
    this.addChild(this.controls)
    this.addChild(this.modalLayer)
  }

  showAssetPreview(multiplier = 1, freeMode = false) {
    this.reels.showAssetPreview()
    this.setMultiplier(multiplier, freeMode)
  }

  private changeBet(amount: number) {
    if (this.spinning) return
    this.audio.click()
    this.bet = Math.min(100, Math.max(5, this.bet + amount))
    this.updateStatus()
  }

  private spin() {
    if (this.modalLayer.children.length > 0) return
    if (this.spinning) {
      this.reels.quickStop()
      return
    }
    const freeMode = this.freeSpinsRemaining > 0
    if (!freeMode && this.balance < this.bet) {
      if (this.balance < this.bet) this.winBanner.text = 'LOW BALANCE'
      return
    }
    this.spinning = true
    this.audio.playMusic(freeMode)
    this.audio.spin()
    if (!freeMode) this.balance -= this.bet
    this.win = 0
    this.resetWinAmount(freeMode ? `FREE ${this.freeSpinsRemaining}` : '0.00')
    this.controls.setSpinning(true)
    this.updateStatus()
    this.setMultiplier(freeMode ? 2 : 1, freeMode)
    this.reels.spin({
      freeMode,
      turbo: this.turbo,
      settle: (scatter, last) => this.audio.settle(scatter, last),
      anticipation: (active) => {
        this.audio.anticipation(active)
        if (active) this.winBanner.text = 'FREE SPINS'
      },
      tumble: (chain, multiplier, win) => {
        this.setMultiplier(multiplier, freeMode)
        this.showWinAmount(`${(win * this.bet).toFixed(2)}  X${multiplier}`)
        this.audio.highlight()
        if (chain > 1) this.audio.multiplier(multiplier)
        this.emitCoins()
      },
      clear: () => this.audio.clear(),
      drop: () => this.audio.drop(),
      complete: (totalWin, scatters) => {
        this.win = totalWin * this.bet
        this.balance += this.win
        if (freeMode) this.freeGameWin += this.win
        if (this.win > 0) this.showWinAmount(this.win.toFixed(2))
        else this.resetWinAmount('0.00')
        if (this.win > 0) this.audio.win()
        this.controls.setSpinning(false)
        this.spinning = false
        this.updateStatus()

        if (!freeMode && scatters >= 3) {
          this.startFreeGame()
          return
        }
        if (freeMode) {
          this.freeSpinsRemaining--
          if (this.freeSpinsRemaining > 0) window.setTimeout(() => this.spin(), 950)
          else window.setTimeout(() => this.finishFreeGame(), 850)
        }
      },
    })
  }

  private toggleAuto() {
    this.audio.toggle()
    this.auto = !this.auto
    this.controls.setAuto(this.auto)
    if (this.auto) {
      this.spin()
      this.autoTimer = window.setInterval(() => this.spin(), this.turbo ? 1500 : 1900)
    } else if (this.autoTimer !== undefined) {
      clearInterval(this.autoTimer)
      this.autoTimer = undefined
    }
  }

  private updateStatus() {
    this.status.setValues(this.balance, this.bet, this.win)
  }

  private setMultiplier(value: number, freeMode = false) {
    const steps = freeMode ? [2, 4, 6, 10] : [1, 2, 3, 5]
    const match = steps.findIndex(step => step >= value)
    const active = match === -1 ? steps.length - 1 : match
    this.multiplierLabels.forEach((label, index) => {
      label.texture = this.ui.multipliers[steps[index]][index === active ? 'active' : 'normal']
      const height = index === active ? 47 : 37
      label.scale.set(height / label.texture.height)
    })
  }

  private resetWinAmount(text: string) {
    this.winFxToken++
    this.winFx.visible = false
    this.winBanner.text = text
    this.winBanner.alpha = 1
    this.winBanner.scale.set(1)
    this.winBanner.position.set(270, 538)
  }

  private showWinAmount(text: string) {
    const token = ++this.winFxToken
    const start = performance.now()
    this.winBanner.text = text
    this.winBanner.alpha = 0
    this.winBanner.scale.set(.62)
    this.winBanner.position.set(270, 543)
    this.winFx.visible = true
    this.winFx.alpha = 0
    this.winFx.scale.set(.8)
    const animate = () => {
      if (token !== this.winFxToken) return
      const progress = Math.min(1, (performance.now() - start) / 430)
      const arrival = 1 - Math.pow(1 - Math.min(1, progress / .58), 3)
      const settle = progress < .58 ? 0 : (progress - .58) / .42
      const scale = progress < .58 ? .62 + arrival * .54 : 1.16 - settle * .16
      this.winBanner.alpha = Math.min(1, progress * 5)
      this.winBanner.scale.set(scale)
      this.winBanner.y = 543 - arrival * 5
      this.winFx.alpha = Math.sin(progress * Math.PI) * .9
      this.winFx.scale.set(.8 + arrival * .26)
      if (progress < 1) requestAnimationFrame(animate)
      else {
        this.winBanner.alpha = 1
        this.winBanner.scale.set(1)
        this.winBanner.y = 538
        this.winFx.visible = false
      }
    }
    requestAnimationFrame(animate)
  }

  private startFreeGame() {
    if (this.autoTimer !== undefined) {
      clearInterval(this.autoTimer)
      this.autoTimer = undefined
      this.auto = false
      this.controls.setAuto(false)
    }
    this.freeSpinsRemaining = FREE_SPINS_AWARDED
    this.audio.freeGameTrigger()
    this.freeGameWin = 0
    this.audio.playMusic(true)
    this.showModal('FREE SPINS WON', '12', 'ALL MULTIPLIERS DOUBLED!', 'START', () => {
      this.audio.click()
      this.modalLayer.removeChildren()
      this.setMultiplier(2, true)
      this.spin()
    })
  }

  private finishFreeGame() {
    const total = this.freeGameWin
    this.audio.playMusic(false)
    this.showModal('TOTAL WIN', total.toFixed(2), 'FREE GAME COMPLETE', 'COLLECT', () => {
      this.audio.collect()
      this.modalLayer.removeChildren()
      this.setMultiplier(1, false)
      this.win = total
      this.winBanner.text = total.toFixed(2)
      this.updateStatus()
    })
  }

  private showModal(title: string, amount: string, subtitle: string, action: string, onClose: () => void) {
    this.modalLayer.removeChildren()
    const backdrop = new Graphics().rect(0, 0, 445, 738).fill({ color: '#7a090d', alpha: .96 })
    const burst = new Graphics().circle(222.5, 310, 180).fill({ color: '#ffb21f', alpha: .2 }).circle(222.5, 310, 118).fill({ color: '#ffdc55', alpha: .18 })
    const heading = new Text({ text: title, style: { fontFamily: 'Arial Black', fontSize: 36, fontWeight: '900', fill: '#65d844', stroke: { color: '#fff5a2', width: 5 } } })
    heading.anchor.set(.5); heading.position.set(222.5, 190)
    const value = new Text({ text: amount, style: { fontFamily: 'Arial Black', fontSize: 92, fontStyle: 'italic', fill: '#ffd33f', stroke: { color: '#72110c', width: 8 } } })
    value.anchor.set(.5); value.position.set(222.5, 305)
    const detail = new Text({ text: subtitle, style: { fontFamily: 'Arial Black', fontSize: 20, fill: '#fff4ce', align: 'center' } })
    detail.anchor.set(.5); detail.position.set(222.5, 400)
    const button = new Container(); button.position.set(222.5, 500)
    button.addChild(new Graphics().roundRect(-82, -26, 164, 52, 8).fill('#b4221c').stroke({ color: '#ffd366', width: 4 }))
    const label = new Text({ text: action, style: { fontFamily: 'Arial Black', fontSize: 23, fill: '#ffe790' } }); label.anchor.set(.5); button.addChild(label)
    button.eventMode = 'static'; button.cursor = 'pointer'; button.on('pointertap', onClose)
    this.modalLayer.addChild(backdrop, burst, heading, value, detail, button)
  }

  private emitCoins() {
    for (let index = 0; index < 14; index++) {
      const coin = new Graphics().circle(0, 0, 3 + Math.random() * 4).fill(index % 3 ? '#ffd45b' : '#fff0a2')
      coin.position.set(40 + Math.random() * 320, 80 + Math.random() * 210)
      this.fxLayer.addChild(coin)
      const originY = coin.y
      const drift = (Math.random() - 0.5) * 80
      const start = performance.now()
      const animate = () => {
        const progress = Math.min(1, (performance.now() - start) / 620)
        coin.x += drift * 0.018
        coin.y = originY - Math.sin(progress * Math.PI) * (40 + Math.random() * 20) + progress * 55
        coin.alpha = 1 - progress
        coin.rotation += 0.18
        if (progress < 1) requestAnimationFrame(animate)
        else coin.destroy()
      }
      requestAnimationFrame(animate)
    }
  }
}
