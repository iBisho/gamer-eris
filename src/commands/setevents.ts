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
  }

  return helpCommand.execute(message, [`setevents`], context)
})
