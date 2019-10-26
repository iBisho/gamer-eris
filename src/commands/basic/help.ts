import { Command } from 'yuuko'
import GamerEmbed from '../../lib/structures/GamerEmbed'
import { PrivateChannel } from 'eris'
import GamerClient from '../../lib/structures/GamerClient'
import { GuildSettings } from '../../lib/types/settings'
import Constants from '../../constants/index'

export default new Command([`help`, `h`, `commands`, `cmds`], async (message, args, context) => {
  // Gamers goal is to increase activity in a server not in a DM.
  if (message.channel instanceof PrivateChannel)
    return message.channel.createMessage(`Please use this command on a guild. Thank you!`)

  const Gamer = context.client as GamerClient
  const settings = (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings

  const language = Gamer.i18n.get(settings ? settings.language : 'en-US')
  if (!language) return null

  const prefix = settings.prefix || '.'
  const FEATURES = language(`basic/help:FEATURES`, { prefix })
  const VIPFEATURES = language(`basic/help:VIPFEATURES`, { prefix })
  const CHECKWIKI = language(`basic/help:CHECK_WIKI`)
  const LINKSVALUE = language(`basic/help:LINKS_VALUE`, { patreon: Constants.emojis.patreon })

  // Create the main help embed
  const embed = new GamerEmbed()
    .setColor(`RANDOM`)
    .setAuthor(message.author.username, message.author.avatarURL)
    .addField(language(`basic/help:MOST_USED`), FEATURES)
    .addField(language(`basic/help:SEE_ALL`), CHECKWIKI)
    .addField(language(`basic/help:LINKS`), LINKSVALUE)

  if (settings.vip.isVIP) embed.addField(language(`basic/help:VIP_FEATURES`), VIPFEATURES)

  if (!args.length) return message.channel.createMessage({ embed: embed.code })

  const [commandName] = args
  // TODO:Send descriptions
  if (commandName === `all`)
    return message.channel.createMessage(`\`${Gamer.commands.map(cmd => cmd.name).join('` `')}\``)

  return message.channel.createMessage({ embed: embed.code })
})
