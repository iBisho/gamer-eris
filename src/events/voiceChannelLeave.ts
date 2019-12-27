import { Member, VoiceChannel } from 'eris'
import Event from '../lib/structures/Event'
import Gamer from '../index'

export default class extends Event {
  async execute(member: Member | null, channel: VoiceChannel) {
    if (!member || member.bot) return

    const memberSettings = await Gamer.database.models.member.findOne({
      memberID: member.id,
      guildID: member.guild.id
    })
    if (!memberSettings) return

    // If they don't have a joinedat then cancel.
    if (!memberSettings.leveling.joinedVoiceAt) return
    // If the joined channel is the afk channel ignore.
    if (channel.id === channel.guild.afkChannelID) {
      memberSettings.leveling.joinedVoiceAt = 0
      memberSettings.save()
      return
    }

    // Calculate the amount of total minutes spent in this voice channel
    const totalMinutesInVoice = Math.round((Date.now() - memberSettings.leveling.joinedVoiceAt) / 1000 / 60)

    // Update voice xp to the guild
    memberSettings.leveling.joinedVoiceAt = 0
    memberSettings.leveling.voicexp += totalMinutesInVoice
    memberSettings.save()

    // If more than 10 minutes they have fulfilled the mission
    if (totalMinutesInVoice >= 10) Gamer.helpers.levels.completeMission(member, `voice10min`, member.guild.id)
  }
}
