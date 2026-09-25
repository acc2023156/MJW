import { pgsoftAsset } from './pgsoftAssets'

import { soundSprites, voiceSprites, type SoundName, type VoiceName } from './audioSprites'

type Bank = 'general_audio' | 'vox'

export class AudioEngine {
  private music?: HTMLAudioElement
  private context?: AudioContext
  private buffers = new Map<Bank, Promise<AudioBuffer>>()
  private activeVoice?: AudioBufferSourceNode

  private load(bank: Bank): Promise<AudioBuffer> {
    this.context ??= new AudioContext()
    let pending = this.buffers.get(bank)
    if (!pending) {
      const context = this.context
      pending = fetch(pgsoftAsset(`audio/audio/mp3/${bank}.mp3`))
        .then(response => {
          if (!response.ok) throw new Error(`Audio ${bank}: HTTP ${response.status}`)
          return response.arrayBuffer()
        })
        .then(bytes => context.decodeAudioData(bytes))
        .then(buffer => {
          const table = bank === 'vox' ? voiceSprites : soundSprites
          for (const [name, [start, duration]] of Object.entries(table)) {
            if ((start + duration) / 1000 > buffer.duration + .03)
              throw new Error(`Audio timeline exceeds ${bank} duration: ${name}`)
          }
          return buffer
        })
      this.buffers.set(bank, pending)
      void pending.catch(error => { this.buffers.delete(bank); console.error(error) })
    }
    return pending
  }

  async checkTimelines() {
    const [sound, voice] = await Promise.all([this.load('general_audio'), this.load('vox')])
    return { soundDuration: sound.duration, voiceDuration: voice.duration }
  }

  private async segment(bank: Bank, range: readonly [number, number], voice = false) {
    const requested = performance.now()
    try {
      const pending = this.load(bank)
      await this.context!.resume()
      const buffer = await pending
      // Do not play stale effects after a slow download or a suspended tab.
      if (performance.now() - requested > 750) return
      const source = this.context!.createBufferSource()
      const gain = this.context!.createGain()
      source.buffer = buffer
      gain.gain.value = voice ? .8 : .65
      source.connect(gain).connect(this.context!.destination)
      if (voice) { this.activeVoice?.stop(); this.activeVoice = source }
      source.onended = () => {
        source.disconnect(); gain.disconnect()
        if (this.activeVoice === source) this.activeVoice = undefined
      }
      source.start(0, range[0] / 1000, range[1] / 1000)
    } catch (error) { console.error('Audio sprite playback failed', error) }
  }

  sound(name: SoundName) { void this.segment('general_audio', soundSprites[name]) }
  voice(name: VoiceName) { void this.segment('vox', voiceSprites[name], true) }
  spin() { this.sound('reel_spin') }
  settle(scatter = false, last = false) {
    this.sound(last ? 'reel_stop_heavy' : 'reel_stop_normal')
    if (scatter) this.sound('scatter_land')
  }
  highlight() { this.sound('win_fanfare') }
  clear() { this.sound('symbol_elimination') }
  drop() { this.sound('whoosh') }
  multiplier() { this.sound('multiplier_up') }
  freeGameTrigger() { this.sound('free_game'); this.voice('hu') }
  win() { this.sound('coin_waterfall') }
  click() { this.sound('ui_click') }
  toggle() { this.sound('toggle') }
  collect() { this.sound('collect') }

  playMusic(freeMode = false) {
    void this.checkTimelines().catch(() => undefined)
    const file = freeMode ? 'bgm_bonus_loop.mp3' : 'bgm_mg.mp3'
    const url = pgsoftAsset(`audio/audio/mp3/${file}`)
    if (this.music?.src.endsWith(file)) {
      void this.music.play().catch(() => undefined)
      return
    }
    this.music?.pause()
    this.music = new Audio(url)
    this.music.loop = true
    this.music.volume = .22
    void this.music.play().catch(() => undefined)
  }

  anticipation(active: boolean) {
    // The table gives a 580ms cue, not a seamless loop.
    if (active) this.sound('anticipation')
  }
}
