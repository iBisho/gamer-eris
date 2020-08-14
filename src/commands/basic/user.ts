import { Command } from 'yuuko'
import { MessageEmbed } from 'helperis'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`user`, `userinfo`, `ui`, `whois`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient

  const [id] = args
  const user =
    message.mentions[0] || (id ? (await Gamer.helpers.discord.fetchUser(id)) || message.author : message.author)

  const userSettings = await Gamer.database.models.user.findOne({ userID: user.id })
  const language = Gamer.getLanguage(message.guildID)

  const member = await Gamer.helpers.discord.fetchMember(message.member.guild, user.id)
  if (!member) return

  const buffer = await Gamer.helpers.profiles.makeCanvas(message, member || message.member, Gamer)
  if (!buffer) return

  const activity = await Gamer.database.models.analytics
    .find({
      userID: user.id,
      guildID: message.member.guild.id,
      type: 'MESSAGE_CREATE'
    })
    .sort('-timestamp')
    .limit(1)

  const fileName = `${member.id}.png`

  const memberPerms = member.permission.json
  // If the key is enabled then keep it because the user has this permission
  const permOverview = Object.keys(memberPerms)
    .filter(key => memberPerms[key])
    .map(key => Gamer.helpers.transform.splitCamelCase(key))

  const JOINED_VALUE = language(`basic/user:JOINED_VALUE`, {
    memberDate: new Date(user.createdAt).toISOString().substr(0, 10),
    guildName: message.member.guild.name,
    guildDate: new Date(member.joinedAt).toISOString().substr(0, 10)
  })
  const SETTINGS_VALUE = language(`basic/user:SETTINGS_VALUES`, {
    afk: userSettings ? userSettings.afkEnabled : false,
    afkMessage: userSettings
      ? userSettings.afkMessage
      : `Hi 👋, I am AFK at the moment. I will get back to you as soon as possible. 😄`
  })

  const nickname = member?.nick ? language(`basic/user:NICKNAME`, { nickname: member.nick }) : ``
  const userID = language(`basic/user:ID`, { id: user.id, url: user.avatarURL })

  const roles = member.roles.filter(id => member.guild.roles.has(id)).sort()
    .sort((a, b) => (member.guild.roles.get(b)?.position || 0) - (member.guild.roles.get(a)?.position || 0))
    .map(id => `<@&${id}>`)
    .join(`, `)

  const embed = new MessageEmbed()
    .setAuthor(user.username, user.avatarURL)
    .setThumbnail(user.avatarURL)
    .setDescription(`${nickname}${userID}`)
    .addField(language(`basic/user:JOINED`), JOINED_VALUE)
    .addField(language(`basic/user:SETTINGS`), SETTINGS_VALUE)
    .addField(
      language(`basic/user:PERMISSIONS`),
      permOverview.includes('Administrator') ? 'Administrator' : permOverview.sort().join(`, `)
    )
    .attachFile(buffer, fileName)

  const [action] = activity
  if (action) {
    embed.setFooter(
      language('basic/user:LAST_ACTIVE', {
        time: Gamer.helpers.transform.humanizeMilliseconds(Date.now() - action.timestamp) || language('basic/user:NOW')
      })
    )
  }

  if (roles) embed.addField(language(`basic/user:ROLES`), roles)

  message.channel.createMessage({ embed: embed.code }, embed.file)
  return Gamer.helpers.levels.completeMission(message.member, `user`, message.guildID)
})
