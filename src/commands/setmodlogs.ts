import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'

export default new Command(`setmodlogs`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  let settings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })
  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return
  if (!settings) settings = await Gamer.database.models.guild.create({ id: message.channel.guild.id })

  const [type] = args
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!type) return helpCommand.execute(message, [`setmodlogs`], context)

  switch (type.toLowerCase()) {
    case `enable`:
      if (settings.moderation.logs.modlogsChannelID)
        return message.channel.createMessage(language(`settings/setmodlogs:ALREADY_ENABLED`))
      settings.moderation.logs.modlogsChannelID = message.channel.id
      settings.save()
      return message.channel.createMessage(language(`settings/setmodlogs:ENABLED`))
    case `disable`:
      if (!settings.moderation.logs.modlogsChannelID)
        return message.channel.createMessage(language(`settings/setmodlogs:ALREADY_DISABLED`))
      settings.moderation.logs.modlogsChannelID = undefined
      settings.save()
      return message.channel.createMessage(language(`settings/setmodlogs:DISABLED`))
    default:
      if (!message.channelMentions || !message.channelMentions.length)
        return message.channel.createMessage(language(`settings/setmodlogs:NEED_CHANNEL`))

      const [channelID] = message.channelMentions
      settings.moderation.logs.modlogsChannelID = channelID
      settings.save()

      return message.channel.createMessage(language(`settings/setmodlogs:CHANNEL_SET`, { channel: `<#${channelID}>` }))
  }

  return
})
