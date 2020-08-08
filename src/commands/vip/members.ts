import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { parseRole } from '../../lib/utils/arguments'

export default new Command([ 'members', 'memberlist'] , async (message, args, context) => {
  if (!message.guildID || !message.member) return

const Gamer = context.client as GamerClient
const helpCommand = Gamer.commandForName('help')
if (!helpCommand) return

const language = Gamer.getLanguage(message.guildID)
const [name] = args
if (!name) return helpCommand.execute(message, [`members`, `memberlist`], { ...context, commandName: 'help' })

// If they are using default settings, they won't be vip server
if (!Gamer.vipGuildIDs.has(message.member.guild.id))
return message.channel.createMessage(language`vip/analyze:NEED_VIP`)

const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) 
  return message.channel.createMessage(language('common:NOT_MOD_OR_ADMIN'))

  const [roleNameOrID] = args
  const role = parseRole(message, roleNameOrID)
  if (!role) return message.channel.createMessage(language(`roles/role:NEED_ROLE`))

  if (!Gamer.allMembersFetchedGuildIDs.has(message.member.guild.id)) {
    await message.member.guild.fetchAllMembers()
    Gamer.allMembersFetchedGuildIDs.add(message.member.guild.id)
  }

  const roles =
    message.member.guild.members.filter(member => member.roles.includes(role.id))

  let response = ``
  for (const member of roles) {
    const members = `${member.mention} -> **${member.id}**\n`
    if (response.length + members.length >= 2000) {
      Gamer.helpers.discord.embedResponse(message, response)
      response = ``
    }
    response += members
  }

  return Gamer.helpers.discord.embedResponse(message, response)
})