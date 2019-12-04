import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command(`embed`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!args.length) return helpCommand.execute(message, [`embed`], context)

  const settings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })

  // If the user does not have a modrole or admin role quit out
  if (
    !settings ||
    !(
      Gamer.helpers.discord.isModerator(message, settings.staff.modRoleIDs) ||
      Gamer.helpers.discord.isAdmin(message, settings.staff.adminRoleID)
    )
  )
    return

  const emojis = await Gamer.database.models.emoji.find()

  const [firstWord] = args
  const user = message.mentions.length ? message.mentions[0] : Gamer.users.get(firstWord)
  if (user) args.shift()

  const transformed = Gamer.helpers.transform.variables(
    args.join(' '),
    user,
    message.channel.guild,
    message.author,
    emojis
  )

  try {
    const embedCode = JSON.parse(transformed)
    if (typeof embedCode.image === 'string') embedCode.image = { url: embedCode.image }
    if (typeof embedCode.thumbnail === 'string') embedCode.thumbnail = { url: embedCode.thumbnail }
    if (embedCode.color === 'RANDOM') embedCode.color = Math.floor(Math.random() * (0xffffff + 1))
    if (embedCode.timestamp) embedCode.timestamp = new Date().toISOString()
    return message.channel.createMessage({ content: embedCode.plaintext, embed: embedCode })
  } catch (error) {
    const embed = new GamerEmbed()
      .setAuthor(message.author.username, message.author.avatarURL)
      .setTitle(language(`embedding/embed:BAD_EMBED`))
      .setDescription(['```js', error, '```'].join('\n'))
    return message.channel.createMessage({ embed: embed.code })
  }
})
