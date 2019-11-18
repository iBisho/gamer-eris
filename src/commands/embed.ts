import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import { GamerEmoji } from '../lib/types/database'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command(`embed`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return
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
  message.channel.createMessage({ content: embedCode.plaintext, embed: embedCode }).catch(error => {
    const embed = new GamerEmbed()
      .setAuthor(message.author.username, message.author.avatarURL)
      .setTitle(language(`embedding/embed:BAD_EMBED`))
      .setDescription(['```js', error, '```'].join('\n'))
    message.channel.createMessage({ embed: embed.code })
  })
})
