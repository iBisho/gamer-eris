import { voiceChannelJoinServerLog } from './voiceChannelJoin'
import { voiceChannelLeaveServerLog } from './voiceChannelLeave'
import { EventListener } from 'yuuko'
import { upsertMember } from '../database/mongoHandler'

export default new EventListener('voiceChannelSwitch', async (member, channel, oldChannel) => {
  voiceChannelLeaveServerLog(member, oldChannel)
  voiceChannelJoinServerLog(member, channel)
  // If the new channel is not afk channel then cancel
  if (channel.id !== member.guild.afkChannelID) return

  const memberSettings = await upsertMember(member.id, member.guild.id)
  // Since the user went to the afk channel we reset their xp
  memberSettings.leveling.joinedVoiceAt = 0
  memberSettings.save()
})
