import { Member, VoiceChannel } from 'eris'
import Gamer from '../index'
import { MessageEmbed, userTag } from 'helperis'
import { EventListener } from 'yuuko'
import { upsertMember } from '../database/mongoHandler'
import { sendMessage } from '../lib/utils/eris'

export async function voiceChannelJoinServerLog(member: Member, channel: VoiceChannel) {
  const language = Gamer.getLanguage(member.guild.id)

  // Create the base embed that first can be sent to public logs
  const embed = new MessageEmbed()
    .setAuthor(userTag(member), member.avatarURL)
    .setTitle(language(`moderation/logs:JOINED_VOICE`))
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

  sendMessage(guildSettings.moderation.logs.serverlogs.members.channelID, { embed: { ...embed.code } })
}

export default new EventListener('voiceChannelJoin', async (member, channel) => {
  voiceChannelJoinServerLog(member, channel)
  if (member.bot) return

  const memberSettings = await upsertMember(member.id, member.guild.id)

  memberSettings.leveling.joinedVoiceAt = Date.now()
  memberSettings.save()
})
