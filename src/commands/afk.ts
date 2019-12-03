import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { UserSettings } from '../lib/types/settings'

export default new Command(`afk`, async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  let userSettings = (await Gamer.database.models.user.findOne({
    userID: message.author.id
  })) as UserSettings | null
  if (!userSettings) userSettings = new Gamer.database.models.user({ userID: message.author.id }) as UserSettings

  // If no message is provided then toggle the afk status
  if (!args.length) {
    userSettings.afk.enabled = !userSettings.afk.enabled
    userSettings.save()
    return message.channel.createMessage(
      language(userSettings.afk.enabled ? `settings/afk:STATUS_ISENABLED` : `settings/afk:STATUS_ISDISABLED`)
    )
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
  message.channel.createMessage(language(`settings/afk:MESSAGE_UPDATED`))
  return Gamer.helpers.levels.completeMission(message.member, `afk`, message.channel.guild.id)
})
