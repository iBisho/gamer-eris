import Event from '../lib/structures/Event'
import { TextChannel, Member, Guild, MemberPartial } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { MessageEmbed } from 'helperis'

export default class extends Event {
  async execute(guild: Guild, member: Member | MemberPartial) {
    const Gamer = guild.shard.client as GamerClient
    Gamer.amplitude.push({
      authorID: member.id,
      guildID: guild.id,
      timestamp: Date.now(),
      type: 'MEMBER_REMOVED'
    })

    const botMember = await Gamer.helpers.discord.fetchMember(guild, Gamer.user.id)
    if (!botMember) return

    const language = Gamer.getLanguage(guild.id)

    const guildSettings = await Gamer.database.models.guild.findOne({ id: guild.id })
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
        const transformed = Gamer.helpers.transform.variables(
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
          if (embed) dmChannel.createMessage({ embed })
          else dmChannel.createMessage(transformed)
        }
        if (guildSettings.hibye.goodbye.channelID) {
          const goodbyeChannel = guild.channels.get(guildSettings.hibye.goodbye.channelID)
          if (goodbyeChannel && goodbyeChannel instanceof TextChannel) {
            if (embed) goodbyeChannel.createMessage({ embed })
            else goodbyeChannel.createMessage(transformed)
          }
        }
      } catch {}
    }

    // Server logs feature

    // If there is no channel set for logging this cancel
    if (!guildSettings.moderation.logs.serverlogs.members.channelID) return

    // Create the base embed that first can be sent to public logs
    const embed = new MessageEmbed()
      .setTitle(language(`moderation/logs:MEMBER_GONE`))
      .addField(language(`moderation/logs:MEMBER_NAME`), member.user.mention, true)
      .addField(language(`moderation/logs:USER_ID`), member.id, true)
      .addField(language(`moderation/logs:TOTAL_MEMBERS`), guild.memberCount.toString(), true)
      .setFooter(`${member.user.username}#${member.user.discriminator}`, `https://i.imgur.com/Ya0SXdI.png`)
      .setThumbnail(member.user.avatarURL)
      .setTimestamp()

    const logs = guildSettings.moderation.logs

    // If public logs are enabled properly then send the embed there
    if (logs.serverlogs.members.removePublicEnabled && logs.publiclogsChannelID) {
      const publicLogChannel = guild.channels.get(logs.publiclogsChannelID)
      if (publicLogChannel instanceof TextChannel) {
        const hasPermission = Gamer.helpers.discord.checkPermissions(publicLogChannel, Gamer.user.id, [
          `embedLinks`,
          `readMessages`,
          `sendMessages`
        ])
        if (publicLogChannel && hasPermission) publicLogChannel.createMessage({ embed: embed.code })
      }
    }

    // Send the finalized embed to the log channel
    const logChannel = guild.channels.get(guildSettings.moderation.logs.serverlogs.members.channelID)
    if (logChannel instanceof TextChannel) {
      const hasPermission = Gamer.helpers.discord.checkPermissions(logChannel, Gamer.user.id, [
        `embedLinks`,
        `readMessages`,
        `sendMessages`
      ])
      if (hasPermission) logChannel.createMessage({ embed: embed.code })
    }
  }
}
