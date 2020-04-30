import Monitor from '../lib/structures/Monitor'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { userTag } from 'helperis'

const funnyAnonymousNames = ['Anonymous', 'God', 'Discord CEO', 'Discord API']

export default class extends Monitor {
  ignoreBots = false
  async execute(message: Message, Gamer: GamerClient) {
    // Possibly empty message with file or image
    if (!message.content && !message.embeds.length) return

    const mirror = Gamer.mirrors.get(message.channel.id)
    if (!mirror) return

    const webhookExists = await Gamer.getWebhook(mirror.webhookID).catch(() => undefined)
    if (!webhookExists) return

    // This is a mirror channel so we need to execute a webhook for it
    Gamer.executeWebhook(mirror.webhookID, mirror.webhookToken, {
      content: message.content,
      embeds: message.embeds,
      username: mirror.anonymous
        ? `${Gamer.helpers.utils.chooseRandom(funnyAnonymousNames)}#0000 - Gamer Mirror`
        : `${userTag(message.author)} - Gamer Mirror`,
      avatarURL: mirror.anonymous ? Gamer.user.avatarURL : message.author.avatarURL,
      allowedMentions: {
        everyone: false,
        roles: false,
        users: false
      }
    })

    if (mirror.deleteSourceMessages) message.delete().catch(() => undefined)
  }
}
