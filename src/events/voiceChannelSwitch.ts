import Gamer from '../index'
import { voiceChannelJoinServerLog } from './voiceChannelJoin'
import { voiceChannelLeaveServerLog } from './voiceChannelLeave'
import { EventListener } from 'yuuko'

export default new EventListener('voiceChannelSwitch', async (member, channel, oldChannel) => {
  voiceChannelLeaveServerLog(member, oldChannel)
  voiceChannelJoinServerLog(member, channel)
  // If the new channel is not afk channel then cancel
  if (channel.id !== member.guild.afkChannelID) return

  const memberSettings =
    (await Gamer.database.models.member.findOne({
      memberID: member.id
    })) ||
    (await Gamer.database.models.member.create({
      memberID: member.id,
      guildID: member.guild.id,
      id: `${member.guild.id}.${member.id}`
    }))
  // Since the user went to the afk channel we reset their xp
  memberSettings.leveling.joinedVoiceAt = 0
  memberSettings.save()
})
