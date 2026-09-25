import { AudioEngine } from './AudioEngine'
import { soundSprites, voiceSprites, type SoundName, type VoiceName } from './audioSprites'

export async function showAudioReview() {
  const audio = new AudioEngine()
  const panel = document.createElement('section')
  panel.style.cssText = 'position:fixed;inset:0;z-index:20;overflow:auto;background:#182421;color:white;padding:24px;font:16px system-ui'
  const title = document.createElement('h1')
  title.textContent = 'MJW 原檔音效／語音分段試聽'
  const status = document.createElement('p')
  status.textContent = '正在解碼原始音檔並驗證時間範圍…'
  panel.append(title, status)
  document.body.append(panel)
  try {
    const result = await audio.checkTimelines()
    status.textContent = `時間範圍驗證通過：general_audio.mp3 ${result.soundDuration.toFixed(3)} 秒；vox.mp3 ${result.voiceDuration.toFixed(3)} 秒。分段內容依提供表格，請點擊試聽確認。`
    for (const [bank, table] of [['音效', soundSprites], ['語音', voiceSprites]] as const) {
      const heading = document.createElement('h2'); heading.textContent = bank; panel.append(heading)
      for (const [name, [start, duration]] of Object.entries(table)) {
        const row = document.createElement('p')
        const button = document.createElement('button')
        button.textContent = `播放 ${name}`
        button.onclick = () => bank === '音效' ? audio.sound(name as SoundName) : audio.voice(name as VoiceName)
        row.append(button, `  ${(start / 1000).toFixed(2)}–${((start + duration) / 1000).toFixed(2)} 秒`)
        panel.append(row)
      }
    }
  } catch (error) { status.textContent = `驗證失敗：${String(error)}` }
}
