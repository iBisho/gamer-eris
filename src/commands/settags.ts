import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GamerTag } from '../lib/types/gamer'

export default new Command([`settag`, `settags`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings =
    (await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })) || (await Gamer.database.models.guild.create({ id: message.channel.guild.id }))

  const language = Gamer.getLanguage(message.channel.guild.id)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const [type, name] = args
  if (!type) return helpCommand.process(message, [`settags`], context)

  // First check the menus that would not need `idea` or `bug`
  switch (type.toLowerCase()) {
    case `mail`:
      if (!name) return helpCommand.process(message, [`settags`], context)
      const tagToEdit = (await Gamer.database.models.tag.findOne({
        name: name.toLowerCase(),
        guildID: message.channel.guild.id
      })) as GamerTag | null
      if (!tagToEdit) return message.channel.createMessage(language(`settings/settags:INVALID_NAME`))

      tagToEdit.mailOnly = !tagToEdit.mailOnly
      tagToEdit.save()
      return message.channel.createMessage(language(`settings/settags:TOGGLED_MAIL`, { name }))
    case `channel`:
      if (!message.channelMentions.length) return helpCommand.process(message, [`settags`], context)

      for (const channelID of message.channelMentions) {
        if (guildSettings.tags.disabledChannels.includes(channelID))
          guildSettings.tags.disabledChannels = guildSettings.tags.disabledChannels.filter(id => id !== channelID)
        else guildSettings.tags.disabledChannels.push(channelID)
      }

      guildSettings.save()
      return message.channel.createMessage(language(`settings/settags:UPDATED_CHANNELS`))
  }

  return helpCommand.process(message, [`setfeedback`], context)
})
