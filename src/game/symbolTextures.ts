import { Assets, Rectangle, Texture } from 'pixi.js'
import type { SymbolId } from './config'
import { pgsoftAsset } from './pgsoftAssets'

type Crop = [number, number, number, number]
export type SymbolArt = {
  faces: Record<SymbolId, Texture>
  tile: Texture
  wildLabel: Texture
}

// Crops measured from the original 1097x502 Mahjong Ways sprite sheet.
const BASE_CROPS: Record<Exclude<SymbolId, '胡'>, Crop> = {
  '萬': [45, 18, 84, 137],
  '中': [203, 24, 99, 130],
  '筒': [383, 28, 62, 129],
  '索': [563, 23, 30, 134],
  '發': [27, 211, 115, 136],
  '東': [197, 210, 108, 138],
  '百搭': [664, 278, 146, 89],
}

function crop(source: Texture, [x, y, width, height]: Crop) {
  return new Texture({ source: source.source, frame: new Rectangle(x, y, width, height) })
}

export async function loadSymbolTextures(): Promise<SymbolArt> {
  const [base, feature] = await Promise.all([
    Assets.load<Texture>(pgsoftAsset('images/texture/symbols/symbols.png')),
    Assets.load<Texture>(pgsoftAsset('images/texture/symbols/feature_symbols.png')),
  ])
  const textures = Object.fromEntries(
    Object.entries(BASE_CROPS).map(([id, frame]) => [id, crop(base, frame)]),
  ) as Record<Exclude<SymbolId, '胡'>, Texture>
  return {
    faces: { ...textures, '胡': crop(feature, [0, 0, 165, 187]) },
    tile: crop(base, [820, 0, 161, 190]),
    wildLabel: crop(feature, [165, 12, 165, 89]),
  }
}
