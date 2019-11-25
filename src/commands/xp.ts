import { Command } from 'yuuko'
import { GuildSettings } from '../lib/types/settings'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`xp`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || !message.member) return
  if (!args.length) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const [type, number, userID] = args
  const isAdding = type.toLowerCase() === `add`
  const amount = parseInt(number, 10)
  if (!amount) return

  const memberID = message.mentions.length ? message.mentions[0].id : userID

  const member = message.channel.guild.members.get(memberID)
  if (!member) return

  if (isAdding) Gamer.helpers.levels.addLocalXP(message.member, amount, true)
  else if (type.toLowerCase() === `remove`) Gamer.helpers.levels.removeXP(message.member, amount)
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
