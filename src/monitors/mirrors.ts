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

    let username = mirror.anonymous
      ? `${Gamer.helpers.utils.chooseRandom(funnyAnonymousNames)}#0000`
      : userTag(message.author)
    if (!username.endsWith(' - Gamer Mirror')) username += ' - Gamer Mirror'

    // This is a mirror channel so we need to execute a webhook for it

    Gamer.executeWebhook(mirror.webhookID, mirror.webhookToken, {
      content: message.content,
      embeds: message.embeds,
      username: username.substring(0, 80) || 'Unknown User - Gamer Mirror',
      avatarURL: mirror.anonymous ? Gamer.user.avatarURL : message.author.avatarURL,
      allowedMentions: {
        everyone: false,
        roles: false,
        users: false
      }
    }).catch(() => {
      // Remove the webhook
      Gamer.mirrors.delete(message.channel.id)
      Gamer.database.models.mirror.deleteOne({ _id: mirror._id }).exec()
      return
    })

    if (mirror.deleteSourceMessages) message.delete().catch(() => undefined)
  }
}
