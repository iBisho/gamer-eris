import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`listallroles`, `listroles`] , async (message, _args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  // If they are using default settings, they won't be vip server
  if (!Gamer.vipGuildIDs.has(message.member.guild.id))
  return message.channel.createMessage(language`vip/listallroles:NEED_VIP`)

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) 
  return message.channel.createMessage(language('common:NOT_MOD_OR_ADMIN'))

  const listroles = [...message.member.guild.roles.values()]
  const allRoles = listroles.sort((a, b) => b.position - a.position)

  let response = ``
  for (const roles of allRoles) {
    const allRoles = `${roles.mention} -> **${roles.id}**\n`
    if (response.length + allRoles.length >= 2000) {
      Gamer.helpers.discord.embedResponse(message, response)
      response = ``
    }
    response += allRoles
  }

  return Gamer.helpers.discord.embedResponse(message, response)
})