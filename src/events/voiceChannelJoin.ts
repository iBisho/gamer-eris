import { Member } from 'eris'
import Event from '../lib/structures/Event'
import Gamer from '../index'
import { MemberSettings } from '../lib/types/settings'

export default class extends Event {
  async execute(member: Member) {
    let memberSettings = (await Gamer.database.models.member.findOne({
      memberID: member.id
    })) as MemberSettings | null
    if (!memberSettings)
      memberSettings = new Gamer.database.models.member({
        memberID: member.id,
        guildID: member.guild.id,
        id: `${member.guild.id}.${member.id}`
      }) as MemberSettings

    memberSettings.leveling.joinedVoiceAt = Date.now()
    memberSettings.save()
  }
}
