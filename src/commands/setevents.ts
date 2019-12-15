import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`setevents`, async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return
  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  let guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return
  if (!guildSettings) guildSettings = await Gamer.database.models.guild.create({ id: message.channel.guild.id })

  const [action] = args
  if (!action) return helpCommand.execute(message, [`setevents`], context)
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
        ? message.channel.guild.roles.get(message.roleMentions[0])
        : message.channel.guild.roles.get(roleIDOrName) ||
          message.channel.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName)
      if (!role) return message.channel.createMessage(language(`settings/setevents:NEED_ROLE`))

      guildSettings.roleIDs.eventsCreate = role.id
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setevents:SET_ROLE`))
    case 'removerole':
      guildSettings.roleIDs.eventsCreate = undefined
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setevents:RESET_ROLE`))
  }

  return helpCommand.execute(message, [`setevents`], context)
})
