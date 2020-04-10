import { Member, VoiceChannel, TextChannel } from 'eris'
import Event from '../lib/structures/Event'
import Gamer from '../index'
import { MessageEmbed, userTag } from 'helperis'

export const voiceChannelJoinServerLog = async (member: Member, channel: VoiceChannel) => {
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

  const guildSettings = await Gamer.database.models.guild.findOne({ id: member.guild.id })
  if (!guildSettings?.moderation.logs.serverlogs.members.channelID) return

  const logChannel = member.guild.channels.get(guildSettings.moderation.logs.serverlogs.members.channelID)
  // Send the finalized embed to the log channel
  if (logChannel instanceof TextChannel) {
    const botPerms = logChannel.permissionsOf(Gamer.user.id)
    if (botPerms.has(`embedLinks`) && botPerms.has(`readMessages`) && botPerms.has(`sendMessages`))
      logChannel.createMessage({ embed: { ...embed.code } })
  }
}

export default class extends Event {
  async execute(member: Member, channel: VoiceChannel) {
    voiceChannelJoinServerLog(member, channel)
    if (member.bot) return

    const memberSettings =
      (await Gamer.database.models.member.findOne({ memberID: member.id, guildID: member.guild.id })) ||
      (await Gamer.database.models.member.create({
        memberID: member.id,
        guildID: member.guild.id,
        id: `${member.guild.id}.${member.id}`
      }))

    memberSettings.leveling.joinedVoiceAt = Date.now()
    memberSettings.save()
  }
}
