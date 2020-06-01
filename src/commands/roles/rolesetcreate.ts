import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`rolesetcreate`, `rsc`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.member.guild.id
  })
  const language = Gamer.getLanguage(message.member.guild.id)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name, ...roleIDsOrNames] = args
  if (!name || (!message.roleMentions.length && !roleIDsOrNames.length))
    return helpCommand.execute(message, [`rolesetcreate`], { ...context, commandName: 'help' })

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
    guildID: message.member.guild.id
  })
  if (exists) return message.channel.createMessage(language(`roles/rolesetcreate:EXISTS`, { name }))

  // Create a roleset
  await Gamer.database.models.roleset.create({
    name: name.toLowerCase(),
    roleIDs,
    guildID: message.member.guild.id
  })

  return message.channel.createMessage(language(`roles/rolesetcreate:CREATED`))
})
