import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`xpresetvoice`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  // Now we need to reset the entire guilds information
  await message.channel.createMessage(language(`leveling/xpresetvoice:PATIENCE`))
  const [id] = args

  const [user] = message.mentions
  const member = user || id ? message.channel.guild.members.get(user ? user.id : id) : undefined
  const role = id
    ? message.channel.guild.roles.get(id) ||
      // Incase the user provided a role name and not an id
      message.channel.guild.roles.find(r => r.name.toLowerCase() === id.toLowerCase())
    : undefined

  // If a member was passed we want to reset this members XP only
  if (member) {
    const memberSettings = await Gamer.database.models.member.findOne({
      id: `${message.channel.guild.id}.${message.author.id}`
    })

    if (!memberSettings) return

    memberSettings.leveling.voicexp = 0
    memberSettings.leveling.voicelevel = 0
    memberSettings.save()

    return message.channel.createMessage(language(`leveling/xpresetvoice:MEMBER`, { member: member.mention }))
  }

  // Find all members from this guild so we can loop those with edited settings only
  const memberSettings = await Gamer.database.models.member.find({
    guildID: message.channel.guild.id
  })

  // For every member reset his xp and level
  for (const settings of memberSettings) {
    // Since we already fetched members above we can just get() here
    const member = message.channel.guild.members.get(settings.memberID)
    if (!member) continue
    // If user is a bot OR a role is provided and this member doesnt have it skip
    if (member.user.bot || (role && !member.roles.includes(role.id))) continue

    settings.leveling.voicexp = 0
    settings.leveling.voicelevel = 0
    settings.save()
  }

  return message.channel.createMessage(
    language(role ? `leveling/xpresetvoice:ROLE` : `leveling/xpresetvoice:ALL`, { role: role && role.name })
  )
})
