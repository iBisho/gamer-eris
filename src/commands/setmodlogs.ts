import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'

export default new Command(`setmodlogs`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  let settings = (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null
  const language = Gamer.i18n.get(settings ? settings.language : 'en-US')
  if (!language) return

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return
  if (!settings) settings = new Gamer.database.models.guild({ id: message.channel.guild.id }) as GuildSettings

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
