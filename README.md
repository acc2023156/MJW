# MJW — Mahjong Ways asset prototype

Playable preview: https://acc2023156.github.io/MJW/

Audio timeline review: https://acc2023156.github.io/MJW/?audioReview=1

This is a local demonstration with simulated credits. No deposits, withdrawals,
real-money bets, or connection to the original game server. Game mathematics and
some transition effects remain prototype implementations, not the official game.

## Development

```sh
npm ci
npm run dev -- --port 5175
npm run build
```

Development base: `/mahjong-fortune-slot-pg-assets/`; production base: `/MJW/`.
Pushes to main build and deploy GitHub Pages using GitHub Actions. The deployed
site does not depend on a local server or an active coding session.

## Audio sprite integration

`src/game/audioSprites.ts` records the supplied 19 sound and 21 voice regions in
milliseconds as `[offset, duration]`. `AudioEngine.ts` decodes the captured
`general_audio.mp3` and `vox.mp3` once, checks bounds, and schedules segments via
Web Audio. Main/free music use `bgm_mg.mp3` / `bgm_bonus_loop.mp3` unchanged.
No generated tones or manual MP3 cutting are required.

Connected events: spin, normal/final reel stop, scatter landing, win highlight,
elimination, drop, multiplier increase, anticipation cue, payout, free-game
trigger (including Hu voice), click, toggle, and collect.

The multiplier voice and eight/white voice rows each combine several phrases;
they remain available for audition but are not incorrectly played as one
individual multiplier/symbol. Unrelated table-game banter is not auto-triggered.
The 580ms anticipation cue is not treated as a seamless music loop.

Timing corrections from the pasted example: UI click starts at 10050ms, reel
spin at 13150ms, normal stop at 19050ms, multiplier at 19820ms. Segment semantics
come from the supplied tables; duration validation does not certify transcription.

Images and audio remain third-party reference assets; this repository does not
grant a license to those assets. Confirm applicable rights before wider reuse.
