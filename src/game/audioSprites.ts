// All offsets/durations are milliseconds. SFX timings are UNVERIFIED EXAMPLES.
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
  hu: [0, 2490], multiplier_2: [2920, 780], multiplier_3: [3920, 780],
  multiplier_4: [4920, 880], multiplier_6: [5920, 950],
  multiplier_10: [6920, 1040], multiplier_5: [7980, 710],
  bamboo_two: [9000, 810], dots_two: [9960, 920], bamboo_five: [11000, 770],
  dots_five: [11970, 1520], eight: [14040, 850], white: [15000, 1120],
  green_dragon: [17000, 590], red_dragon: [18000, 1170],
  all_match_female: [19950, 1330], all_match_male: [21940, 1220],
  look_cards: [23870, 2800], hurry: [27000, 2950], request_eat: [30000, 2030],
  taunt: [32050, 1730], ready_hand: [34050, 2750], hurry_dialect: [36920, 1750],
  self_draw: [38950, 1750], comment_dialect: [40950, 1910],
  joke_dialect: [42970, 3320], long_taunt: [46900, 2890], final_taunt: [49950, 3050],
} as const

export type SoundName = keyof typeof soundSprites
export type VoiceName = keyof typeof voiceSprites
