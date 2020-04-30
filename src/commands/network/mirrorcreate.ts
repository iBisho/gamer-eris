import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { TextChannel, NewsChannel } from 'eris'
import { userTag } from 'helperis'

export default new Command([`mirrorcreate`, `mc`], async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const helpCommand = Gamer.commandForName('help')
  const [name, firstID, secondID] = args
  if (!name || !firstID) return helpCommand?.process(message, ['mirrorcreate'], context)

  const firstIDGuild = Gamer.guilds.get(firstID)

  if (firstIDGuild && !Gamer.vipGuildIDs.has(message.guildID))
    return message.channel.createMessage(language(`network/mirrorcreate:VIP_ONLY_GUILD`))
  const mirrorChannel = firstIDGuild
    ? firstIDGuild.channels.get(secondID)
    : message.member.guild.channels.get(message.channelMentions[0] || firstID)
  if (!mirrorChannel || (!(mirrorChannel instanceof TextChannel) && !(mirrorChannel instanceof NewsChannel)))
    return message.channel.createMessage(language(`network/mirrorcreate:INVALID_CHANNEL`))

  console.log(mirrorChannel.name)
  // Make sure the bot has the permissions to create webhooks
  const hasPermission = Gamer.helpers.discord.checkPermissions(mirrorChannel, Gamer.user.id, [
    `manageWebhooks`,
    `readMessages`,
    `sendMessages`
  ])
  if (!hasPermission)
    return message.channel.createMessage(
      language(`network/mirrorcreate:MISSING_WEBHOOK_PERMS`, { channel: mirrorChannel.mention })
    )

  const guildSettings = await Gamer.database.models.guild.findOne({ id: message.guildID })
  // If the user does not have a modrole or admin role quit out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  // Extra layer of security to prevent abuse
  if (firstIDGuild) {
    const targetGuildSettings = await Gamer.database.models.guild.findOne({ id: firstID })
    if (!Gamer.helpers.discord.isAdmin(message, targetGuildSettings?.staff.adminRoleID)) return
  }

  // All requirements passed time to create a webhook.
  const webhook = await mirrorChannel.createWebhook(
    { name, avatar: Gamer.user.avatarURL },
    language(`network/mirrorcreate:MIRROR_CREATE_REASON`, { username: encodeURIComponent(userTag(message.author)) })
  )

  const mirror = await Gamer.database.models.mirror.create({
    name: name.toLowerCase(),
    sourceChannelID: message.channel.id,
    mirrorChannelID: mirrorChannel.id,
    sourceGuildID: message.member.guild.id,
    mirrorGuildID: mirrorChannel.guild.id,
    webhookToken: webhook.token,
    webhookID: webhook.id
  })

  // Add in cache
  Gamer.mirrors.set(mirror.sourceChannelID, mirror)

  return message.channel.createMessage(
    language(`network/mirrorcreate:CREATED`, {
      name,
      sourceChannel: message.channel.mention,
      mirrorChannel: mirrorChannel.mention
    })
  )
})
