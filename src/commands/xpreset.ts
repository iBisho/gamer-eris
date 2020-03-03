import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`xpreset`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const language = Gamer.getLanguage(message.guildID)

  // Now we need to reset the entire guilds information
  await message.channel.createMessage(language(`leveling/xpreset:PATIENCE`))
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

    memberSettings.leveling.xp = 0
    memberSettings.leveling.level = 0
    memberSettings.save()

    return message.channel.createMessage(language(`leveling/xpreset:MEMBER`, { member: member.mention }))
  }

  // Find all members from this guild so we can loop those with edited settings only
  const memberSettings = await Gamer.database.models.member.find({
    guildID: message.guildID
  })
  // For every member reset his xp and level
  for (const settings of memberSettings) {
    // Since we already fetched members above we can just get() here
    const member = await Gamer.helpers.discord
      .fetchMember(message.member.guild, settings.memberID)
      .catch(() => undefined)
    if (!member) continue
    // If user is a bot OR a role is provided and this member doesnt have it skip
    if (member.user.bot || (role && !member.roles.includes(role.id))) continue

    settings.leveling.xp = 0
    settings.leveling.level = 0
    settings.save()
  }

  return message.channel.createMessage(
    language(role ? `leveling/xpreset:ROLE` : `leveling/xpreset:ALL`, { role: role && role.name })
  )
})
