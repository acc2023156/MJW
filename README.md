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

`src/game/audioSprites.ts` records 19 UNVERIFIED sound examples and the updated
28 user-timed voice regions in milliseconds as `[offset, duration]`.
The user confirmed the SFX table is still being prepared: sound examples are
DISABLED during gameplay and available only in the explicitly labeled audition
page. `AudioEngine.ts` decodes the captured
`general_audio.mp3` and `vox.mp3` once, checks bounds, and schedules segments via
Web Audio. Main/free music use `bgm_mg.mp3` / `bgm_bonus_loop.mp3` unchanged.
No generated tones or manual MP3 cutting are required.

Active audio: original main/free music, Hu voice on free-game entry, individual
multiplier voices on cascade multiplier changes. The other voice segments are
available for audition; symbol calls, alternating Wild calls, and timed idle
banter remain to be connected to their appropriate events.

SFX event hooks are prepared for spin, stops, scatter, highlight, elimination,
drop, multiplier, anticipation, payout, free-game entry, click, toggle, collect.
They remain silent until the actual sound timings are supplied and verified.

Voice timings were re-read after the user's corrections on 2026-09-25. The last
segment ends at 53 seconds, matching vox.mp3. Bounds checking does not certify
transcription, and the old sample SFX timings are not production mappings.

Images and audio remain third-party reference assets; this repository does not
grant a license to those assets. Confirm applicable rights before wider reuse.
