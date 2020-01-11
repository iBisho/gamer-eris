import { Command } from 'yuuko'
import { MemberSettings } from '../lib/types/settings'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`xpreset`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const language = Gamer.getLanguage(message.channel.guild.id)

  // Now we need to reset the entire guilds information
  await message.channel.createMessage(language(`leveling/xpreset:PATIENCE`))
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
    const memberSettings = (await Gamer.database.models.member.findOne({
      id: `${message.channel.guild.id}.${message.author.id}`
    })) as MemberSettings | null

    if (!memberSettings) return

    memberSettings.leveling.xp = 0
    memberSettings.leveling.level = 0
    memberSettings.save()

    return message.channel.createMessage(language(`leveling/xpreset:MEMBER`, { member: member.mention }))
  }

  // Find all members from this guild so we can loop those with edited settings only
  const memberSettings = (await Gamer.database.models.member.find({
    guildID: message.channel.guild.id
  })) as MemberSettings[]

  // For every member reset his xp and level
  for (const settings of memberSettings) {
    // Since we already fetched members above we can just get() here
    const member = message.channel.guild.members.get(settings.memberID)
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
