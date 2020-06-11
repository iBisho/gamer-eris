import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`xp`, async (message, args, context) => {
  if (!message.member || !message.guildID) return

  const Gamer = context.client as GamerClient
  // if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return
  if (!args.length) return

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const language = Gamer.getLanguage(message.guildID)
  const [type, number, ...idOrRoleName] = args
  const isAdding = type.toLowerCase() === `add`
  const amount = parseInt(number, 10)
  if (!amount) return

  const idOrName = idOrRoleName.join(' ').toLowerCase()
  const memberID = message.mentions.length ? message.mentions[0].id : idOrName

  // The user is trying to update just 1 member
  const member = (await Gamer.helpers.discord.fetchMember(message.member.guild, memberID)) || message.member
  if (isAdding) Gamer.helpers.levels.addLocalXP(member, amount, true)
  else if (type.toLowerCase() === `remove`) Gamer.helpers.levels.removeXP(member, amount)
  // Cancel out if not add or remove
  else return
  // Respond telling the user how much they gained
  return message.channel.createMessage(
    language(isAdding ? `leveling/xp:ADDED` : `leveling/xp:REMOVED`, {
      mention: member.username,
      amount
    })
  )
})
