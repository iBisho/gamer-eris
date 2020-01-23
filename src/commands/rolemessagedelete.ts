import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`rolemessagedelete`, `rmd`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)
  // If the user is not an admin cancel out
  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const roleIDOrName = message.roleMentions[0] || args.join(' ')
  if (!roleIDOrName) return message.channel.createMessage(language(`roles/rolemessagedelete:NEED_ROLE`))

  const role =
    message.member.guild.roles.get(roleIDOrName) ||
    message.member.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
  if (!role) return message.channel.createMessage(language(`roles/rolemessagedelete:INVALID_ROLE`))

  const rolemessage = await Gamer.database.models.roleMessages.findOne({ roleID: role.id })
  if (!rolemessage) return message.channel.createMessage(language(`roles/rolemessagedelete:NONE_FOUND`))

  await Gamer.database.models.roleMessages.deleteOne({ _id: rolemessage._id })
  return message.channel.createMessage(language(`roles/rolemessagedelete:DELETED`))
})
