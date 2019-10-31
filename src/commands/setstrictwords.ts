import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'

export default new Command(`setstrictwords`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  let settings = (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null
  const language = Gamer.i18n.get(settings ? settings.language : 'en-US')
  if (!language) return

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return

  const [type] = args
  // Remove the type and the leftover should be all words
  args.shift()

  if (!args.length) return message.channel.createMessage(`settings/setstrictwords:NO_WORDS`)

  const uniqueWords = new Set(args)
  const words = [...uniqueWords]
  if (!settings) settings = new Gamer.database.models.guild({ id: message.channel.guild.id }) as GuildSettings

  switch (type.toLowerCase()) {
    case `add`:
      settings.moderation.filters.profanity.strictWords.push(...words)
      settings.save()
      return message.channel.createMessage(language(`settings/setstrictwords:ADDED`))
    case `remove`:
      settings.moderation.filters.profanity.strictWords = settings.moderation.filters.profanity.strictWords.filter(
        word => !words.includes(word)
      )
      settings.save()
      return message.channel.createMessage(language(`settings/setstrictwords:REMOVED`))
  }

  return
})
