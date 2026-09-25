import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import type { SymbolArt } from '../symbolTextures'
import {
  FREE_TUMBLE_MULTIPLIERS, REEL_COLUMNS, REEL_ROWS,
  SYMBOL_PAYS, TUMBLE_MULTIPLIERS, randomSymbol, type SymbolId,
} from '../config'

const VIEW_WIDTH = 425
const VIEW_HEIGHT = 390
const TILE_WIDTH = 78
const TILE_HEIGHT = 90
const COLUMN_START = 14
const COLUMN_STEP = 80
const ROW_START = 23
const ROW_STEP = 90

type Tile = { container: Container; icon: Sprite; body: Sprite; wildLabel: Sprite }

export type ReelSpinCallbacks = {
  freeMode: boolean
  settle: (scatter: boolean, last: boolean) => void
  anticipation: (active: boolean) => void
  tumble: (chain: number, multiplier: number, win: number) => void
  clear: () => void
  drop: () => void
  complete: (totalWin: number, scatters: number) => void
}

export class ReelGrid extends Container {
  private readonly cells: Tile[][] = []
  private readonly previewCells: Tile[] = []
  private readonly symbols: SymbolId[][] = []
  private readonly shade = new Graphics()
  private readonly beam = new Graphics()
  private readonly symbolTextures: Record<SymbolId, Texture>
  private readonly art: SymbolArt
  private running = false

  constructor(art: SymbolArt, reelFrame: Texture) {
    super()
    this.art = art
    this.symbolTextures = art.faces

    const background = new Sprite(reelFrame)
    background.width = VIEW_WIDTH
    background.height = VIEW_HEIGHT
    this.addChild(background)

    const tileLayer = new Container()
    const viewportMask = new Graphics().rect(0, 0, VIEW_WIDTH, VIEW_HEIGHT).fill('#ffffff')
    tileLayer.mask = viewportMask
    this.addChild(tileLayer, viewportMask)

    // Extra rows are deliberately outside the logical 5x4 result. The reel
    // mask exposes only their edges above and below, as in the captured game.
    for (const previewRow of [-1, REEL_ROWS]) {
      for (let col = 0; col < REEL_COLUMNS; col++) {
        const value = randomSymbol()
        const tile = this.createTile(value, COLUMN_START + col * COLUMN_STEP, ROW_START + previewRow * ROW_STEP)
        this.previewCells.push(tile)
        tileLayer.addChild(tile.container)
      }
    }

    for (let row = 0; row < REEL_ROWS; row++) {
      this.cells[row] = []
      this.symbols[row] = []
      for (let col = 0; col < REEL_COLUMNS; col++) {
        const value = randomSymbol()
        this.symbols[row][col] = value
        const tile = this.createTile(value, COLUMN_START + col * COLUMN_STEP, ROW_START + row * ROW_STEP)
        this.cells[row][col] = tile
        tileLayer.addChild(tile.container)
      }
    }

    this.shade.visible = false
    this.beam.visible = false
    tileLayer.addChild(this.shade, this.beam)
  }

  private createTile(value: SymbolId, x: number, y: number): Tile {
    const container = new Container()
    container.position.set(x, y)
    const body = new Sprite(this.art.tile)
    body.width = TILE_WIDTH
    body.height = TILE_HEIGHT
    container.addChild(body)
    const icon = new Sprite(this.symbolTextures[value])
    icon.anchor.set(.5)
    icon.position.set(TILE_WIDTH / 2, TILE_HEIGHT / 2)
    const wildLabel = new Sprite(this.art.wildLabel)
    wildLabel.anchor.set(.5)
    wildLabel.position.set(TILE_WIDTH / 2, 23)
    wildLabel.width = 78
    wildLabel.height = 42
    container.addChild(icon, wildLabel)
    const tile = { container, icon, body, wildLabel }
    this.setTile(tile, value)
    return tile
  }

  private setSymbol(row: number, col: number, value: SymbolId) {
    this.symbols[row][col] = value
    this.setTile(this.cells[row][col], value)
  }

  private setTile(tile: Tile, value: SymbolId) {
    tile.icon.texture = this.symbolTextures[value]
    tile.body.visible = value !== '百搭' && value !== '胡'
    tile.wildLabel.visible = value === '百搭'
    tile.icon.position.set(TILE_WIDTH / 2, value === '百搭' ? 65 : TILE_HEIGHT / 2 - 3)
    this.fitSymbol(tile.icon, value)
  }

  private fitSymbol(icon: Sprite, value: SymbolId) {
    const special = value === '胡' || value === '百搭'
    const maxWidth = special ? 79 : 57
    const maxHeight = value === '胡' ? 90 : value === '百搭' ? 47 : 72
    const ratio = Math.min(maxWidth / icon.texture.width, maxHeight / icon.texture.height)
    icon.scale.set(ratio)
  }

  showAssetPreview() {
    const board: SymbolId[][] = [
      ['筒', '索', '百搭', '萬', '發'],
      ['萬', '中', '東', '筒', '索'],
      ['胡', '東', '發', '萬', '中'],
      ['索', '筒', '中', '發', '百搭'],
    ]
    board.forEach((row, r) => row.forEach((value, c) => this.setSymbol(r, c, value)))
  }

  spin(callbacks: ReelSpinCallbacks) {
    if (this.running) return
    this.running = true
    const outcome = this.makeOutcome(!callbacks.freeMode && Math.random() < .055)
    const anticipation = this.countScatters(outcome, 3) >= 2
    const stopTimes = anticipation ? [620, 790, 960, 2600, 4300] : [620, 775, 930, 1085, 1240]
    const start = performance.now()
    let lastShuffle = 0
    let anticipationStarted = false
    const settled = Array.from({ length: REEL_COLUMNS }, () => false)
    const animate = () => {
      const elapsed = performance.now() - start
      if (elapsed - lastShuffle > 52) {
        lastShuffle = elapsed
        for (let col = 0; col < REEL_COLUMNS; col++) for (let row = 0; row < REEL_ROWS; row++) {
          this.setSymbol(row, col, elapsed < stopTimes[col] ? randomSymbol() : outcome[row][col])
        }
        this.previewCells.forEach(tile => this.setTile(tile, randomSymbol()))
      }
      for (let col = 0; col < REEL_COLUMNS; col++) {
        if (!settled[col] && elapsed >= stopTimes[col]) {
          settled[col] = true
          for (let row = 0; row < REEL_ROWS; row++) this.setSymbol(row, col, outcome[row][col])
          callbacks.settle(outcome.some(row => row[col] === '胡'), col === REEL_COLUMNS - 1)
        }
      }
      if (anticipation && !anticipationStarted && elapsed >= stopTimes[2]) {
        anticipationStarted = true
        callbacks.anticipation(true)
        this.showAnticipation(3)
      }
      if (anticipation && elapsed >= stopTimes[3]) this.showAnticipation(4)
      if (elapsed < stopTimes[4] + 120) return requestAnimationFrame(animate)
      this.hideAnticipation()
      callbacks.anticipation(false)
      void this.runTumbles(callbacks)
    }
    requestAnimationFrame(animate)
  }

  private makeOutcome(forceBonus: boolean): SymbolId[][] {
    const result = Array.from({ length: REEL_ROWS }, () => Array.from({ length: REEL_COLUMNS }, randomSymbol))
    if (forceBonus) [0, 2, 4].forEach((col, index) => { result[[0, 3, 1][index]][col] = '胡' })
    return result
  }

  private countScatters(grid = this.symbols, columns = REEL_COLUMNS) {
    let count = 0
    for (let row = 0; row < REEL_ROWS; row++) for (let col = 0; col < columns; col++) if (grid[row][col] === '胡') count++
    return count
  }

  private showAnticipation(activeColumn: number) {
    const x = COLUMN_START + activeColumn * COLUMN_STEP
    this.shade.clear().rect(4, 4, Math.max(0, x - 4), VIEW_HEIGHT - 8).fill({ color: '#000', alpha: .68 })
    this.beam.clear()
      .rect(x - 2, 4, COLUMN_STEP, VIEW_HEIGHT - 8).fill({ color: '#fff3a1', alpha: .18 })
      .rect(x, 4, 3, VIEW_HEIGHT - 8).fill({ color: '#ffd13c', alpha: .9 })
      .rect(x + TILE_WIDTH - 1, 4, 3, VIEW_HEIGHT - 8).fill({ color: '#ffd13c', alpha: .9 })
    this.shade.visible = true
    this.beam.visible = true
  }

  private hideAnticipation() { this.shade.visible = false; this.beam.visible = false }

  private evaluateWays() {
    let payout = 0
    const wins = new Set<string>()
    for (const target of ['中', '發', '萬', '筒', '索', '東'] as SymbolId[]) {
      const columns: number[][] = []
      for (let col = 0; col < REEL_COLUMNS; col++) {
        const rows: number[] = []
        for (let row = 0; row < REEL_ROWS; row++) if ([target, '百搭'].includes(this.symbols[row][col])) rows.push(row)
        if (!rows.length) break
        columns.push(rows)
      }
      if (columns.length >= 3) {
        const ways = columns.reduce((total, rows) => total * rows.length, 1)
        payout += ways * SYMBOL_PAYS[target] * (columns.length - 2) / 20
        columns.forEach((rows, col) => rows.forEach((row) => wins.add(`${row}:${col}`)))
      }
    }
    return { payout, wins }
  }

  private async runTumbles(callbacks: ReelSpinCallbacks) {
    let total = 0
    const multipliers = callbacks.freeMode ? FREE_TUMBLE_MULTIPLIERS : TUMBLE_MULTIPLIERS
    for (let tumble = 0; tumble < multipliers.length; tumble++) {
      const result = this.evaluateWays()
      if (!result.wins.size) break
      const multiplier = multipliers[Math.min(tumble, multipliers.length - 1)]
      total += result.payout * multiplier
      callbacks.tumble(tumble + 1, multiplier, result.payout * multiplier)
      await this.animateWin(result.wins, callbacks.clear)
      for (let col = 0; col < REEL_COLUMNS; col++) {
        const survivors: SymbolId[] = []
        for (let row = REEL_ROWS - 1; row >= 0; row--) if (!result.wins.has(`${row}:${col}`)) survivors.unshift(this.symbols[row][col])
        const next = [...Array.from({ length: REEL_ROWS - survivors.length }, randomSymbol), ...survivors]
        for (let row = 0; row < REEL_ROWS; row++) {
          const tile = this.cells[row][col]
          this.setSymbol(row, col, next[row])
          tile.container.y = ROW_START + row * ROW_STEP - 48 - row * 8
          tile.container.alpha = 0
        }
      }
      this.previewCells.forEach(tile => this.setTile(tile, randomSymbol()))
      callbacks.drop()
      await this.animateDrop()
    }
    this.running = false
    callbacks.complete(total, this.countScatters())
  }

  private animateWin(wins: Set<string>, onClear: () => void) {
    const start = performance.now()
    let clearing = false
    return new Promise<void>((resolve) => {
      const frame = () => {
        const progress = Math.min(1, (performance.now() - start) / 650)
        if (!clearing && progress >= .72) { clearing = true; onClear() }
        for (const row of this.cells) for (const tile of row) tile.container.alpha = .28
        wins.forEach((key) => {
          const [row, col] = key.split(':').map(Number)
          const tile = this.cells[row][col]
          tile.container.alpha = 1 - Math.max(0, progress - .72) / .28
          this.fitSymbol(tile.icon, this.symbols[row][col])
          tile.icon.scale.set(tile.icon.scale.x * (1 + Math.sin(progress * Math.PI * 2) * .11))
        })
        if (progress < 1) requestAnimationFrame(frame); else resolve()
      }
      requestAnimationFrame(frame)
    })
  }

  private animateDrop() {
    const start = performance.now()
    return new Promise<void>((resolve) => {
      const frame = () => {
        const progress = Math.min(1, (performance.now() - start) / 420)
        const eased = 1 - Math.pow(1 - progress, 3)
        for (let row = 0; row < REEL_ROWS; row++) for (let col = 0; col < REEL_COLUMNS; col++) {
          const tile = this.cells[row][col]
          const targetY = ROW_START + row * ROW_STEP
          tile.container.alpha = eased
          tile.container.y += (targetY - tile.container.y) * Math.min(1, eased * .42 + .12)
        }
        if (progress < 1) requestAnimationFrame(frame)
        else {
          for (let row = 0; row < REEL_ROWS; row++) for (let col = 0; col < REEL_COLUMNS; col++) {
            const tile = this.cells[row][col]
            tile.container.y = ROW_START + row * ROW_STEP
            tile.container.alpha = 1
            this.fitSymbol(tile.icon, this.symbols[row][col])
          }
          resolve()
        }
      }
      requestAnimationFrame(frame)
    })
  }
}
