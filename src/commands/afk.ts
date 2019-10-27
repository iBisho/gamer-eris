import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings, UserSettings } from '../lib/types/settings'

export default new Command(`afk`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  const settings =
    message.channel instanceof PrivateChannel
      ? null
      : ((await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) as GuildSettings | null)
  if (!settings) return

  const language = Gamer.i18n.get(settings ? settings.language : 'en-US')
  if (!language) return null

  const userSettings = (await Gamer.database.models.user.findOne({
    id: message.author.id
  })) as UserSettings | null
  if (!userSettings) return
  // If no message is provided then toggle the afk status
  if (!args.length) {
    userSettings.afk.enabled = !userSettings.afk.enabled
    await userSettings.save()
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
  await userSettings.save()
  return message.channel.createMessage(language(`settings/afk:MESSAGE_UPDATED`))
})
