import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`bots`, async (message, _args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) 
  return message.channel.createMessage(language('common:NOT_MOD_OR_ADMIN'))

  if (!Gamer.vipGuildIDs.has(message.member.guild.id))
    return message.channel.createMessage(language`vip/analyze:NEED_VIP`)

  if (!Gamer.allMembersFetchedGuildIDs.has(message.member.guild.id)) {
    await message.member.guild.fetchAllMembers()
    Gamer.allMembersFetchedGuildIDs.add(message.member.guild.id)
  }

  const text = message.member.guild.members
    .filter(m => m.user.bot)
    .map((member, index) => `**${index + 1}.** ${member.mention} (${member.id})`)
    .join('\n')
    .substring(0, 2000)

  return Gamer.helpers.discord.embedResponse(message, text)
})
