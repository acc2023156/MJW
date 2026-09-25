// Supplied timeline tables, 2026-09-25. All offsets/durations are milliseconds.
// Source sheet: audio gid 1673875040; voice gid 465280746.
export const soundSprites = {
  bgm_main: [0, 8060], win_jingle: [8100, 1900], ui_click: [10050, 150],
  coin_waterfall: [10250, 1930], win_fanfare: [12200, 900],
  reel_spin: [13150, 1050], scatter_land: [14250, 1750],
  symbol_elimination: [16050, 950], reel_stop_heavy: [17050, 150],
  high_win: [17250, 750], medium_win: [18050, 950],
  reel_stop_normal: [19050, 150], anticipation: [19220, 580],
  multiplier_up: [19820, 280], free_game: [20120, 680],
  small_coin: [20820, 980], toggle: [21820, 280],
  collect: [22120, 380], whoosh: [22520, 580],
} as const

export const voiceSprites = {
  hu: [0, 1880], multiplier_sequence: [1900, 4700], bamboo_two: [6650, 800],
  bamboo_one: [7500, 850], bamboo_five: [8400, 900], bamboo_special: [9350, 1200],
  eight_white_sequence: [10600, 1750], green_dragon: [12400, 750],
  red_dragon: [13200, 850], all_match_female: [14100, 1100],
  all_match_male: [15250, 1050], look_cards: [16350, 1650],
  hurry: [18050, 1800], request_eat: [19900, 1400], taunt: [21350, 1150],
  ready_hand: [22550, 1500], hurry_dialect: [24100, 1500],
  self_draw: [25650, 1050], comment_dialect: [26750, 1350],
  joke_dialect: [28150, 2750], long_taunt: [30950, 3950],
} as const

export type SoundName = keyof typeof soundSprites
export type VoiceName = keyof typeof voiceSprites
