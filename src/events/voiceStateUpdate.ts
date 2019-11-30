import { Member, OldVoiceState } from 'eris'
import Event from '../lib/structures/Event'

export default class extends Event {
  async execute(member: Member, oldState: OldVoiceState) {
    console.log('voicestate update event', member.id, oldState)
  }
}
