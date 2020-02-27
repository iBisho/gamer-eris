import config from '../config'
import GamerClient from './lib/structures/GamerClient'
import { Message, GuildTextableChannel } from 'eris'
import { Canvas } from 'canvas-constructor'
import { join } from 'path'
import GamerEmbed from './lib/structures/GamerEmbed'
import constants from './constants'
import HooksServices from './services/hooks'

import TwitchService from './services/twitch/index'
import TopGGAPI from 'dblapi.js'

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
  ignoreBots: false
  // intents: [
  //   'guilds',
  //   'guildMembers',
  //   'guildBans',
  //   'guildEmojis',
  //   'guildVoiceStates',
  //   'guildInvites',
  //   'guildMessages',
  //   'guildMessageReactions',
  //   'directMessages'
  // ]
})

// Create top.gg botlist configuration
new TopGGAPI(config.topgg.token, Gamer).on('posted', () => Gamer.helpers.logger.green(`Server stats updated on Top.GG`))

Gamer.globalCommandRequirements = {
  async custom(message, _args, context) {
    // DM should have necessary perms already
    if (!message.guildID) return true

    // Check if have send messages perms. Check before fetching guild data to potentially save a fetch
    const botPerms = (message.channel as GuildTextableChannel).permissionsOf(Gamer.user.id)
    if (!botPerms.has('readMessages') || !botPerms.has('sendMessages')) return false

    const language = Gamer.getLanguage(message.guildID)

    // Check if bot has embed links perms
    if (!botPerms.has('embedLinks')) {
      message.channel.createMessage(language(`common:NEED_EMBED_PERMS`))
      return false
    }

    // If the user is using commands within 2 seconds ignore it
    if (Gamer.slowmode.has(message.author.id)) {
      // Cleans up spam command messages from users
      if (botPerms.has('manageMessages')) message.delete().catch(() => undefined)
      return false
    }

    const supportChannelID = Gamer.guildSupportChannelIDs.get(message.guildID)
    const isAdmin = message.member?.permission.has('administrator')
    // If it is the support channel and NOT a server admin do not allow command
    if (message.channel.id === supportChannelID && !isAdmin) return false

    if (isAdmin) return true

    // Check custom command permissions for this command on this server
    const commandPerms = Gamer.guildCommandPermissions.get(`${message.guildID}.${context.commandName}`)
    const allCommandsPerms = Gamer.guildCommandPermissions.get(`${message.guildID}.allcommands`)

    // If no custom its enabled
    if (!commandPerms && !allCommandsPerms) return true

    if (commandPerms) {
      if (!commandPerms.enabled) {
        // The command is disabled but check if its disabled for this channel or any roles
        if (commandPerms.exceptionChannelIDs.includes(message.channel.id)) return true
        if (commandPerms.exceptionRoleIDs.some(id => message.member?.roles.includes(id))) return true
        return false
      }
      // The command is enabled but check if it is disabled for any of these roles
      if (commandPerms.exceptionChannelIDs.includes(message.channel.id)) return false
      if (commandPerms.exceptionRoleIDs.some(id => message.member?.roles.includes(id))) return false
    }

    if (allCommandsPerms) {
      if (!allCommandsPerms.enabled) {
        if (allCommandsPerms.exceptionChannelIDs.includes(message.channel.id)) return true
        if (allCommandsPerms.exceptionRoleIDs.some(id => message.member?.roles.includes(id))) return true
        return false
      }

      if (allCommandsPerms.exceptionChannelIDs.includes(message.channel.id)) return false
      if (allCommandsPerms.exceptionRoleIDs.some(id => message.member?.roles.includes(id))) return false
    }

    return true
  }
}

Gamer.addCommandDir(`${__dirname}/commands`)
  .addDirectory(`${__dirname}/monitors`)
  .addDirectory(`${__dirname}/events`)
  .connect()

Gamer.prefixes((message: Message) => {
  // If in DM use the default prefix
  if (!message.guildID) return
  // If in a server who has not customized their prefix, use the default prefix
  const prefix = Gamer.guildPrefixes.get(message.guildID)
  if (!prefix) return
  // If in a server with the custom prefix, use the custom prefix
  return prefix
})

// bind so the `this` is relevent to the event
for (const [name, event] of Gamer.events) Gamer.on(name, event.execute.bind(event))

process.on('unhandledRejection', error => {
  // Don't send errors for non production bots
  // Check !Gamer incase the errors are before bots ready
  if (Gamer.user?.id !== constants.general.gamerID) return console.error(error)

  // An unhandled error occurred on the bot in production
  console.error(error || `An unhandled rejection error occurred but error was null or undefined`)

  if (!error) return

  const embed = new GamerEmbed()
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    .setDescription(['```js', error.stack, '```'].join(`\n`))
    .setTimestamp()
    .setFooter('Unhandled Rejection Error Occurred')

  if (embed.code.description?.includes(`Error: Request timed out (>15000ms) on POST`)) {
    return Gamer.createMessage('680852595061162014', { embed: embed.code })
  }
  // Send error to the log channel on the gamerbot server
  return Gamer.createMessage(config.channelIDs.errors, { content: `<@!130136895395987456>`, embed: embed.code })
})

export default Gamer
