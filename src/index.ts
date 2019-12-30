import config from '../config'
import GamerClient from './lib/structures/GamerClient'
import { Message, PrivateChannel, GroupChannel } from 'eris'
import { Canvas } from 'canvas-constructor'
import { join } from 'path'
import GamerEmbed from './lib/structures/GamerEmbed'
import constants from './constants'
import HooksServices from './services/hooks'

import TwitchService from './services/twitch/index'

// Initiate hooks service
HooksServices(config.hooks.port)

// Initiate twitch service
TwitchService()

// Register the assets
const rootFolder = join(__dirname, `..`, `..`)
const fontsFolder = join(rootFolder, `assets/fonts`)
Canvas.registerFont(join(fontsFolder, `sft_heavy.ttf`), `SFTHeavy`)
  .registerFont(join(fontsFolder, `lato_heavy.ttf`), `LatoHeavy`)
  .registerFont(join(fontsFolder, `lato_bold.ttf`), `LatoBold`)
  .registerFont(join(fontsFolder, `NotoEmoji.ttf`), `LatoBold`)
  .registerFont(join(fontsFolder, `NotoSans-Regular.ttf`), `LatoBold`)
  .registerFont(join(fontsFolder, `SF-Pro-Text-Heavy.otf`), `SFTHeavy`)
  .registerFont(join(fontsFolder, `SF-Pro-Text-Light.otf`), `SFTLight`)
  .registerFont(join(fontsFolder, `SF-Pro-Text-Bold.otf`), `SFTBold`)
  .registerFont(join(fontsFolder, `SF-Pro-Text-Regular.otf`), `SFTRegular`)
  .registerFont(join(fontsFolder, `SF-Pro-Text-Medium.otf`), `SFTMedium`)

const Gamer = new GamerClient({
  token: config.token,
  prefix: config.defaultPrefix,
  maxShards: `auto`,
  ignoreGlobalRequirements: false,
  getAllUsers: true,
  disableEvents: {
    CHANNEL_PINS_UPDATE: true,
    GUILD_UPDATE: true,
    GUILD_INTEGRATIONS_UPDATE: true,
    PRESENCE_UPDATE: true,
    TYPING_START: true,
    USER_UPDATE: true,
    WEBHOOKS_UPDATE: true
  },
  ignoreBots: false
})

Gamer.globalCommandRequirements = {
  async custom(message, _args, context) {
    console.log(1)
    // DM should have necessary perms already
    if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return true
    console.log(message.content, context.commandName)
    const isDemoChannel = message.channel.id !== '328662219086888961'
    // If this is the live demo channel and the user is a bot cancel out
    if (isDemoChannel && message.author.bot) return false
    // If this is live demo and the user is a bot but not a webhook cancel
    if (isDemoChannel && message.author.discriminator !== '0000' && message.author.bot) return false
    console.log(2)
    // Check if have send messages perms. Check before fetching guild data to potentially save a fetch
    const botPerms = message.channel.permissionsOf(Gamer.user.id)
    if (!botPerms.has('readMessages') || !botPerms.has('sendMessages')) return false
    console.log(3)
    const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
    if (!language) return false
    console.log(4)
    // Check if bot has embed links perms
    if (!botPerms.has('embedLinks')) {
      message.channel.createMessage(language(`common:NEED_EMBED_PERMS`))
      return false
    }
    console.log(5)
    // If the user is using commands within 2 seconds ignore it
    if (Gamer.slowmode.has(message.author.id)) {
      // Cleans up spam command messages from users
      if (botPerms.has('manageMessages')) message.delete().catch(() => null)
      return false
    }
    console.log(6)
    const supportChannelID = Gamer.guildSupportChannelIDs.get(message.channel.guild.id)
    // If it is the support channel and NOT a server admin do not allow command
    if (
      message.channel.id === supportChannelID &&
      context.commandName !== 'mail' &&
      !message.member?.permission.has('administrator')
    )
      return false

    return true
  }
}

Gamer.addCommandDir(`${__dirname}/commands`)
  .addDirectory(`${__dirname}/monitors`)
  .addDirectory(`${__dirname}/events`)
  .connect()

Gamer.prefixes((message: Message) => {
  // If in DM use the default prefix
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return
  // If in a server who has not customized their prefix, use the default prefix
  const prefix = Gamer.guildPrefixes.get(message.channel.guild.id)
  if (!prefix) return
  // If in a server with the custom prefix, use the custom prefix
  return prefix
})

// bind so the `this` is relevent to the event
for (const [name, event] of Gamer.events) Gamer.on(name, event.execute.bind(event))

process.on('unhandledRejection', error => {
  // Don't send errors for non production bots
  // Check !Gamer incase the errors are before bots ready
  if (!Gamer || Gamer.user.id !== constants.general.gamerID) return console.error(error)
  // An unhandled error occurred on the bot in production
  console.error(error || `An unhandled rejection error occurred but error was null or undefined`)

  if (!error) return

  const embed = new GamerEmbed()
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    .setDescription(['```js', error.stack, '```'].join(`\n`))
    .setTimestamp()
    .setFooter('Unhandled Rejection Error Occurred')
  // Send error to the log channel on the gamerbot server
  Gamer.createMessage(config.channelIDs.errors, { content: `<@!130136895395987456>`, embed: embed.code })
})

process.on('uncaughtException', error => {
  // Don't send errors for non production bots
  // Check !Gamer incase the errors are before bots ready
  if (!Gamer || Gamer.user.id !== constants.general.gamerID) return console.error(error)
  // An unhandled error occurred on the bot in production
  console.error(error || `An uncaughtException error occurred but error was null or undefined`)

  if (!error) return

  const embed = new GamerEmbed()
    .setDescription(['```js', error.stack, '```'].join(`\n`))
    .setTimestamp()
    .setFooter('Uncaught Exception Error Occurred')
  // Send error to the log channel on the gamerbot server
  Gamer.createMessage(config.channelIDs.errors, { content: `<@!130136895395987456>`, embed: embed.code })
})

export default Gamer
