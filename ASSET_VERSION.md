# PG asset version

This directory is an independent copy of `mahjong-fortune-slot`.

- Public base: `/mahjong-fortune-slot-pg-assets/`
- Reel source atlas: `public/assets/pgsoft-reference/images/texture/symbols/symbols.png`
- Feature source atlas: `public/assets/pgsoft-reference/images/texture/symbols/feature_symbols.png` (original WILD text and 胡)
- Atlas crop definitions: `src/game/symbolTextures.ts`
- UI crop definitions: `src/game/uiTextures.ts`
- Captured UI sources in use:
  - `sprite-6737e5a0-4b0b-4887-8c8b-de2915097fa8.f1b49.png` — red pattern, wood panel, ways and multiplier bars
  - `sprite-46443487-ffde-4bcb-a5f6-578350e5082d.5f193.png` — green interior only; the gold frame is excluded
  - `sprite-3d039d70-4483-4e81-8c2a-723f3e86a819.36c36.png` — red/gold total-win frame
  - `sprite-2f32ef15-62a7-48a1-a1c6-3f1c2c0ad4f8.d10ff.png` — green/gold spin button
  - `sprite-1319d70e-fd0c-4710-a6b9-5a836a517828.d29f9.png` — inactive multiplier glyphs; rotated atlas frames are unpacked
  - `sprite-787f8e24-049a-47eb-8b06-6c30aaaf4c8e.0baf3.png` — active multiplier glyphs
  - `images/texture/info_message/info_message.png` — 1024 WAYS and TOTAL WIN text images
  - `images/lib/setting_menu/texture/hd/setting_menu.png` — turbo, auto, plus, minus icons
- Design coordinate system: `445x738`, matching the supplied target capture.
- Reel area: `425x390`, with five logical columns and four logical rows.
- Reel rendering uses a clipped window with two non-result preview rows. A small part of the preceding/following row remains visible at the top and bottom.
- Tile geometry is `78x90`, spaced at `80x90`, starting at `(14, 23)`. The original ivory tile texture replaces the previous procedural rectangle. Green side gutters and clipped preview rows remain visible.
- Symbol faces use tight source crops so transparent atlas padding cannot shrink the artwork. WILD combines the original text with the ingot; WILD and 胡 hide the ivory tile on initial render and every symbol change.
- SPIN uses the original two-arrow image. The multiplier strip uses the unpacked wooden atlas strip; there is no wood behind the reels.
- Canvas scaling preserves the 445:738 aspect ratio on portrait screens.
- Background music uses the project base URL. Synthesized oscillator effects have been removed; the nine requested original effect clips are documented in `public/assets/pgsoft-reference/audio/sfx/README.md`. Absent clips remain silent.
- Local development visual review: `?artPreview=1&multiplier=2`; add `&free=1&multiplier=6` for free-game multiplier artwork. This uses the same tile renderer as gameplay and is excluded from production behavior.
- The top-level UI is a fresh `1024 WAYS` layout; the former logo/menu composition is not used.
- Base-game tumble multipliers are `x1 / x2 / x3 / x5`.
- Symbols preserve their source aspect ratio inside each reel tile.
- The original project directory is not modified by this variant.

The atlas files are reference captures. Confirm licensing before production distribution.
# 2026-09-25 音效與發布更新

已更新 `src/game/audioSprites.ts` 為使用者修訂的 28 段語音；倍率已各自分段。
使用者確認音效表仍未完成，19 段舊音效範例已在遊戲內停用，只留試聽頁標示為未核實。
原始主遊戲／免費遊戲背景音樂照常使用。其餘語音事件接線進度以 README.md 為準。
正式網址使用 `/MJW/`；原本本地開發路徑保持不變。詳細限制與試聽網址見 README.md。
