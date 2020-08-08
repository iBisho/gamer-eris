import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'

export default new Command(['memberrole', 'mr'], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const roleIDOrName = args.join(' ')
  const [roleID] = message.roleMentions
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)
  const [name] = args
  if (!name) return helpCommand.execute(message, [`memberrole`], { ...context, commandName: 'help' })

  // If they are using default settings, they won't be vip server
  if (!Gamer.vipGuildIDs.has(message.member.guild.id)) 
    return message.channel.createMessage(language`vip/analyze:NEED_VIP`)
    
  const role = roleID
    ? message.member.guild.roles.get(roleID)
    : message.member.guild.roles.find(r => r.id === roleIDOrName || r.name.toLowerCase() === roleIDOrName.toLowerCase())
  if (!role) return message.channel.createMessage(language(`roles/role:NEED_ROLE`))

  if (!Gamer.allMembersFetchedGuildIDs.has(message.member.guild.id)) {
    await message.member.guild.fetchAllMembers()
    Gamer.allMembersFetchedGuildIDs.add(message.member.guild.id)
  }

  let bots = 0
  let users = 0
  
  for (const member of message.member.guild.members.values()) {
    if (!member.roles.includes(role.id)) continue;
    if (member.user.bot) bots++
    else users++
  }

  const embed = new MessageEmbed()
    .setAuthor(role.name, message.author.avatarURL)
    .addField(language(`vip/memberrole:ROLE_NAME`), role.mention, true)
    .addField(language(`vip/memberrole:ROLE_ID`), role.id, false)
    .addField(language(`vip/memberrole:ROLE_USER`), users.toLocaleString(), true)
    .addField(language(`vip/memberrole:ROLE_BOTS`), bots.toLocaleString(), true)
    .setFooter(language(`vip/memberrole:CREATED_AT`))
    .setTimestamp(role.createdAt)

  return message.channel.createMessage({ embed: { ...embed.code, color: role.color } })
})
