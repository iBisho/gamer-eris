import { Client, ClientOptions } from 'yuuko'
import * as i18next from 'i18next'
import i18n from '../../i18next'
import * as glob from 'glob'
import { PrivateChannel, Message } from 'eris'
import { Collector } from '../types/gamer'
import * as fs from 'fs'
import { join } from 'path'

import Monitor from './Monitor'
import Event from './Event'

import Database from '../../database/mongodb'

import ProfileHelper from '../utils/profiles'
import DiscordHelper from '../utils/discord'
import FeedbackHelper from '../utils/feedback'
import LevelsHelper from '../utils/levels'
import LoggerHelper from '../utils/logger'
import ScriptsHelper from '../utils/scripts'
import TransformHelper from '../utils/transform'
import constants from '../../constants'

const rootFolder = join(__dirname, `..`, `..`, `..`, `..`)
const assetsFolder = join(rootFolder, `assets`)
const profileFolder = join(assetsFolder, `profile`)
const badgesFolder = join(profileFolder, `badges`)

const assetsPaths = {
  whiteRectangle: join(profileFolder, `left_rectangle_white.png`),
  blackRectangle: join(profileFolder, `left_rectangle_black.png`),
  blueCircle: join(profileFolder, `blue_circle.png`),
  xpbar: join(profileFolder, `xp_bar_empty.png`),
  badges: {
    vip: join(badgesFolder, `vip.png`),
    nintendo: join(badgesFolder, `nintendo.png`),
    playstation: join(badgesFolder, `playstation.png`),
    xbox: join(badgesFolder, `xbox.png`),
    mobile: join(badgesFolder, `mobile.png`),
    steam: join(badgesFolder, `steam.png`)
  }
}

export default class GamerClient extends Client {
  // i18n solution
  i18n: Map<string, i18next.TFunction> = new Map()

  // Message collectors
  collectors: Map<string, Collector> = new Map()

  database = new Database()

  helpers = {
    profiles: new ProfileHelper(),
    discord: new DiscordHelper(),
    feedback: new FeedbackHelper(),
    levels: new LevelsHelper(this),
    logger: new LoggerHelper(),
    scripts: new ScriptsHelper(),
    transform: new TransformHelper()
  }

  buffers = {
    botLogo: fs.readFileSync(constants.profiles.clanDefaults.logo),
    profiles: {
      blackRectangle: fs.readFileSync(assetsPaths.blackRectangle),
      whiteRectangle: fs.readFileSync(assetsPaths.whiteRectangle),
      blueCircle: fs.readFileSync(assetsPaths.blueCircle),
      xpbar: fs.readFileSync(assetsPaths.xpbar),
      badges: {
        vip: fs.readFileSync(assetsPaths.badges.vip),
        nintendo: fs.readFileSync(assetsPaths.badges.nintendo),
        playstation: fs.readFileSync(assetsPaths.badges.playstation),
        xbox: fs.readFileSync(assetsPaths.badges.xbox),
        mobile: fs.readFileSync(assetsPaths.badges.mobile),
        steam: fs.readFileSync(assetsPaths.badges.steam)
      }
    }
  }

  // All our stores to store files which we can reload easily.
  events: Map<string, Event> = new Map()
  monitors: Map<string, Monitor> = new Map()

  constructor(options: ClientOptions) {
    super(options)

    this.on('messageCreate', this.runMonitors)
  }

  async runMonitors(message: Message) {
    if (message.channel instanceof PrivateChannel) return true
    let allowCommands = true
    await Promise.all(
      [...this.monitors.values()].map(async monitor => {
        if (monitor.ignoreBots && message.author.bot) return
        if (monitor.ignoreDM && message.channel instanceof PrivateChannel) return
        if (monitor.ignoreEdits && message.editedTimestamp) return
        if (monitor.ignoreOthers && message.author.id !== this.user.id) return

        const result = await monitor.execute(message, this)
        // If the result is truthy from the monitors cancel the commands for this message
        if (result) allowCommands = false
      })
    )

    return allowCommands
  }

  async connect() {
    // get i18n ready
    this.i18n = await i18n()
    // Allow easy access to i18n
    this.extendContext({ languages: this.i18n })

    return super.connect()
  }

  // Load the files in a directory.
  addDirectory(dirname: string) {
    if (!dirname.endsWith('/')) dirname += '/'
    const pattern = `${dirname}*.[tj]s`
    const filenames = glob.sync(pattern)
    for (const filename of filenames) {
      delete require.cache[filename]
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      let file = require(filename)
      // Use object.assign to preserve other exports
      file = Object.assign(file.default, file)
      delete file.default
      file.filename = filename

      const name = filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'))
      // Add to the proper map based on the name of the directory
      if (dirname.endsWith('monitors/')) this.monitors.set(name, new file())
      if (dirname.endsWith('events/')) this.events.set(name, new file(name))
      // else if (dirname.endsWith('inhibitors/')) this.inhibitors.set(name, new file())
      // else if (dirname.endsWith('finalizers/')) this.finalizers.set(name, new file())
      // else if (dirname.endsWith('functions/')) this.functions.set(name, new file())
    }
    return this
  }

  reloadDirectory(dirname: string, map: Map<string, unknown>) {
    // Delete all current items in the map
    map.clear()
    // Reload everything from that directory
    this.addDirectory(dirname)

    return this
  }
}
