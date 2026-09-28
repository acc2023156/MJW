# MJW — Mahjong Ways demo

Playable demo: https://acc2023156.github.io/MJW/ (linked from the Boss88VIP lobby).

Mirror of `acc2023156/mahjong-fortune-slot` (branch `codex/MJW0928-5x4-ways`), built with
base `/MJW/`. Local demonstration with simulated credits only — no real-money play and no
connection to any game server.

```sh
npm ci
npm run dev
npm run build
```

- Sprites are sliced from the reference atlases by `scripts/extract-skin.py` into `public/assets/skin/`.
- Audio: `src/game/audioSprites.ts` maps `general_audio.mp3` / `vox.mp3` segments to game events.

Images and audio are third-party reference assets; this repository grants no license to them.
