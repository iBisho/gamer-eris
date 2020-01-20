import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`rolesets`, async (message, _args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })

  if (
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID) &&
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs)
  )
    return

  const rolesets = await Gamer.database.models.roleset.find({ guildID: message.guildID })
  if (!rolesets.length) return message.channel.createMessage(language(`roles/rolesets:NONE`))

  let response = ``
  const guildRoles = message.member.guild.roles

  for (const roleset of rolesets) {
    if (response.length === 2000) break

    const roles = roleset.roleIDs.map(id => {
      const role = guildRoles.get(id)
      if (!role) return id
      return role.name
    })

    const text = `**${roleset.name}**: ${roles.join(', ')}\n`
    if (response.length + text.length >= 2000) break
    response += text
  }

  return message.channel.createMessage(response)
})
