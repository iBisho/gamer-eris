import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'
import { GamerTag } from '../lib/types/gamer'

export default new Command([`settag`, `settags`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  let guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null
  if (!guildSettings) guildSettings = new Gamer.database.models.guild({ id: message.channel.guild.id }) as GuildSettings

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return
  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const [type, name] = args
  if (!type) return helpCommand.execute(message, [`settags`], context)

  // First check the menus that would not need `idea` or `bug`
  switch (type.toLowerCase()) {
    case `mail`:
      if (!name) return helpCommand.execute(message, [`settags`], context)
      const tagToEdit = (await Gamer.database.models.tag.findOne({
        name: name.toLowerCase(),
        guildID: message.channel.guild.id
      })) as GamerTag | null
      if (!tagToEdit) return message.channel.createMessage(language(`settings/settags:INVALID_NAME`))

      tagToEdit.mailOnly = !tagToEdit.mailOnly
      tagToEdit.save()
      return message.channel.createMessage(language(`settings/settags:TOGGLED_MAIL`, { name }))
    case `channel`:
      if (!message.channelMentions.length) return helpCommand.execute(message, [`settags`], context)

      for (const channelID of message.channelMentions) {
        if (guildSettings.tags.disabledChannels.includes(channelID))
          guildSettings.tags.disabledChannels = guildSettings.tags.disabledChannels.filter(id => id !== channelID)
        else guildSettings.tags.disabledChannels.push(channelID)
      }

      guildSettings.save()
      return message.channel.createMessage(language(`settings/settags:UPDATED_CHANNELS`))
  }

  return helpCommand.execute(message, [`setfeedback`], context)
})
