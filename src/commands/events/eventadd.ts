import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`eventadd`, `eadd`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  const language = Gamer.getLanguage(message.guildID)
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const [number, ...roleIDsOrNames] = args
  const eventID = Number(number)
  const helpCommand = Gamer.commandForName(`help`)
  if (!eventID) return helpCommand?.execute(message, [`eventadd`], { ...context, commandName: 'help' })

  // Get the event from this server using the id provided
  const event = await Gamer.database.models.event.findOne({
    eventID,
    guildID: message.guildID
  })
  if (!event) return message.channel.createMessage(language(`events/events:INVALID_EVENT`))

  message.channel.createMessage(language(`events/eventadd:PATIENCE`))

  for (const user of message.mentions) {
    if (event.attendees.includes(user.id)) continue
    const member = await Gamer.helpers.discord.fetchMember(message.member.guild, user.id)
    if (!member) continue
    if (event.allowedRoleIDs.length && !member.roles.some(roleID => event.allowedRoleIDs.includes(roleID))) continue
    Gamer.helpers.events.joinEvent(event, user.id, language)
  }

  for (const roleIDOrName of [...message.roleMentions, ...roleIDsOrNames]) {
    const role =
      message.member.guild.roles.get(roleIDOrName) ||
      message.member.guild.roles.find(r => r.name.toLowerCase() === roleIDOrName.toLowerCase())
    if (!role) continue

    const allMemberRoles = await Gamer.database.models.roles.find({ roleIDs: role.id })
    for (const memberRole of allMemberRoles) {
      const member = await Gamer.helpers.discord.fetchMember(message.member.guild, memberRole.memberID)
      if (!member) continue

      if (event.attendees.includes(member.id)) continue
      if (event.allowedRoleIDs.length && !member.roles.some(roleID => event.allowedRoleIDs.includes(roleID))) continue
      Gamer.helpers.events.joinEvent(event, member.id, language)
    }
  }

  event.save()

  return message.channel.createMessage(language(`events/eventadd:ADDED`, { mention: message.author.mention }))
})
