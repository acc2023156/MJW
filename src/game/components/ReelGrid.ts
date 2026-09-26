import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import type { SymbolArt } from '../symbolTextures'
import {
  FREE_TUMBLE_MULTIPLIERS, REEL_COLUMNS, REEL_ROWS,
  SYMBOL_PAYS, TUMBLE_MULTIPLIERS, randomSymbol, type SymbolId,
} from '../config'

const VIEW_WIDTH = 425
const VIEW_HEIGHT = 390
// The captured tile PNG has transparent edge pixels. Slightly oversizing the
// sprite compensates for them, leaving a visible seam of about two pixels.
const TILE_WIDTH = 82
const TILE_HEIGHT = 92
const COLUMN_START = 14
const COLUMN_STEP = 80
const ROW_START = 23
const ROW_STEP = 90
const REEL_TILE_COUNT = REEL_ROWS + 2
const REEL_SPAN = REEL_TILE_COUNT * ROW_STEP

type Tile = { container: Container; icon: Sprite; body: Sprite; wildLabel: Sprite }

export type ReelSpinCallbacks = {
  freeMode: boolean
  turbo: boolean
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
  private readonly winGlow = new Graphics()
  private readonly shade = new Graphics()
  private readonly beam = new Graphics()
  private readonly symbolTextures: Record<SymbolId, Texture>
  private readonly art: SymbolArt
  private running = false
  private quickStopRequested = false

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
    tileLayer.addChild(this.winGlow, this.shade, this.beam)
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

  quickStop() {
    if (this.running) this.quickStopRequested = true
  }

  private baseX(col: number) { return COLUMN_START + col * COLUMN_STEP }
  private baseY(row: number) { return ROW_START + row * ROW_STEP }

  private columnTiles(col: number) {
    return [
      this.previewCells[col],
      ...Array.from({ length: REEL_ROWS }, (_, row) => this.cells[row][col]),
      this.previewCells[REEL_COLUMNS + col],
    ]
  }

  private setSymbol(row: number, col: number, value: SymbolId) {
    this.symbols[row][col] = value
    this.setTile(this.cells[row][col], value)
  }

  private setTile(tile: Tile, value: SymbolId) {
    tile.icon.texture = this.symbolTextures[value]
    tile.body.visible = value !== '百搭' && value !== '胡'
    tile.wildLabel.visible = value === '百搭'
    tile.icon.position.set(TILE_WIDTH / 2, value === '百搭' ? 66 : TILE_HEIGHT / 2 - 3)
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
    this.quickStopRequested = false
    const outcome = this.makeOutcome(!callbacks.freeMode && Math.random() < .055)
    const anticipation = !callbacks.turbo && this.countScatters(outcome, 3) >= 2
    const stopTimes = callbacks.turbo
      ? [430, 430, 430, 430, 430]
      : anticipation ? [780, 870, 960, 2500, 4200] : [780, 870, 960, 1050, 1140]
    const start = performance.now()
    let lastFrame = start
    let anticipationStarted = false
    const phases = Array.from({ length: REEL_COLUMNS }, () => 0) // 0 spin, 1 settle, 2 stopped
    const settleStarts = Array.from({ length: REEL_COLUMNS }, () => 0)
    const offsets = Array.from({ length: REEL_COLUMNS }, () => 0)
    const lastCycles = Array.from({ length: REEL_COLUMNS }, () => 0)

    const settleColumn = (col: number) => {
      if (phases[col] !== 0) return
      phases[col] = 1
      settleStarts[col] = performance.now()
      for (let row = 0; row < REEL_ROWS; row++) {
        this.setSymbol(row, col, outcome[row][col])
        this.cells[row][col].container.position.set(this.baseX(col), this.baseY(row) - 7)
        this.cells[row][col].container.alpha = 1
      }
      const columnTiles = this.columnTiles(col)
      this.setTile(columnTiles[0], randomSymbol())
      this.setTile(columnTiles[REEL_TILE_COUNT - 1], randomSymbol())
      columnTiles[0].container.position.set(this.baseX(col), this.baseY(-1) - 7)
      columnTiles[REEL_TILE_COUNT - 1].container.position.set(this.baseX(col), this.baseY(REEL_ROWS) - 7)
      callbacks.settle(outcome.some(row => row[col] === '胡'), col === REEL_COLUMNS - 1)
    }

    const animate = () => {
      const now = performance.now()
      const elapsed = now - start
      const delta = Math.min(34, now - lastFrame)
      lastFrame = now
      const forceStop = this.quickStopRequested

      for (let col = 0; col < REEL_COLUMNS; col++) {
        if (phases[col] === 0 && (forceStop || elapsed >= stopTimes[col])) settleColumn(col)
        if (phases[col] === 0) {
          const acceleration = Math.min(1, elapsed / (callbacks.turbo ? 70 : 150))
          const remaining = stopTimes[col] - elapsed
          const braking = remaining < 220 ? .32 + .68 * Math.max(0, remaining / 220) : 1
          offsets[col] += delta * (callbacks.turbo ? 2.45 : 1.72) * acceleration * braking
          const cycle = Math.floor(offsets[col] / ROW_STEP)
          const columnTiles = this.columnTiles(col)
          while (lastCycles[col] < cycle) {
            lastCycles[col]++
            const wrappedIndex = (REEL_TILE_COUNT - (lastCycles[col] % REEL_TILE_COUNT)) % REEL_TILE_COUNT
            this.setTile(columnTiles[wrappedIndex], randomSymbol())
          }
          for (let index = 0; index < REEL_TILE_COUNT; index++) {
            const tile = columnTiles[index]
            tile.container.y = this.baseY(-1) + ((index * ROW_STEP + offsets[col]) % REEL_SPAN)
            tile.container.alpha = .9
          }
        } else if (phases[col] === 1) {
          const progress = Math.min(1, (now - settleStarts[col]) / (callbacks.turbo ? 70 : 115))
          const c1 = 1.35
          const c3 = c1 + 1
          const eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2)
          const columnTiles = this.columnTiles(col)
          for (let index = 0; index < REEL_TILE_COUNT; index++) {
            columnTiles[index].container.y = this.baseY(index - 1) - 7 + 7 * eased
          }
          if (progress >= 1) {
            phases[col] = 2
            for (let index = 0; index < REEL_TILE_COUNT; index++) {
              columnTiles[index].container.position.set(this.baseX(col), this.baseY(index - 1))
              columnTiles[index].container.alpha = 1
            }
          }
        }
      }
      if (anticipation && !anticipationStarted && elapsed >= stopTimes[2]) {
        anticipationStarted = true
        callbacks.anticipation(true)
        this.showAnticipation(3)
      }
      if (anticipation && elapsed >= stopTimes[3]) this.showAnticipation(4)
      if (!phases.every(phase => phase === 2)) return requestAnimationFrame(animate)
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
    let tumble = 0
    while (tumble < 100) {
      const result = this.evaluateWays()
      if (!result.wins.size) break
      const multiplier = multipliers[Math.min(tumble, multipliers.length - 1)]
      total += result.payout * multiplier
      callbacks.tumble(tumble + 1, multiplier, result.payout * multiplier)
      await this.animateWin(result.wins, callbacks.clear)
      await this.pause(callbacks.turbo ? 25 : 110)
      const dropStarts = Array.from({ length: REEL_ROWS }, (_, row) =>
        Array.from({ length: REEL_COLUMNS }, () => this.baseY(row)))
      for (let col = 0; col < REEL_COLUMNS; col++) {
        const survivorRows: number[] = []
        for (let row = 0; row < REEL_ROWS; row++) if (!result.wins.has(`${row}:${col}`)) survivorRows.push(row)
        const newCount = REEL_ROWS - survivorRows.length
        const survivors = survivorRows.map(row => this.symbols[row][col])
        const next = [...Array.from({ length: newCount }, randomSymbol), ...survivors]
        for (let row = 0; row < REEL_ROWS; row++) {
          const tile = this.cells[row][col]
          this.setSymbol(row, col, next[row])
          const sourceY = row < newCount
            ? this.baseY(row) - newCount * ROW_STEP
            : this.baseY(survivorRows[row - newCount])
          dropStarts[row][col] = sourceY
          tile.container.position.set(this.baseX(col), sourceY)
          tile.container.alpha = 1
        }
      }
      this.previewCells.forEach(tile => this.setTile(tile, randomSymbol()))
      callbacks.drop()
      await this.animateDrop(dropStarts, callbacks.turbo)
      tumble++
    }
    if (tumble >= 100) console.warn('Cascade safety guard reached; stopping a likely malformed outcome.')
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
        this.winGlow.clear()
        for (const row of this.cells) for (const tile of row) tile.container.alpha = .28
        wins.forEach((key) => {
          const [row, col] = key.split(':').map(Number)
          const tile = this.cells[row][col]
          tile.container.alpha = 1 - Math.max(0, progress - .72) / .28
          this.fitSymbol(tile.icon, this.symbols[row][col])
          const glowAlpha = (.58 + Math.sin(progress * Math.PI * 4) * .22) * Math.min(1, (1 - progress) * 5)
          this.winGlow.roundRect(this.baseX(col) - 1, this.baseY(row) - 1, TILE_WIDTH + 2, TILE_HEIGHT + 1, 8)
            .stroke({ color: '#ffe15a', width: 3, alpha: glowAlpha })
        })
        if (progress < 1) requestAnimationFrame(frame)
        else { this.winGlow.clear(); resolve() }
      }
      requestAnimationFrame(frame)
    })
  }

  private animateDrop(starts: number[][], turbo: boolean) {
    const duration = turbo ? 140 : 390
    const start = performance.now()
    return new Promise<void>((resolve) => {
      const frame = () => {
        const elapsed = performance.now() - start
        let finished = true
        for (let row = 0; row < REEL_ROWS; row++) for (let col = 0; col < REEL_COLUMNS; col++) {
          const tile = this.cells[row][col]
          const targetY = this.baseY(row)
          const distance = Math.max(0, Math.round((targetY - starts[row][col]) / ROW_STEP))
          const delay = turbo || distance === 0 ? 0 : col * 14 + Math.max(0, 4 - distance) * 12
          const progress = Math.max(0, Math.min(1, (elapsed - delay) / duration))
          if (progress < 1) finished = false
          const eased = 1 - Math.pow(1 - progress, 3)
          tile.container.y = starts[row][col] + (targetY - starts[row][col]) * eased
        }
        if (!finished) requestAnimationFrame(frame)
        else {
          for (let row = 0; row < REEL_ROWS; row++) for (let col = 0; col < REEL_COLUMNS; col++) {
            const tile = this.cells[row][col]
            tile.container.y = this.baseY(row)
            tile.container.alpha = 1
            this.fitSymbol(tile.icon, this.symbols[row][col])
          }
          resolve()
        }
      }
      requestAnimationFrame(frame)
    })
  }

  private pause(duration: number) {
    return new Promise<void>((resolve) => window.setTimeout(resolve, duration))
  }
}
