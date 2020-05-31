import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`xpresetvoice`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const language = Gamer.getLanguage(message.guildID)

  // Now we need to reset the entire guilds information
  await message.channel.createMessage(language(`leveling/xpresetvoice:PATIENCE`))
  const [id] = args

  const [user] = message.mentions
  const member =
    user || id ? await Gamer.helpers.discord.fetchMember(message.member.guild, user ? user.id : id) : undefined
  const role = id
    ? message.member.guild.roles.get(id) ||
      // Incase the user provided a role name and not an id
      message.member.guild.roles.find(r => r.name.toLowerCase() === id.toLowerCase())
    : undefined

  // If a member was passed we want to reset this members XP only
  if (member) {
    const memberSettings = await Gamer.database.models.member.findOne({
      id: `${message.guildID}.${message.author.id}`
    })

    if (!memberSettings) return

    memberSettings.leveling.voicexp = 0
    memberSettings.leveling.voicelevel = 0
    memberSettings.save()

    return message.channel.createMessage(language(`leveling/xpresetvoice:MEMBER`, { member: member.mention }))
  }

  if (!role) {
    Gamer.database.models.member
      .updateMany({ guildID: message.guildID, 'leveling.voicexp': { $gt: 0 } }, { voicexp: 0, voicelevel: 0 })
      .exec()
  } else {
    // Find all members from this guild so we can loop those with edited settings only
    const memberSettings = await Gamer.database.models.member.find({
      'leveling.voicexp': { $gt: 0 },
      guildID: message.guildID
    })

    // For every member reset his xp and level
    for (const settings of memberSettings) {
      if (role) {
        const member = await Gamer.helpers.discord
          .fetchMember(message.member.guild, settings.memberID)
          .catch(() => undefined)
        if (!member) continue
        // If user is a bot OR a role is provided and this member doesnt have it skip
        if (!member.roles.includes(role.id)) continue
      }
      if (!settings.leveling.voicexp || settings.leveling.voicexp < 1) continue

      settings.leveling.voicexp = 0
      settings.leveling.voicelevel = 0
      settings.save()
    }
  }

  return message.channel.createMessage(
    language(role ? `leveling/xpresetvoice:ROLE` : `leveling/xpresetvoice:ALL`, { role: role && role.name })
  )
})
