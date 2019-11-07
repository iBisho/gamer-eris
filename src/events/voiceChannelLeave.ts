import { Member, VoiceChannel } from 'eris'
import Event from '../lib/structures/Event'
import Gamer from '../index'
import { MemberSettings } from '../lib/types/settings'

export default class extends Event {
  async execute(member: Member, channel: VoiceChannel) {
    const memberSettings = (await Gamer.database.models.member.findOne({
      memberID: member.id
    })) as MemberSettings | null
    if (!memberSettings) return

    // If the joined channel is the afk channel ignore.
    if (channel.id === channel.guild.afkChannelID) return

    // Calculate the amount of total minutes spent in this voice channel
    const totalMinutesInVoice = Math.round((Date.now() - memberSettings.leveling.joinedVoiceAt) / 1000 / 60)
    console.log('joined voice at', memberSettings.leveling.joinedVoiceAt, totalMinutesInVoice)

    // Update voice xp to the guild
    memberSettings.leveling.joinedVoiceAt = 0
    memberSettings.leveling.voicexp += totalMinutesInVoice
    memberSettings.save()
  }
}
