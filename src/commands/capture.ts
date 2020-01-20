import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`capture`, async (message, args, context) => {
  if (!args.length || !message.guildID) return

  const Gamer = context.client as GamerClient

  const language = Gamer.getLanguage(message.guildID)

  const cardSettings = await Gamer.database.models.tradingCard.find({
    channelID: message.channel.id
  })

  const name = args.join(' ')

  for (const setting of cardSettings) {
    if (!setting.lastItemName) {
      message.channel.createMessage(language(`gaming/capture:NOTHING_AVAILABLE`))
      continue
    }

    if (setting.lastItemName.toLowerCase() !== name.toLowerCase()) {
      message.channel.createMessage(language(`gaming/capture:WRONG_NAME`))
      continue
    }

    // Send message first so we can use the last item name before setting it undefined
    message.channel.createMessage(language(`gaming/capture:SUCCESS`, { name: setting.lastItemName }))

    // The card has been successfully captured
    setting.lastItemName = undefined
    setting.save()

    const tag = await Gamer.database.models.tag.findOne({
      guildID: message.guildID,
      name: name.toLowerCase()
    })
    if (!tag) return

    const transformed = Gamer.helpers.transform.variables(tag.embedCode)
    const embedCode = JSON.parse(transformed)
    message.channel.createMessage({ embed: embedCode })
  }
})
