import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { upsertGuild } from '../../database/mongoHandler'

export default new Command(`setevents`, async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = await upsertGuild(message.member.guild.id)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [action] = args
  if (!action) return helpCommand.execute(message, [`setevents`], { ...context, commandName: 'help' })
  args.shift()
  // The remaining text should be related to the role
  const roleIDOrName = args.join(' ').toLowerCase()

  switch (action.toLowerCase()) {
    case 'channel':
      if (!message.channelMentions.length)
        return message.channel.createMessage(language(`settings/setevents:NEED_CHANNEL`))

      const channelID = message.channelMentions[0]
      guildSettings.eventsAdvertiseChannelID = channelID
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setevents:SET_ADCHANNEL`, { channel: `<#${channelID}>` }))
    case 'removechannel':
      guildSettings.eventsAdvertiseChannelID = undefined
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setevents:RESET_ADCHANNEL`))
    case 'role':
      const role = message.roleMentions.length
        ? message.member.guild.roles.get(message.roleMentions[0])
        : message.member.guild.roles.get(roleIDOrName) ||
          message.member.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName)
      if (!role) return message.channel.createMessage(language(`settings/setevents:NEED_ROLE`))

      guildSettings.roleIDs.eventsCreate = role.id
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setevents:SET_ROLE`))
    case 'removerole':
      guildSettings.roleIDs.eventsCreate = undefined
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setevents:RESET_ROLE`))
  }

  return helpCommand.execute(message, [`setevents`], { ...context, commandName: 'help' })
})
