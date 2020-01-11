import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`rolesetcreate`, `rsc`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  const language = Gamer.getLanguage(message.channel.guild.id)

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name, ...roleIDsOrNames] = args
  if (!name || (!message.roleMentions.length && !roleIDsOrNames.length))
    return helpCommand.process(message, [`rolesetcreate`], context)

  const roleIDs: string[] = [...message.roleMentions]
  for (const roleIDOrName of roleIDsOrNames) {
    const role =
      message.channel.guild.roles.get(roleIDOrName) ||
      message.channel.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    if (!role) continue
    roleIDs.push(role.id)
  }

  const exists = await Gamer.database.models.roleset.findOne({
    name: name.toLowerCase(),
    guildID: message.channel.guild.id
  })
  if (exists) return message.channel.createMessage(language(`roles/rolesetcreate:EXISTS`, { name }))

  // Create a roleset
  await Gamer.database.models.roleset.create({
    name: name.toLowerCase(),
    roleIDs,
    guildID: message.channel.guild.id
  })

  return message.channel.createMessage(language(`roles/rolesetcreate:CREATED`))
})
