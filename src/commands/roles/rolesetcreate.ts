import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`rolesetcreate`, `rsc`], async (message, args, context) => {
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
    return helpCommand.process(message, [`rolesetcreate`], context)

  const roleIDs: string[] = [...message.roleMentions]
  for (const roleIDOrName of roleIDsOrNames) {
    const role =
      message.member.guild.roles.get(roleIDOrName) ||
      message.member.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    if (!role) continue
    roleIDs.push(role.id)
  }

  const exists = await Gamer.database.models.roleset.findOne({
    name: name.toLowerCase(),
    guildID: message.guildID
  })
  if (exists) return message.channel.createMessage(language(`roles/rolesetcreate:EXISTS`, { name }))

  // Create a roleset
  await Gamer.database.models.roleset.create({
    name: name.toLowerCase(),
    roleIDs,
    guildID: message.guildID
  })

  return message.channel.createMessage(language(`roles/rolesetcreate:CREATED`))
})
