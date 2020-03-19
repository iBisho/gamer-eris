import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`roleinfo`, `ri`], async (message, args, context) => {
  if (!message.member) return

  const Gamer = context.client as GamerClient
  const roleIDOrName = args.join(' ')
  const [roleID] = message.roleMentions

  const role = roleID
    ? message.member.guild.roles.get(roleID)
    : message.member.guild.roles.find(r => r.id === roleIDOrName || r.name.toLowerCase() === roleIDOrName.toLowerCase())
  if (!role) return

  const language = Gamer.getLanguage(message.guildID)

  await message.member.guild.fetchAllMembers()
  const members = message.member.guild.members.filter(member => member.roles.includes(role.id))

  const embed = new GamerEmbed()
    .setAuthor(role.name, message.author.avatarURL)
    .addField(language(`roles/roleinfo:ROLE_NAME`), role.mention, true)
    .addField(language(`roles/roleinfo:ROLE_ID`), role.id, true)
    .addField(language(`roles/roleinfo:ROLE_COLOR`), `#${role.color.toString(16).toUpperCase()}`, true)
    .addField(language(`roles/roleinfo:ROLE_SEPARATE`), Gamer.helpers.discord.booleanEmoji(role.hoist), true)
    .addField(language(`roles/roleinfo:ROLE_MENTIONABLE`), Gamer.helpers.discord.booleanEmoji(role.mentionable), true)
    .addField(language(`roles/roleinfo:ROLE_POSITION`), role.position.toString(), true)
    .addField(language(`roles/roleinfo:ROLE_MEMBERS`), members.length.toString(), true)
    .setFooter(language(`roles/roleinfo:CREATED_AT`))
    .setTimestamp(role.createdAt)

  message.channel.createMessage({ embed: { ...embed.code, color: role.color } })
})
