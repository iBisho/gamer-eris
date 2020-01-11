import { Command } from 'yuuko'
import { PrivateChannel, CategoryChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`label`, async (message, args, context) => {
  const Gamer = context.client as GamerClient

  const content = args.join(' ')
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel)
    return Gamer.helpers.mail.handleDM(message, content)

  const language = Gamer.getLanguage(message.channel.guild.id)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })
  if (!guildSettings) return

  if (
    !Gamer.helpers.discord.isModerator(message, guildSettings.staff.modRoleIDs) &&
    !Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)
  )
    return

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const [type, name, categoryID] = args
  if (!type) return helpCommand.process(message, [`label`], context)

  switch (type.toLowerCase()) {
    case `list`:
      const labels = await Gamer.database.models.label.find({ guildID: message.channel.guild.id })
      return message.channel.createMessage(
        labels.length ? labels.map(label => label.name).join('\n') : language(`mails/label:NO_LABELS`)
      )
    case `delete`:
      if (!name) return helpCommand.process(message, [`label`], context)
      const labelToDelete = await Gamer.database.models.label.find({
        name,
        guildID: message.channel.guild.id
      })
      if (!labelToDelete)
        return Gamer.helpers.discord.embedResponse(message, language(`mails/label:INVALID_NAME`, { name }))

      await Gamer.database.models.label.deleteOne({ name, guildID: message.channel.guild.id })
      return Gamer.helpers.discord.embedResponse(message, language(`mails/label:DELETED`, { name }))
    case `create`:
      if (!name || !categoryID) return helpCommand.process(message, [`label`], context)
      const category = message.channel.guild.channels.get(categoryID)
      if (!category || !(category instanceof CategoryChannel)) return helpCommand.process(message, [`label`], context)

      const labelExists = await Gamer.database.models.label.findOne({
        name,
        guildID: message.channel.guild.id
      })

      if (labelExists)
        return Gamer.helpers.discord.embedResponse(message, language(`mails/label:LABEL_EXISTS`, { name }))

      await Gamer.database.models.label.create({
        authorID: message.author.id,
        categoryID: category.id,
        guildID: message.channel.guild.id,
        name
      })

      return Gamer.helpers.discord.embedResponse(message, language(`mails/label:CREATED`, { name }))
    case `set`:
      if (!name) return helpCommand.process(message, [`label`], context)
      const labelToSet = await Gamer.database.models.label.findOne({
        name,
        guildID: message.channel.guild.id
      })
      if (!labelToSet)
        return Gamer.helpers.discord.embedResponse(message, language(`mails/label:INVALID_NAME`, { name }))

      const mail = await Gamer.database.models.mail.findOne({
        id: message.channel.id
      })

      if (!mail) return message.channel.createMessage(language(`mails/label:NOT_MAIL_CHANNEL`))

      const botMember = message.channel.guild.members.get(Gamer.user.id)
      if (!botMember || !botMember.permission.has('manageChannels'))
        return message.channel.createMessage(language(`mails/label:NEED_MANAGE_CHANNELS`))

      return message.channel.edit({ parentID: labelToSet.categoryID })
  }

  return helpCommand.process(message, [`label`], context)
})
