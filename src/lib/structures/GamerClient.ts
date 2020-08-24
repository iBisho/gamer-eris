import { Client } from 'yuuko'
import i18n from '../../i18next'
import { TFunction } from 'i18next'
import * as glob from 'glob'
import { Collector, Mission, GamerTag } from '../types/gamer'
import * as fs from 'fs'
import { join } from 'path'

import Monitor from './Monitor'

import Database from '../../database/mongodb'

import ProfileHelper from '../utils/profiles'
import DiscordHelper from '../utils/discord'
import EventsHelper from '../utils/events'
import FeedbackHelper from '../utils/feedback'
import LeaderboardHelper from '../utils/leaderboards'
import LevelsHelper from '../utils/levels'
import LoggerHelper from '../utils/logger'
import MailHelper from '../utils/mail'
import ModerationHelper from '../utils/moderation'
import ScriptsHelper from '../utils/scripts'
import TransformHelper from '../utils/transform'
import TenorHelper from '../utils/tenor'
import UtilsHelper from '../utils/utils'

import constants from '../../constants'
import { AmplitudeEvent } from '../types/amplitude'
import { GamerCommandPermission } from '../../database/schemas/command'
import { GamerMirror } from '../../database/schemas/mirrors'

const rootFolder = join(__dirname, `..`, `..`, `..`, `..`)
const assetsFolder = join(rootFolder, `assets`)

const assetsPaths = {
  whiteRectangle: join(assetsFolder, `profile/left_rectangle_white.png`),
  blackRectangle: join(assetsFolder, `profile/left_rectangle_black.png`),
  orangeRectangle: join(assetsFolder, `profile/left_rectangle_orange.png`),
  redRectangle: join(assetsFolder, `profile/left_rectangle_red.png`),
  greenRectangle: join(assetsFolder, `profile/left_rectangle_green.png`),
  purpleRectangle: join(assetsFolder, `profile/left_rectangle_purple.png`),
  blueRectangle: join(assetsFolder, `profile/left_rectangle_blue.png`),
  blueCircle: join(assetsFolder, `profile/blue_circle.png`),
  xpbar: join(assetsFolder, `profile/xp_bar_empty.png`),
  badges: {
    vip: join(assetsFolder, `profile/badges/vip.png`),
    loud: join(assetsFolder, `profile/badges/loud.jpg`),
    shoptitans: join(assetsFolder, `profile/Backgrounds/shoptitans.jpg`)
  },
  background: join(assetsFolder, `leaderboard/background.png`),
  circle: join(assetsFolder, `leaderboard/circle.png`),
  rectangle: join(assetsFolder, `leaderboard/rectangle.png`)
}

export default class GamerClient extends Client {
  // Used for bot statistics. Events are stored in cache and every second 10 events are uploaded to amplitude.
  amplitude: AmplitudeEvent[] = []

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
      orangeRectangle: fs.readFileSync(assetsPaths.orangeRectangle),
      redRectangle: fs.readFileSync(assetsPaths.redRectangle),
      greenRectangle: fs.readFileSync(assetsPaths.greenRectangle),
      purpleRectangle: fs.readFileSync(assetsPaths.purpleRectangle),
      blueRectangle: fs.readFileSync(assetsPaths.blueRectangle),
      blueCircle: fs.readFileSync(assetsPaths.blueCircle),
      xpbar: fs.readFileSync(assetsPaths.xpbar),
      badges: {
        vip: fs.readFileSync(assetsPaths.badges.vip),
        loud: fs.readFileSync(assetsPaths.badges.loud),
        // // playstation: fs.readFileSync(assetsPaths.badges.playstation),
        // // xbox: fs.readFileSync(assetsPaths.badges.xbox),
        // // mobile: fs.readFileSync(assetsPaths.badges.mobile),
        shoptitans: fs.readFileSync(assetsPaths.badges.shoptitans)
        // // steam: fs.readFileSync(assetsPaths.badges.steam)
      }
    }
  }

  // Message collectors
  collectors: Map<string, Collector> = new Map()

  database = Database

  helpers = {
    discord: new DiscordHelper(),
    events: new EventsHelper(this),
    feedback: new FeedbackHelper(this),
    leaderboards: new LeaderboardHelper(this),
    levels: new LevelsHelper(this),
    logger: new LoggerHelper(this),
    mail: new MailHelper(this),
    moderation: new ModerationHelper(this),
    profiles: new ProfileHelper(this),
    scripts: new ScriptsHelper(this),
    transform: new TransformHelper(this),
    tenor: new TenorHelper(this),
    utils: new UtilsHelper(this)
  }

  // i18n solution
  i18n: Map<string, TFunction> = new Map()

  missions: Mission[] = []
  missionsStartTimestamp = Date.now()
  monitors: Map<string, Monitor> = new Map()
  // Tags are cached so no need to fetch on every message
  tags: Map<string, GamerTag> = new Map()
  // Array that holds user information to have slowmode when users use commands rapidly.
  slowmode: Map<string, number> = new Map()
  // The daily cooldown holder
  cooldowns: Map<string, number> = new Map()
  // The customized guild prefixes. Cached so they arent fetched on every message
  guildPrefixes: Map<string, string> = new Map()
  // The languages set. Cached because they are the most often reason to fetch guild settings
  guildLanguages: Map<string, string> = new Map()
  // The guild support channel ids. This is needed on every single message sent so we cache it
  guildSupportChannelIDs: Map<string, string> = new Map()
  /** This stores the guilds that have disabled Tenor Gifs */
  guildsDisableTenor: Map<string, boolean> = new Map()
  /** This stores the custom command permissions for guilds */
  guildCommandPermissions = new Map<string, GamerCommandPermission>()
  /** This stores the guild ids that have had their members fully fetched. */
  allMembersFetchedGuildIDs = new Set<string>()
  /** The amount of xp per message setting cached as its needed on all messages */
  guildsXPPerMessage = new Map<string, number>()
  /** The amount of xp per minute in voice setting */
  guildsXPPerMinuteVoice = new Map<string, number>()
  vipGuildIDs = new Set<string>()
  mirrors = new Map<string, GamerMirror>()
  /** Debug boolean to enable all the DEBUG logs during moments where we need to debug. */
  debugModeEnabled = false
  /** Stores user ids for each word that has been subscribed for. */
  spyRecords = new Map<string, string[]>()
  /** Latest subscriptions to help filter our alerts */
  subscriptions = {
    reddit: new Map<string, string[]>(),
    youtube: new Map<string, string[]>()
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
      let file = require(filename)
      // Use object.assign to preserve other exports
      file = Object.assign(file.default, file)
      delete file.default
      file.filename = filename

      const name = filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'))
      // Add to the proper map based on the name of the directory
      if (dirname.endsWith('monitors/')) this.monitors.set(name, new file())
    }
    return this
  }

  reloadDirectory(dirname: string, map: Map<string, unknown>) {
    // Delete all current items in the map
    map.clear()
    // Reload everything from that directory
    this.addDirectory(join(__dirname, `../../${dirname}`))

    return this
  }

  getLanguage(guildID?: string) {
    const guildLanguage = guildID ? this.guildLanguages.get(guildID) : undefined
    const language = guildLanguage ? this.i18n.get(guildLanguage) : undefined
    const english = this.i18n.get('en-US') as TFunction
    return language || english
  }
}
