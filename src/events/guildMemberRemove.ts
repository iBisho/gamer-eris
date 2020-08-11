import { TextChannel, Member } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed, userTag } from 'helperis'
import { EventListener } from 'yuuko'
import { sendMessage } from '../lib/utils/eris'

export default new EventListener('guildMemberRemove', async (guild, member) => {
  const Gamer = guild.shard.client as GamerClient
  Gamer.amplitude.push({
    authorID: member.id,
    guildID: guild.id,
    timestamp: Date.now(),
    type: 'MEMBER_REMOVED'
  })

  Gamer.database.models.analytics.create({
    guildID: guild.id,
    userID: member.id,
    messageID: 'N/A',
    channelID: 'N/A',
    timestamp: Date.now(),
    type: 'MEMBER_REMOVED'
  })

  // Deletes the member in db
  Gamer.database.models.member
    .deleteOne({ memberID: member.id, guildID: guild.id })
    .exec()
    .catch(error => console.log(error))

  if (member instanceof Member) {
    Gamer.database.models.roles.findOneAndUpdate(
      { memberID: member.id, guildID: guild.id },
      { memberID: member.id, guildID: guild.id, roleIDs: member.roles },
      { upsert: true }
    )
  }

  Gamer.database.models.user
    .findOneAndUpdate({ userID: member.id }, { $pull: { guildIDs: guild.id } })
    .exec()
    .catch(() => undefined)

  const botMember = await Gamer.helpers.discord.fetchMember(guild, Gamer.user.id)
  if (!botMember) return

  const language = Gamer.getLanguage(guild.id)

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: guild.id })
  // If no custom guild settings cancel out
  if (!guildSettings) return

  // Clean events if this member was participating

  const events = await Gamer.database.models.event.find({ guildID: guild.id })
  for (const event of events) {
    const isAttendee = event.attendees.includes(member.id)
    const isWaiting = event.waitingList.includes(member.id)
    const isDenial = event.denials.includes(member.id)

    if (!isAttendee && !isWaiting && !isDenial) continue

    event.attendees = event.attendees.filter(id => id !== member.id)
    event.waitingList = event.waitingList.filter(id => id !== member.id)
    event.denials = event.denials.filter(id => id !== member.id)
    event.save()
  }

  // Goodbye Message

  if (guildSettings.hibye.goodbye.message) {
    try {
      const emojis = await Gamer.database.models.emoji.find()
      const isEmbed = guildSettings.hibye.goodbye.message.startsWith('{')
      const transformed = await Gamer.helpers.transform.variables(
        guildSettings.hibye.goodbye.message,
        member.user,
        guild,
        member.user,
        emojis
      )

      const embed = isEmbed ? JSON.parse(transformed) : undefined

      if (embed) {
        if (typeof embed.image === 'string') embed.image = { url: embed.image }
        if (typeof embed.thumbnail === 'string') embed.thumbnail = { url: embed.thumbnail }
        if (embed.color === 'RANDOM') embed.color = Math.floor(Math.random() * (0xffffff + 1))
        if (embed.timestamp) embed.timestamp = new Date().toISOString()
      }

      if (guildSettings.hibye.goodbye.dmEnabled) {
        const dmChannel = await member.user.getDMChannel()
        if (embed) dmChannel.createMessage({ content: embed.plaintext, embed })
        else dmChannel.createMessage(transformed)
      }
      if (guildSettings.hibye.goodbye.channelID) {
        const goodbyeChannel = guild.channels.get(guildSettings.hibye.goodbye.channelID)
        if (goodbyeChannel && goodbyeChannel instanceof TextChannel) {
          if (embed) goodbyeChannel.createMessage({ content: embed.plaintext, embed })
          else goodbyeChannel.createMessage(transformed)
        }
      }
    } catch {}
  }

  // Server logs feature

  const NONE = language(`common:NONE`)
  // Create the base embed that first can be sent to public logs
  const embed = new MessageEmbed()
    .setTitle(language(`moderation/logs:MEMBER_GONE`))
    .addField(language(`moderation/logs:MEMBER_NAME`), member.user.mention, true)
    .addField(language(`moderation/logs:USER_ID`), member.id, true)
    .addField(language(`moderation/logs:TOTAL_MEMBERS`), guild.memberCount.toString(), true)
    .addField(
      language(`moderation/logs:ROLES`),
      member instanceof Member ? member.roles.map(id => `<@&${id}>`).join(' ') || NONE : NONE
    )
    .setFooter(userTag(member.user), `https://i.imgur.com/Ya0SXdI.png`)
    .setThumbnail(member.user.avatarURL)
    .setTimestamp()

  const logs = guildSettings.moderation.logs
  if (logs.publiclogsChannelID) sendMessage(logs.publiclogsChannelID, { embed: embed.code })
  // Send the finalized embed to the log channel
  if (logs.serverlogs.members.channelID) sendMessage(logs.serverlogs.members.channelID, { embed: embed.code })
})
