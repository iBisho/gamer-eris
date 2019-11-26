import { Member } from 'eris'
import Event from '../lib/structures/Event'
import Gamer from '../index'

export default class extends Event {
  async execute(member: Member) {
    if (member.bot) return

    const memberSettings =
      (await Gamer.database.models.member.findOne({
        memberID: member.id
      })) ||
      (await Gamer.database.models.member.create({
        memberID: member.id,
        guildID: member.guild.id,
        id: `${member.guild.id}.${member.id}`
      }))

    memberSettings.leveling.joinedVoiceAt = Date.now()
    memberSettings.save()
  }
}
