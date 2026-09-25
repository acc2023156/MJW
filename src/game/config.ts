export const GAME_WIDTH = 445
export const GAME_HEIGHT = 738
export const REEL_COLUMNS = 5
export const REEL_ROWS = 4

export const SYMBOLS = ['百搭', '胡', '中', '發', '萬', '筒', '索', '東'] as const
export type SymbolId = (typeof SYMBOLS)[number]

export const SYMBOL_COLORS: Record<SymbolId, string> = {
  百搭: '#f3a51d',
  胡: '#d92116',
  中: '#d92f2f',
  發: '#16864c',
  萬: '#343aaa',
  筒: '#7d46a8',
  索: '#238b55',
  東: '#c67618',
}

export const SYMBOL_PAYS: Record<SymbolId, number> = {
  百搭: 0,
  胡: 0,
  中: 20,
  發: 15,
  萬: 10,
  筒: 8,
  索: 6,
  東: 4,
}

export const SYMBOL_WEIGHTS: Record<SymbolId, number> = {
  百搭: 4,
  胡: 3,
  中: 8,
  發: 10,
  萬: 13,
  筒: 16,
  索: 18,
  東: 20,
}

export const TUMBLE_MULTIPLIERS = [1, 2, 3, 5]
export const FREE_TUMBLE_MULTIPLIERS = [2, 4, 6, 10]
export const FREE_SPINS_AWARDED = 12

export function randomSymbol(): SymbolId {
  const total = SYMBOLS.reduce((sum, symbol) => sum + SYMBOL_WEIGHTS[symbol], 0)
  let roll = Math.random() * total
  for (const symbol of SYMBOLS) {
    roll -= SYMBOL_WEIGHTS[symbol]
    if (roll <= 0) return symbol
  }
  return '東'
}
