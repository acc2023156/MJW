import { Container, Graphics, Text } from 'pixi.js'

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export class StatusPanel extends Container {
  private readonly creditValue: Text
  private readonly betValue: Text
  private readonly winValue: Text

  constructor() {
    super()
    this.creditValue = this.createMetric('CREDIT', 75)
    this.winValue = this.createMetric('WIN', 222.5)
    this.betValue = this.createMetric('BET', 370)
    this.setValues(1000, 10, 0)
  }

  private createMetric(name: string, centerX: number) {
    this.addChild(new Graphics().roundRect(centerX - 62, 8, 124, 38, 19).fill({ color: '#2e1711', alpha: .58 }))
    const heading = new Text({ text: name, style: { fontFamily: 'Arial', fontSize: 9, fontWeight: '700', fill: '#cda76e', letterSpacing: 1 } })
    heading.anchor.set(.5)
    heading.position.set(centerX, 16)
    this.addChild(heading)
    const value = new Text({ text: '', style: { fontFamily: 'Arial', fontSize: 14, fontWeight: '800', fill: '#d9ad72' } })
    value.anchor.set(.5)
    value.position.set(centerX, 33)
    this.addChild(value)
    return value
  }

  setValues(credit: number, bet: number, win: number) {
    this.creditValue.text = `¥${money(credit)}`
    this.betValue.text = `¥${money(bet)}`
    this.winValue.text = `¥${money(win)}`
  }
}
