import chalk from 'chalk'

export default class {
  blue(text: string) {
    console.log(chalk.blueBright(`[${this.getTime()}] => ${text}`))
  }

  green(text: string) {
    console.log(chalk.greenBright(`[${this.getTime()}] => ${text}`))
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

    return `${hour > 10 ? hour : `0${hour}`}:${minute > 10 ? minute : `0${minute}`} ${amOrPm}`
  }
}
