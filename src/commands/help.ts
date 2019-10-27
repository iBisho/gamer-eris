import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'
import Constants from '../constants/index'
import GuildDefaults from '../constants/settings/guild'

const categories = [
  { name: `basic`, commands: [`help`, `ping`, `invite`, `server`, `user`] },
  {
    name: `fun`,
    commands: [
      `baka`,
      `compliment`,
      `cuddle`,
      `kanna`,
      `kiss`,
      `kitten`,
      `pat`,
      `poke`,
      `puppy`,
      `slap`,
      `supernatural`,
      `tickle`,
      `advice`,
      `wisdom`,
      `userimage`
    ]
  },
  { name: `settings`, commands: [`afk`] }
]

export default new Command([`help`, `h`, `commands`, `cmds`], async (message, args, context) => {
  // Gamers goal is to increase activity in a server not in a DM.
  if (message.channel instanceof PrivateChannel)
    return message.channel.createMessage(`Please use this command on a guild. Thank you!`)

  const Gamer = context.client as GamerClient
  const settings =
    ((await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null) ||
    GuildDefaults
  if (!settings) return

  const language = Gamer.i18n.get(settings ? settings.language : 'en-US')
  if (!language) return

  const prefix = settings.prefix || '.'
  const FEATURES = language(`basic/help:FEATURES`, { prefix })
  const VIPFEATURES = language(`basic/help:VIPFEATURES`, { prefix })
  const CHECKWIKI = language(`basic/help:CHECK_WIKI`)
  const LINKSVALUE = language(`basic/help:LINKS_VALUE`, { patreon: Constants.emojis.patreon })

  if (!args.length) {
    // Create the main help embed
    const embed = new GamerEmbed()
      .setAuthor(message.author.username, message.author.avatarURL)
      .addField(language(`basic/help:MOST_USED`), FEATURES)
      .addField(language(`basic/help:SEE_ALL`), CHECKWIKI)
      .addField(language(`basic/help:LINKS`), LINKSVALUE)

    if (settings.vip.isVIP) embed.addField(language(`basic/help:VIP_FEATURES`), VIPFEATURES)

    return message.channel.createMessage({ embed: embed.code })
  }

  const [commandName] = args
  if (commandName.toLowerCase() === `all`) {
    const allEmbed = new GamerEmbed().setAuthor(message.author.username, message.author.avatarURL)
    for (const category of categories) {
      allEmbed.addField(
        `**» ${Gamer.helpers.transform.splitCamelCase(category.name)}**:`,
        `\`${category.commands.map(name => Gamer.helpers.transform.splitCamelCase(name)).join('`, `')}\``
      )
    }
    return message.channel.createMessage({ embed: allEmbed.code })
  }

  const command = Gamer.commandForName(commandName)
  if (!command) return message.channel.createMessage(language(`basic/help:UNKNOWN`, { name: commandName }))
  const category = categories.find(c => c.commands.includes(command.name.toLowerCase())) || { name: `basic` }

  const EXTENDED = language(`${category.name}/${command.name}:EXTENDED`, { prefix })
  const DESCRIPTION = language(`${category.name}/${command.name}:DESCRIPTION`, { prefix })
  const USAGE = language(`${category.name}/${command.name}:USAGE`, { prefix })
  const ALIASES = language(`${category.name}/${command.name}:ALIASES`, { prefix })
  const NO_EXTENDED = language('basic/help:NO_EXTENDED')

  const embed = new GamerEmbed()
    .setAuthor(
      language('basic/help:AUTHOR', { commandName: command.name }),
      Gamer.user.avatarURL,
      Constants.general.gamerServerInvite
    )
    .setDescription(DESCRIPTION)
    .addField(language('basic/help:EXTENDED_NAME'), EXTENDED || NO_EXTENDED)
    .addField(language('basic/help:MAIN_USAGE'), USAGE, true)
    .addField(language('basic/help:MAIN_ALIASES'), ALIASES, true)
    .addField(language('basic/help:MORE'), Constants.general.gamerServerInvite)

  return message.channel.createMessage({ embed: embed.code })
})
