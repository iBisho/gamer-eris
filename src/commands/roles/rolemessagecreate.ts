import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { parseRole } from '../../lib/utils/arguments'

export default new Command([`rolemessagecreate`, `rmc`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)
  // If the user is not an admin cancel out
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [type, channelID, roleID, ...text] = args
  if (!type || !channelID || !roleID || !text.length)
    return helpCommand.execute(message, [`rolemessagecreate`], { ...context, commandName: 'help' })

  if (!['add', 'remove'].includes(type.toLowerCase()))
    return helpCommand.execute(message, [`rolemessagecreate`], { ...context, commandName: 'help' })

  const roleAdded = ['add'].includes(type.toLowerCase())
  const channel =
    message.member.guild.channels.get(channelID) || message.member.guild.channels.get(message.channelMentions[0]!)
  if (!channel) return message.channel.createMessage(language(`roles/rolemessagecreate:INVALID_CHANNEL`))

  const role = parseRole(message, roleID)
  if (!role) return message.channel.createMessage(language(`roles/rolemessagecreate:INVALID_ROLE`))

  const content = text.join(' ')

  const rolemessage = await Gamer.database.models.roleMessages.findOne({
    roleID: role.id,
    roleAdded
  })

  if (!rolemessage) {
    await Gamer.database.models.roleMessages.create({
      roleID: role.id,
      roleAdded,
      channelID: channel.id,
      message: content,
      guildID: channel.guild.id
    })

    return message.channel.createMessage(language(`roles/rolemessagecreate:CREATED`))
  }

  Gamer.database.models.roleMessages.updateOne({ roleID: role.id, roleAdded }, { message: content }).exec()
  return message.channel.createMessage(language(`roles/rolemessagecreate:UPDATED`))
})
