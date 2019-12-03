import { Command } from 'yuuko'
import GamerEmbed from '../lib/structures/GamerEmbed'
import { PrivateChannel, Role, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { UserSettings } from '../lib/types/settings'
import UserDefaults from '../constants/settings/user'

export default new Command([`user`, `userinfo`, `ui`, `whois`], async (message, _args, context) => {
  const user = message.mentions.length ? message.mentions[0] : message.author
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const guild = message.channel.guild
  const userSettings =
    ((await Gamer.database.models.user.findOne({ id: user.id })) as UserSettings | null) || UserDefaults

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return null

  const member = guild.members.get(user.id)
  if (!member) return

  const buffer = await Gamer.helpers.profiles.makeCanvas(message, member || message.member, Gamer)
  if (!buffer) return

  const fileName = `${member.id}.png`

  // If the key is enabled then keep it because the user has this permission
  const permOverview = Object.keys(member.permission.json)
    .filter(key => member.permission.json[key])
    .map(key => Gamer.helpers.transform.splitCamelCase(key))

  const JOINED_VALUE = language(`basic/user:JOINED_VALUE`, {
    memberDate: new Date(user.createdAt).toISOString().substr(0, 10),
    guildName: message.channel.guild.name,
    guildDate: new Date(member.joinedAt).toISOString().substr(0, 10)
  })
  const SETTINGS_VALUE = language(`basic/user:SETTINGS_VALUES`, {
    afk: userSettings.afk.enabled,
    afkMessage: userSettings.afk.message
  })

  const nickname = member?.nick ? language(`basic/user:NICKNAME`, { nickname: member.nick }) : ``
  const userID = language(`basic/user:ID`, { id: user.id, url: user.avatarURL })

  const roles = member.roles
    .sort((a, b) => (member.guild.roles.get(b) as Role).position - (member.guild.roles.get(a) as Role).position)
    .map(id => `<@&${id}>`)
    .join(`, `)

  const embed = new GamerEmbed()
    .setAuthor(user.username, user.avatarURL)
    .setThumbnail(user.avatarURL)
    .setDescription(`${nickname}${userID}`)
    .addField(language(`basic/user:JOINED`), JOINED_VALUE)
    .addField(language(`basic/user:SETTINGS`), SETTINGS_VALUE)
    .addField(language(`basic/user:PERMISSIONS`), permOverview.sort().join(`, `))
    .attachFile(buffer, fileName)
    .setImage(`attachment://${fileName}`)
  if (roles) embed.addField(language(`basic/user:ROLES`), roles)

  message.channel.createMessage({ embed: embed.code }, embed.file)
  return Gamer.helpers.levels.completeMission(message.member, `user`, message.channel.guild.id)
})
