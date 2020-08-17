import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command(`setvoicelogs`, async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const settings = await upsertGuild(message.guildID)
  const language = Gamer.getLanguage(message.guildID)

  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, settings ? settings.staff.adminRoleID : undefined)) return

  const [type] = args
  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  if (!type) return helpCommand.execute(message, [`setvoicelogs`], { ...context, commandName: 'help' })

  if (!message.channelMentions || !message.channelMentions.length)
    return message.channel.createMessage(language(`settings/setvoicelogs:NEED_CHANNEL`))

  const [channelID] = message.channelMentions
  settings.moderation.logs.serverlogs.voice.channelID = channelID
  settings.save()

  return message.channel.createMessage(language(`settings/setvoicelogs:CHANNEL_SET`, { channel: `<#${channelID}>` }))
})
