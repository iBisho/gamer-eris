import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`afk`, async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const userSettings =
    (await Gamer.database.models.user.findOne({
      userID: message.author.id
    })) || (await Gamer.database.models.user.create({ userID: message.author.id }))

  // If no message is provided then toggle the afk status
  if (!args.length) {
    userSettings.afk.enabled = !userSettings.afk.enabled
    userSettings.save()
    message.channel.createMessage(
      language(userSettings.afk.enabled ? `settings/afk:STATUS_ISENABLED` : `settings/afk:STATUS_ISDISABLED`)
    )
    return Gamer.helpers.levels.completeMission(message.member, `afk`, message.channel.guild.id)
  }

  const content = args.join(' ')
  // If the message is a JSON code validate it before saving
  if (content.startsWith(`{`)) {
    let json: string | undefined
    try {
      JSON.parse(content)
      json = args.join()
    } catch {
      json = undefined
    }
    if (!json) return message.channel.createMessage(`settings/afk:INVALID_JSON`)
  }

  // Update the message
  userSettings.afk.message = content
  userSettings.save()
  return message.channel.createMessage(language(`settings/afk:MESSAGE_UPDATED`))
})
