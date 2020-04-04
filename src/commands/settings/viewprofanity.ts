import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`viewprofanity`, `viewwords`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })
  // If no custom settings they wont have any words
  if (!guildSettings)
    return message.channel.createMessage(
      language('settings/viewprofanity:NONE_FOUND', { mention: message.author.mention })
    )

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const [type] = args

  const words =
    type?.toLowerCase() === 'strict'
      ? guildSettings.moderation.filters.profanity.strictWords
      : guildSettings.moderation.filters.profanity.words

  if (!words.length)
    return message.channel.createMessage(
      language('settings/viewprofanity:NONE_FOUND', { mention: message.author.mention })
    )

  let response = ``
  for (const word of words) {
    const text = `${word}\n`
    if (response.length + text.length >= 2000) {
      Gamer.helpers.discord.embedResponse(message, response)
      response = ``
    }
    response += text
  }

  return Gamer.helpers.discord.embedResponse(message, response)
})
