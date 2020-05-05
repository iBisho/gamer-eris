import chalk from 'chalk'
import GamerClient from '../structures/GamerClient'

export default class {
  Gamer: GamerClient

  constructor(client: GamerClient) {
    this.Gamer = client
  }

  debug(text: unknown, color: 'red' | 'yellow' | 'green' | 'blue' = 'red') {
    if (!this.Gamer.debugModeEnabled) return

    const finaltext = `[DEBUG MODE]: ${typeof text === 'string' ? text : JSON.stringify(text)}`
    if (color === 'yellow') this.yellow(finaltext)
    else if (color === 'green') this.green(finaltext)
    else if (color === 'blue') this.blue(finaltext)
    else console.log(chalk.redBright(this.setTime(finaltext)))
  }

  yellow(text: string) {
    console.log(chalk.yellowBright(this.setTime(text)))
  }

  blue(text: string) {
    console.log(chalk.blueBright(this.setTime(text)))
  }

  green(text: string) {
    console.log(chalk.greenBright(this.setTime(text)))
  }

  setTime(text: unknown) {
    return `[${this.getTime()}] => ${typeof text === 'string' ? text : JSON.stringify(text)}`
  }

  getTime() {
    const now = new Date()
    const hours = now.getHours()
    const minute = now.getMinutes()

    let hour = hours
    let amOrPm = `AM`
    if (hour > 12) {
      amOrPm = `PM`
      hour = hour - 12
    }

    return `${hour >= 10 ? hour : `0${hour}`}:${minute >= 10 ? minute : `0${minute}`} ${amOrPm}`
  }
}
