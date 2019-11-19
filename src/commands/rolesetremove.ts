import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'
import { GamerRoleset } from '../lib/types/gamer'

export default new Command([`rolesetremove`, `rsr`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
  if (!language) return
  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [name, ...roleIDsOrNames] = args
  if (!name || (!message.roleMentions.length && !roleIDsOrNames.length))
    return helpCommand.execute(message, [`rolesetadd`], context)

  const roleIDs: string[] = [...message.roleMentions]
  for (const roleIDOrName of roleIDsOrNames) {
    const role =
      message.channel.guild.roles.get(roleIDOrName) ||
      message.channel.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    if (!role) continue
    roleIDs.push(role.id)
  }

  const roleset = (await Gamer.database.models.roleset.findOne({
    guildID: message.channel.guild.id,
    name
  })) as GamerRoleset | null

  if (!roleset) return message.channel.createMessage(language(`roles/rolesetadd:INVALID_NAME`))

  roleset.roleIDs = roleset.roleIDs.filter(id => !roleIDs.includes(id))
  roleset.save()

  return message.channel.createMessage(language(`roles/rolesetremove:REMOVED`))
})
