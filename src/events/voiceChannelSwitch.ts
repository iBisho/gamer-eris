import { Member, VoiceChannel } from 'eris'
import Event from '../lib/structures/Event'
import Gamer from '../index'

export default class extends Event {
  async execute(member: Member, channel: VoiceChannel) {
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
  }
}
