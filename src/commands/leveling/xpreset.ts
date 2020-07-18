import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { parseRole } from '../../lib/utils/arguments'

export default new Command(`xpreset`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const guildSettings = await Gamer.database.models.guild.findOne({ guilID: message.guildID })

  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const language = Gamer.getLanguage(message.guildID)

  // Now we need to reset the entire guilds information
  await message.channel.createMessage(language(`leveling/xpreset:PATIENCE`))
  const [id] = args
  const [user] = message.mentions
  const userID = user?.id || id
  const member = userID ? await Gamer.helpers.discord.fetchMember(message.member.guild, userID) : undefined

  // If a member was passed we want to reset this members XP only
  if (member) {
    const memberSettings = await Gamer.database.models.member.findOne({
      memberID: member.id,
      guildID: member.guild.id
    })

    if (!memberSettings) return

    Gamer.database.models.member
      .findOneAndUpdate(
        { memberID: member.id, guildID: member.guild.id },
        { leveling: { ...memberSettings.leveling, xp: 0, level: 0 } }
      )
      .exec()

    return message.channel.createMessage(language(`leveling/xpreset:MEMBER`, { member: member.mention }))
  }

  // Find all members from this guild so we can loop those with edited settings only
  const memberSettings = await Gamer.database.models.member.find({ guildID: message.guildID })
  const role = id ? parseRole(message, id) : undefined
  // For every member reset his xp and level
  for (const settings of memberSettings) {
    if (role) {
      const member = await Gamer.helpers.discord
        .fetchMember(message.member.guild, settings.memberID)
        .catch(() => undefined)
      if (!member) continue
      // If user is a bot OR a role is provided and this member doesnt have it skip
      if (role && !member.roles.includes(role.id)) continue
    }

    Gamer.database.models.member
      .findOneAndUpdate(
        { memberID: settings.memberID, guildID: settings.guildID },
        { leveling: { ...settings.leveling, xp: 0, level: 0 } }
      )
      .exec()
  }

  return message.channel.createMessage(
    language(role ? `leveling/xpreset:ROLE` : `leveling/xpreset:ALL`, { role: role && role.name })
  )
})
