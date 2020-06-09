import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command(`setcapital`, async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const settings = await upsertGuild(message.guildID)
  const language = Gamer.getLanguage(message.guildID)

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return

  const [type] = args
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!type) return helpCommand.execute(message, [`setcapital`], { ...context, commandName: 'help' })

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
      return message.channel.createMessage(language(`settings/setcapital:ENABLED_DEFAULT`))
    default:
      const amount = parseInt(type, 10)
      if (!amount || amount > 100 || amount < 40)
        return message.channel.createMessage(language(`settings/setcapital:INVALID_AMOUNT`))
      settings.moderation.filters.capital = amount
      settings.save()
      return message.channel.createMessage(language(`settings/setcapital:ENABLED`, { amount }))
  }
})
