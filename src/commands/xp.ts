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

  if (!Gamer.helpers.discord.isAdmin(message, guildSettings ? guildSettings.staff.adminRoleID : undefined)) return

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
  if (!language) return

  const [type, number, userID] = args
  const isAdding = type.toLowerCase() === `add`
  const amount = parseInt(number, 10)
  const memberID = message.mentions.length ? message.mentions[0].id : userID

  const member = message.channel.guild.members.get(memberID)
  if (!member) return

  if (isAdding) Gamer.helpers.levels.addLocalXP(message.member, amount, true, language(`leveling/xp:ROLE_ADD_REASON`))
  else Gamer.helpers.levels.removeXP(message.member, language(`leveling/xp:ROLE_REMOVE_REASON`), amount)
  // Respond telling the user how much they gained
  return message.channel.createMessage(
    language(isAdding ? `leveling/xp:ADDED` : `leveling/xp:REMOVED`, {
      mention: message.author.mention,
      amount
    })
  )
})
