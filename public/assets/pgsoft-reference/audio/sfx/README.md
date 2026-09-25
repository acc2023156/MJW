# 待剪輯的原始音效：9 個 MP3

將剪好的原始音效放在本資料夾，檔名請完全一致。每個檔案從 0 秒起就是該音效，避免前端空白。保留完整尾音，不需人工改變音調或速度。

| 檔名 | 用途 | 播放方式 |
| --- | --- | --- |
| `sfx_spin.mp3` | 按下 SPIN、滾輪啟動 | 每次旋轉一次 |
| `sfx_reel_stop.mp3` | 單一滾輪停牌 | 每欄停止時一次，請剪單次停牌聲 |
| `sfx_win_highlight.mp3` | 中獎牌高亮 | 每次連消開始一次 |
| `sfx_tile_clear.mp3` | 中獎牌消除 | 高亮結束、牌面消失時一次 |
| `sfx_tile_drop.mp3` | 落牌／補牌 | 每輪補牌一次 |
| `sfx_multiplier_up.mp3` | x2／x3／x5 等倍率提升 | 連消倍率提高時一次 |
| `sfx_anticipation_loop.mp3` | 瞇牌慢停等待聲 | 循環播放，直到最後一欄停牌；請剪可循環片段 |
| `sfx_free_game_trigger.mp3` | 觸發 FREE GAME | 進入免費遊戲提示時一次 |
| `sfx_total_win.mp3` | 一次旋轉總獎金結算 | 有獎金結算時一次 |

現有 `../audio/mp3/bgm_mg.mp3` 與 `../audio/mp3/bgm_bonus_loop.mp3` 已接用，不必重剪背景音樂。

開發伺服器會辨識新增的 MP3；放入後重新整理測試頁。如果伺服器未偵測新增檔案，重啟 `npm run dev`。正式版本需重新執行 `npm run build`。尚未放入的音效保持靜音，不使用合成音替代。
