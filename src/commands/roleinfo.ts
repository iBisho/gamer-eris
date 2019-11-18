import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import GamerEmbed from '../lib/structures/GamerEmbed'

export default new Command([`roleinfo`, `ri`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  const roleIDOrName = args.join(' ')
  const [roleID] = message.roleMentions

  const role = roleID
    ? message.channel.guild.roles.get(roleID)
    : message.channel.guild.roles.find(
        r => r.id === roleIDOrName || r.name.toLowerCase() === roleIDOrName.toLowerCase()
      )
  if (!role) return

  const settings = (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null
  const language = Gamer.i18n.get(settings ? settings.language : `en-US`)
  if (!language) return
  // If the user does not have a modrole or admin role quit out
  if (
    !settings ||
    Gamer.helpers.discord.isModerator(message, settings.staff.modRoleIDs) ||
    (settings.staff.adminRoleID && Gamer.helpers.discord.isAdmin(message, settings.staff.adminRoleID))
  )
    return

  const members = message.channel.guild.members.filter(member => member.roles.includes(role.id))

  const embed = new GamerEmbed()
    .setAuthor(role.name, message.author.avatarURL)
    .addField(language(`roles/roleinfo:ROLE_NAME`), role.mention, true)
    .addField(language(`roles/roleinfo:ROLE_ID`), role.id, true)
    .addField(language(`roles/roleinfo:ROLE_COLOR`), role.color.toString(), true)
    .addField(language(`roles/roleinfo:ROLE_SEPARATE`), Gamer.helpers.discord.booleanEmoji(role.hoist), true)
    .addField(language(`roles/roleinfo:ROLE_MENTIONABLE`), Gamer.helpers.discord.booleanEmoji(role.mentionable), true)
    .addField(language(`roles/roleinfo:ROLE_POSITION`), role.position.toString(), true)
    .addField(language(`roles/roleinfo:ROLE_MEMBERS`), members.length.toString(), true)
    .setFooter(language(`roles/roleinfo:CREATED_AT`))
    .setTimestamp(role.createdAt)

  message.channel.createMessage({ embed: { ...embed.code, color: role.color } })
})
