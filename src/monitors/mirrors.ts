import Monitor from '../lib/structures/Monitor'
import { Message } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { userTag } from 'helperis'
import nodefetch from 'node-fetch'

const funnyAnonymousNames = ['Anonymous', 'God', 'Discord CEO', 'Discord API']

export default class extends Monitor {
  ignoreBots = false
  async execute(message: Message, Gamer: GamerClient) {
    const mirror = Gamer.mirrors.get(message.channel.id)
    if (!mirror) return

    let username = mirror.anonymous
      ? `${Gamer.helpers.utils.chooseRandom(funnyAnonymousNames)}#0000`
      : userTag(message.author)
    if (!username.endsWith(' - Gamer Mirror')) username += ' - Gamer Mirror'

    // This is a mirror channel so we need to execute a webhook for it

    let buffer: Buffer | undefined
    const [attachment] = message.attachments

    if (attachment) {
      buffer = await nodefetch(attachment.url)
        .then(res => res.buffer())
        .catch(() => undefined)
    }

    Gamer.executeWebhook(mirror.webhookID, mirror.webhookToken, {
      content: message.content,
      embeds: message.embeds,
      file: attachment && buffer ? { name: attachment.filename, file: buffer } : undefined,
      username: username.substring(0, 80) || 'Unknown User - Gamer Mirror',
      avatarURL: mirror.anonymous ? Gamer.user.avatarURL : message.author.avatarURL,
      allowedMentions: {
        everyone: false,
        roles: false,
        users: false
      }
    }).catch(() => undefined)

    if (mirror.deleteSourceMessages) message.delete().catch(() => undefined)
  }
}
