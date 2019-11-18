import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, TextChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { GamerEmoji } from '../lib/types/database'

export default new Command(`embededit`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const [channelID] = message.channelMentions
  const channel = channelID ? message.channel.guild.channels.get(channelID) : message.channel
  if (!channel || !(channel instanceof TextChannel)) return

  const [messageID] = args
  if (!messageID) return
  // Remove the id so only thing left is the embed code
  args.shift()

  const messageToUse = channel.messages.get(messageID) || (await Gamer.getMessage(channel.id, messageID))
  if (!messageToUse || messageToUse.author.id !== Gamer.user.id) return

  const [embed] = messageToUse.embeds
  if (!embed) return

  const settings = (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null
  const language = Gamer.i18n.get(settings ? settings.language : `en-US`)
  if (!language) return
  // If the user does not have a modrole or admin role quit out
  if (
    !settings ||
    Gamer.helpers.discord.isModerator(message, settings.staff.modRoleIDs) ||
    (settings.staff.adminRoleID && Gamer.helpers.discord.isAdmin(message, settings.staff.adminRoleID))
  )
    return

  const emojis = (await Gamer.database.models.emoji.find()) as GamerEmoji[]

  const transformed = Gamer.helpers.transform.variables(
    args.join(' '),
    message.mentions[0],
    message.channel.guild,
    message.author,
    emojis
  )

  const embedCode = JSON.parse(transformed)
  if (typeof embedCode.image === 'string') embedCode.image = { url: embedCode.image }
  messageToUse.edit({ content: embedCode.plaintext, embed: embedCode }).catch(error => {
    const embed = new GamerEmbed()
      .setAuthor(message.author.username, message.author.avatarURL)
      .setTitle(language(`embedding/embed:BAD_EMBED`))
      .setDescription(['```js', error, '```'].join('\n'))
    message.channel.createMessage({ embed: embed.code })
  })
})
