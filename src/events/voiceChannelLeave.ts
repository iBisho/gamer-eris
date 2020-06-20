import { Member, VoiceChannel, TextChannel } from 'eris'
import Gamer from '../index'
import { MessageEmbed, userTag } from 'helperis'
import { EventListener } from 'yuuko'

export async function voiceChannelLeaveServerLog(member: Member, channel: VoiceChannel) {
  const language = Gamer.getLanguage(member.guild.id)

  // Create the base embed that first can be sent to public logs
  const embed = new MessageEmbed()
    .setAuthor(userTag(member), member.avatarURL)
    .setTitle(language(`moderation/logs:LEFT_VOICE`))
    .addField(language(`moderation/logs:MEMBER_NAME`), member.mention, true)
    .addField(language(`moderation/logs:USER_ID`), member.id, true)
    .addField(language(`moderation/logs:TOTAL_MEMBERS`), channel.voiceMembers.size.toString(), true)
    .addField(language(`moderation/logs:CHANNEL`), channel.name, true)
    .addField(language(`moderation/logs:CHANNEL_ID`), channel.id, true)
    .addField(
      language(`moderation/logs:MAX_MEMBERS`),
      !channel.userLimit || channel.userLimit === 0 ? '♾️' : channel.userLimit?.toString(),
      true
    )
    .setFooter(channel.name, `https://i.imgur.com/Ya0SXdI.png`)
    .setThumbnail(`https://i.imgur.com/Ya0SXdI.png`)
    .setTimestamp()

  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: member.guild.id })
  if (!guildSettings?.moderation.logs.serverlogs.members.channelID) return

  const logChannel = member.guild.channels.get(guildSettings.moderation.logs.serverlogs.members.channelID)
  // Send the finalized embed to the log channel
  if (logChannel instanceof TextChannel) {
    const botPerms = logChannel.permissionsOf(Gamer.user.id)
    if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
      logChannel.createMessage({ embed: { ...embed.code } })
  }
}

export default new EventListener('voiceChannelLeave', async (member, channel) => {
  if (!member) return

  voiceChannelLeaveServerLog(member, channel)
  if (member.bot) return

  // Make sure the member is still part of the server
  if (!member.guild.members.has(member.id)) return

  const memberSettings = await Gamer.database.models.member.findOne({
    memberID: member.id,
    guildID: member.guild.id
  })

  // If they don't have a joinedat then cancel.
  if (!memberSettings?.leveling.joinedVoiceAt) return
  // If the joined channel is the afk channel ignore.
  if (channel.id === channel.guild.afkChannelID) {
    memberSettings.leveling.joinedVoiceAt = 0
    memberSettings.save().catch(error => console.log(error))
    return
  }

  // Calculate the amount of total minutes spent in this voice channel
  const totalMinutesInVoice = Math.round((Date.now() - memberSettings.leveling.joinedVoiceAt) / 1000 / 60)
  const guildXPMultiplier = Gamer.guildsXPPerMinuteVoice.get(member.guild.id)

  // Update voice xp to the guild
  memberSettings.leveling.joinedVoiceAt = 0
  memberSettings.leveling.voicexp += totalMinutesInVoice * (guildXPMultiplier || 1)
  memberSettings.save()

  // If more than 10 minutes they have fulfilled the mission
  if (totalMinutesInVoice >= 10) Gamer.helpers.levels.completeMission(member, `voice10min`, member.guild.id)
})
