import Event from '../lib/structures/Event'

export default class extends Event {
  async execute(text: string) {
    // console.warn('debug event', text)
    if (text.includes('Global')) console.log(text)
  }
}
