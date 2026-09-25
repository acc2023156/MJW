import { Assets, Rectangle, Texture } from 'pixi.js'
import { pgsoftAsset } from './pgsoftAssets'

type Crop = [number, number, number, number]

export type UiTextures = {
  redPattern: Texture
  woodPanel: Texture
  waysBar: Texture
  multiplierBar: Texture
  reelFrame: Texture
  winBar: Texture
  spinButton: Texture
  spinArrows: Texture
  waysLabel: Texture
  totalWinLabel: Texture
  winRail: Texture
  multipliers: Record<number, { normal: Texture; active: Texture }>
  controls: { turbo: Texture; auto: Texture; plus: Texture; minus: Texture }
}

function crop(source: Texture, [x, y, width, height]: Crop, rotated = false) {
  return new Texture({ source: source.source, frame: new Rectangle(x, y, width, height),
    ...(rotated ? { rotate: 2, orig: new Rectangle(0, 0, height, width) } : {}) })
}

/**
 * UI pieces cut from the original captured Mahjong Ways atlases.
 * Keeping these frames in one place makes the provenance and sizing explicit.
 */
export async function loadUiTextures(): Promise<UiTextures> {
  const [backdrop, reelFrame, winBars, controls, normal, active, info, settings] = await Promise.all([
    Assets.load<Texture>(pgsoftAsset('images/atlas-subresources/sprite-6737e5a0-4b0b-4887-8c8b-de2915097fa8.f1b49.png')),
    Assets.load<Texture>(pgsoftAsset('images/atlas-subresources/sprite-46443487-ffde-4bcb-a5f6-578350e5082d.5f193.png')),
    Assets.load<Texture>(pgsoftAsset('images/atlas-subresources/sprite-3d039d70-4483-4e81-8c2a-723f3e86a819.36c36.png')),
    Assets.load<Texture>(pgsoftAsset('images/atlas-subresources/sprite-2f32ef15-62a7-48a1-a1c6-3f1c2c0ad4f8.d10ff.png')),
    Assets.load<Texture>(pgsoftAsset('images/atlas-subresources/sprite-1319d70e-fd0c-4710-a6b9-5a836a517828.d29f9.png')),
    Assets.load<Texture>(pgsoftAsset('images/atlas-subresources/sprite-787f8e24-049a-47eb-8b06-6c30aaaf4c8e.0baf3.png')),
    Assets.load<Texture>(pgsoftAsset('images/texture/info_message/info_message.png')),
    Assets.load<Texture>(pgsoftAsset('images/lib/setting_menu/texture/hd/setting_menu.png')),
  ])

  return {
    redPattern: crop(backdrop, [0, 0, 758, 620]),
    woodPanel: crop(backdrop, [0, 625, 758, 586]),
    waysBar: crop(backdrop, [0, 1451, 758, 111]),
    multiplierBar: crop(backdrop, [881, 759, 106, 756], true),
    // Only the green cloth interior, never the gold menu-panel surround.
    reelFrame: crop(reelFrame, [10, 10, 232, 120]),
    winBar: crop(winBars, [0, 246, 736, 95]),
    winRail: crop(backdrop, [0, 1574, 758, 112]),
    spinButton: crop(controls, [0, 193, 200, 182]),
    spinArrows: crop(controls, [0, 375, 120, 119]),
    waysLabel: crop(info, [1293, 54, 305, 58]),
    totalWinLabel: crop(info, [1120, 70, 123, 76]),
    controls: {
      turbo: crop(settings, [864, 0, 74, 69]),
      auto: crop(settings, [850, 351, 50, 50]),
      plus: crop(settings, [819, 532, 60, 64]),
      minus: crop(settings, [700, 470, 90, 13]),
    },
    multipliers: {
      1: { normal: crop(normal, [0, 163, 64, 93], true), active: crop(active, [780, 0, 108, 94]) },
      2: { normal: crop(normal, [0, 69, 64, 94], true), active: crop(active, [658, 0, 122, 94]) },
      3: { normal: crop(normal, [163, 69, 65, 93], true), active: crop(active, [292, 0, 122, 94]) },
      5: { normal: crop(normal, [64, 163, 64, 93], true), active: crop(active, [537, 0, 121, 94]) },
      4: { normal: crop(normal, [128, 0, 100, 69]), active: crop(active, [166, 0, 126, 94]) },
      6: { normal: crop(normal, [128, 163, 100, 67]), active: crop(active, [414, 0, 123, 94]) },
      10: { normal: crop(normal, [0, 0, 128, 69]), active: crop(active, [0, 0, 166, 94]) },
    },
  }
}
