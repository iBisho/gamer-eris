import Event from '../lib/structures/Event'

export default class extends Event {
  async execute(text: string) {
    if (text.includes('Global')) console.log(text)
  }
}
