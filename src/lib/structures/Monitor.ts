import { Message } from 'eris'
import GamerClient from './GamerClient'

export default class Monitor {
  ignoreBots = true
  ignoreOthers = false
  ignoreEdits = false
  ignoreDM = true

  constructor(options: MonitorOptions = {}) {
    if (options.ignoreBots) this.ignoreBots = options.ignoreBots
    if (options.ignoreOthers) this.ignoreOthers = options.ignoreOthers
    if (options.ignoreEdits) this.ignoreEdits = options.ignoreEdits
    if (options.ignoreDM) this.ignoreDM = options.ignoreDM
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_message: Message, _Gamer: GamerClient): Promise<boolean | void> {
    throw 'A monitor must be executable.'
  }
}

export interface MonitorOptions {
  ignoreBots?: boolean
  ignoreOthers?: boolean
  ignoreEdits?: boolean
  ignoreDM?: boolean
}
