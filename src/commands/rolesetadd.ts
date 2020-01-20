import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`rolesetadd`, `rsa`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  const language = Gamer.getLanguage(message.guildID)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name, ...roleIDsOrNames] = args
  if (!name || (!message.roleMentions.length && !roleIDsOrNames.length))
    return helpCommand.process(message, [`rolesetadd`], context)

  const roleIDs = message.roleMentions
  for (const roleIDOrName of roleIDsOrNames) {
    const role =
      message.member.guild.roles.get(roleIDOrName) ||
      message.member.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    if (!role || roleIDs.includes(role.id)) continue
    roleIDs.push(role.id)
  }

  const roleset = await Gamer.database.models.roleset.findOne({
    guildID: message.guildID,
    name: name.toLowerCase()
  })

  if (!roleset) return message.channel.createMessage(language(`roles/rolesetadd:INVALID_NAME`, { name }))

  const uniqueRoleIDs = new Set([...roleset.roleIDs, ...roleIDs])
  roleset.roleIDs = [...uniqueRoleIDs]
  roleset.save()

  return message.channel.createMessage(language(`roles/rolesetadd:ADDED`))
})
