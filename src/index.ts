import config from '../config'
import GamerClient from './lib/structures/GamerClient'
import { Message, GuildTextableChannel } from 'eris'
import { Canvas } from 'canvas-constructor'
import { join } from 'path'
import { MessageEmbed } from 'helperis'
import constants from './constants'
import TopGGAPI from 'dblapi.js'
import { deleteMessage, sendMessage } from './lib/utils/eris'

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
  restMode: true,
  caseSensitiveCommands: false,
  disableDefaultMessageListener: true,
  // getAllUsers: true,
  intents: [
    'guilds',
    'guildMembers',
    'guildBans',
    'guildEmojis',
    'guildVoiceStates',
    'guildInvites',
    'guildMessages',
    'guildMessageReactions',
    'directMessages'
  ]
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
      sendMessage(message.channel.id, language(`common:NEED_EMBED_PERMS`))
      return false
    }

    // If the user is using commands within 2 seconds ignore it
    if (Gamer.slowmode.has(message.author.id)) {
      const prefix = Gamer.guildPrefixes.get(message.guildID)
      if (prefix) {
        const [firstWord] = message.content.split(' ')
        if (firstWord && context.commandName === firstWord.substring(prefix.length)) {
          // Cleans up spam command messages from users
          deleteMessage(message)
          return false
        }
      }
    }

    const supportChannelID = Gamer.guildSupportChannelIDs.get(message.guildID)
    const isAdmin = message.member?.permission.has('administrator')
    // If it is the support channel and NOT a server admin do not allow command
    if (message.channel.id === supportChannelID && !isAdmin && context.commandName !== 'mail') return false

    if (isAdmin) return true

    if (!context.commandName) return false

    const command = Gamer.commandForName(context.commandName)
    if (!command) return true

    const [commandName] = command.names

    // Check custom command permissions for this command on this server
    const commandPerms = Gamer.guildCommandPermissions.get(`${message.guildID}.${commandName}`)
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

Gamer.addDir(`${__dirname}/commands`).addDir(`${__dirname}/events`).addDirectory(`${__dirname}/monitors`).connect()

Gamer.prefixes((message: Message) => {
  // If in DM use the default prefix
  if (!message.guildID) return
  // If in a server who has not customized their prefix, use the default prefix
  const prefix = Gamer.guildPrefixes.get(message.guildID)
  if (!prefix) return
  // If in a server with the custom prefix, use the custom prefix
  return prefix
})

process.on('unhandledRejection', error => {
  // Don't send errors for non production bots
  // Check !Gamer incase the errors are before bots ready
  if (Gamer.user?.id !== constants.general.gamerID) return console.error(error)

  // An unhandled error occurred on the bot in production
  console.error(error || `An unhandled rejection error occurred but error was null or undefined`)

  if (!error) return

  const embed = new MessageEmbed()
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
