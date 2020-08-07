import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command('members' , async (message, args, context) => {
  if (!message.guildID || !message.member) return

const Gamer = context.client as GamerClient
const roleIDOrName = args.join(' ')
const [roleID] = message.roleMentions
const helpCommand = Gamer.commandForName('help')
if (!helpCommand) return

const language = Gamer.getLanguage(message.guildID)
const [name] = args
if (!name) return helpCommand.execute(message, [`members`], { ...context, commandName: 'help' })

// If they are using default settings, they won't be vip server
if (!Gamer.vipGuildIDs.has(message.member.guild.id))
return message.channel.createMessage(language`vip/analyze:NEED_VIP`)

const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) 
  return message.channel.createMessage(language('common:NOT_MOD_OR_ADMIN'))

  const role = roleID
    ? message.member.guild.roles.get(roleID)
    : message.member.guild.roles.find(r => r.id === roleIDOrName || r.name.toLowerCase() === roleIDOrName.toLowerCase())
  if (!role) return

  if (!Gamer.allMembersFetchedGuildIDs.has(message.member.guild.id)) {
    await message.member.guild.fetchAllMembers()
    Gamer.allMembersFetchedGuildIDs.add(message.member.guild.id)
  }

  const members =
    message.member.guild.members.filter(member => member.roles.includes(role.id))

  let response = ``
  for (const _member of members) {
    const text = `${_member.mention}\n`
    if (response.length + text.length >= 2000) {
      Gamer.helpers.discord.embedResponse(message, response)
      response = ``
    }
    response += text
  }

  return Gamer.helpers.discord.embedResponse(message, response)
})