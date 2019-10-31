import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'

export default new Command(`setcapital`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  let settings = (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null
  const language = Gamer.i18n.get(settings ? settings.language : 'en-US')
  if (!language) return

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return

  const [type, number] = args

  if (!settings) settings = new Gamer.database.models.guild({ id: message.channel.guild.id }) as GuildSettings

  switch (type.toLowerCase()) {
    case `disable`:
      settings.moderation.filters.capital = 100
      settings.save()
      return message.channel.createMessage(language(`settings/setcapital:DISABLED`))
    case `enable`:
      if (settings.moderation.filters.capital < 100)
        return message.channel.createMessage(language(`settings/setcapital:ALREADY_ENABLED`))
      settings.moderation.filters.capital = 50
      settings.save()
      return message.channel.createMessage(language(`settings/setcapital:ENABLED`))
    default:
      const amount = parseInt(number, 10)
      if (!amount || amount > 100 || amount < 40)
        return message.channel.createMessage(language(`settings/setcapital:INVALID_AMOUNT`))
      settings.moderation.filters.capital = amount
      settings.save()
      return message.channel.createMessage(language(`settings/setcapital:ENABLED`, { amount }))
  }
  return
})
