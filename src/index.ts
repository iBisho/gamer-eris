import config from '../config'
import GamerClient from './lib/structures/GamerClient'
import { Message, PrivateChannel } from 'eris'
import { GuildSettings } from './lib/types/settings'
import { Canvas } from 'canvas-constructor'
import { join } from 'path'
import GamerEmbed from './lib/structures/GamerEmbed'
import constants from './constants'

// Register the assets
const rootFolder = join(__dirname, `..`, `..`)
const fontsFolder = join(rootFolder, `assets/fonts`)
Canvas.registerFont(join(fontsFolder, `sft_heavy.ttf`), `SFTHeavy`)
  .registerFont(join(fontsFolder, `lato_heavy.ttf`), `LatoHeavy`)
  .registerFont(join(fontsFolder, `lato_bold.ttf`), `LatoBold`)
  .registerFont(join(fontsFolder, `NotoEmoji.ttf`), `LatoBold`)
  .registerFont(join(fontsFolder, `NotoSans-Regular.ttf`), `LatoBold`)

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
  }
})

Gamer.globalCommandRequirements = {
  async custom(message: Message) {
    // DM should have necessary perms already
    if (message.channel instanceof PrivateChannel) return true

    // Check if have send messages perms. Check before fetching guild data to potentially save a fetch
    const botPerms = message.channel.permissionsOf(Gamer.user.id)
    if (!botPerms.has('readMessages') || !botPerms.has('sendMessages')) return false

    const guildSettings = (await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })) as GuildSettings | null
    const language = Gamer.i18n.get(guildSettings ? guildSettings.language : 'en-US')
    if (!language) return false

    // Check if bot has embed links perms
    if (!botPerms.has('embedLinks')) {
      message.channel.createMessage(language(`common:NEED_EMBED_PERMS`))
      return false
    }

    return true
  }
}

Gamer.addCommandDir(`${__dirname}/commands`)
  .addDirectory(`${__dirname}/monitors`)
  .addDirectory(`${__dirname}/events`)
  .connect()

// bind so the `this` is relevent to the event
for (const [name, event] of Gamer.events) Gamer.on(name, event.execute.bind(event))

process.on('unhandledRejection', error => {
  // Don't send errors for non production bots
  if (Gamer.user.id !== constants.general.gamerID) return console.error(error)
  // An unhandled error occurred on the bot in production
  console.error(error || `An unhandled rejection error occurred but error was null or undefined`)

  const embed = new GamerEmbed()
    .setDescription(['```js', error, '```'].join(`\n`))
    .setTimestamp()
    .setFooter('Unhandled Rejection Error Occurred')
  // Send error to the log channel on the gamerbot server
  Gamer.createMessage(config.channelIDs.errors, { content: `<@!130136895395987456>`, embed: embed.code })
})

export default Gamer
