import { Client, ClientOptions } from 'yuuko'
import i18n from '../../i18next'
import { TFunction } from 'i18next'
import * as glob from 'glob'
import { PrivateChannel, Message } from 'eris'
import { Collector, Mission } from '../types/gamer'
import * as fs from 'fs'
import { join } from 'path'

import Monitor from './Monitor'
import Event from './Event'

import Database from '../../database/mongodb'

import ProfileHelper from '../utils/profiles'
import DiscordHelper from '../utils/discord'
import EventsHelper from '../utils/events'
import FeedbackHelper from '../utils/feedback'
import LeaderboardHelper from '../utils/leaderboards'
import LevelsHelper from '../utils/levels'
import LoggerHelper from '../utils/logger'
import ModerationHelper from '../utils/moderation'
import ScriptsHelper from '../utils/scripts'
import TransformHelper from '../utils/transform'
import constants from '../../constants'
import { AmplitudeEvent } from '../types/amplitude'

const rootFolder = join(__dirname, `..`, `..`, `..`, `..`)
const assetsFolder = join(rootFolder, `assets`)

const assetsPaths = {
  whiteRectangle: join(assetsFolder, `profile/left_rectangle_white.png`),
  blackRectangle: join(assetsFolder, `profile/left_rectangle_black.png`),
  blueCircle: join(assetsFolder, `profile/blue_circle.png`),
  xpbar: join(assetsFolder, `profile/xp_bar_empty.png`),
  badges: {
    vip: join(assetsFolder, `profile/badges/vip.png`),
    nintendo: join(assetsFolder, `profile/badges/nintendo.png`),
    playstation: join(assetsFolder, `profile/badges/playstation.png`),
    xbox: join(assetsFolder, `profile/badges/xbox.png`),
    mobile: join(assetsFolder, `profile/badges/mobile.png`),
    steam: join(assetsFolder, `profile/badges/steam.png`)
  },
  background: join(assetsFolder, `leaderboard/background.png`),
  circle: join(assetsFolder, `leaderboard/circle.png`),
  rectangle: join(assetsFolder, `leaderboard/rectangle.png`)
}

export default class GamerClient extends Client {
  // Used for bot statistics. Events are stored in cache and every second 10 events are uploaded to amplitude.
  amplitude: AmplitudeEvent[] = []
  // i18n solution
  i18n: Map<string, TFunction> = new Map()

  // Message collectors
  collectors: Map<string, Collector> = new Map()

  database = new Database()

  helpers = {
    discord: new DiscordHelper(),
    events: new EventsHelper(this),
    feedback: new FeedbackHelper(),
    leaderboards: new LeaderboardHelper(this),
    levels: new LevelsHelper(this),
    logger: new LoggerHelper(),
    moderation: new ModerationHelper(this),
    profiles: new ProfileHelper(),
    scripts: new ScriptsHelper(),
    transform: new TransformHelper()
  }

  buffers = {
    botLogo: fs.readFileSync(constants.profiles.clanDefaults.logo),
    events: {
      background: fs.readFileSync(join(assetsFolder, `eventCard/background.png`)),
      rectangle: fs.readFileSync(join(assetsFolder, `eventCard/rectangle.png`)),
      calendar: fs.readFileSync(join(assetsFolder, `eventCard/calendar.png`)),
      gaming: fs.readFileSync(join(assetsFolder, `eventCard/gaming.png`)),
      private: fs.readFileSync(join(assetsFolder, `eventCard/private.png`)),
      recurring: fs.readFileSync(join(assetsFolder, `eventCard/recurring.png`)),
      members: fs.readFileSync(join(assetsFolder, `eventCard/members.png`)),
      waiting: fs.readFileSync(join(assetsFolder, `eventCard/waiting.png`)),
      denials: fs.readFileSync(join(assetsFolder, `eventCard/denials.png`)),
      clock: fs.readFileSync(join(assetsFolder, `eventCard/clock.png`)),
      community: fs.readFileSync(join(assetsFolder, `eventCard/community.png`)),
      tag: fs.readFileSync(join(assetsFolder, `eventCard/tag.png`))
    },
    leaderboards: {
      background: fs.readFileSync(join(assetsFolder, `leaderboard/background.png`)),
      circle: fs.readFileSync(join(assetsFolder, `leaderboard/circle.png`)),
      rectangle: fs.readFileSync(join(assetsFolder, `leaderboard/rectangle.png`))
    },
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

  missions: Mission[] = []

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
