import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import { GuildSettings } from '../lib/types/settings'
import { GamerTradingCard, GamerTag } from '../lib/types/gamer'

export default new Command(`capture`, async (message, args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient
  if (!args.length) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const language = Gamer.i18n.get(guildSettings?.language || `en-US`)
  if (!language) return

  const cardSettings = (await Gamer.database.models.tradingCard.find({
    channelID: message.channel.id
  })) as GamerTradingCard[]

  const [name] = args

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

    const tag = (await Gamer.database.models.tag.findOne({
      guildID: message.channel.guild.id,
      name: name.toLowerCase()
    })) as GamerTag | null
    if (!tag) return

    const transformed = Gamer.helpers.transform.variables(tag.embedCode)
    const embedCode = JSON.parse(transformed)
    message.channel.createMessage({ embed: embedCode })
  }
})
