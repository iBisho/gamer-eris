import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`rolesets`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })

  if (
    !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID) &&
    !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs)
  )
    return

  const rolesets = await Gamer.database.models.roleset.find({ guildID: message.channel.guild.id })
  if (!rolesets.length) return message.channel.createMessage(language(`roles/rolesets:NONE`))

  let response = ``
  const guildRoles = message.channel.guild.roles

  for (const roleset of rolesets) {
    if (response.length === 2000) break

    const roles = roleset.roleIDs.map(id => {
      const role = guildRoles.get(id)
      if (!role) return id
      return role.name
    })

    const text = `**${roleset.name}**: ${roles.join(' ')}\n`
    if (response.length + text.length >= 2000) break
    response += text
  }

  return message.channel.createMessage(response)
})
