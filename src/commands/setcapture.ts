import { Command } from 'yuuko'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import { GuildSettings } from '../lib/types/settings'
import { GamerTradingCard } from '../lib/types/gamer'

export default new Command(`setcapture`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel) return

  let guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null
  if (!guildSettings) guildSettings = new Gamer.database.models.guild({ id: message.channel.guild.id }) as GuildSettings

  const language = Gamer.i18n.get(guildSettings.language)
  if (!language) return
  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const [game] = args
  const validGames = [`arenaofvalor`, `mobilelegends`, `rulesofsurvival`]
  if (!game || !validGames.includes(game.toLowerCase()))
    return message.channel.createMessage(
      language(`settings/setcapture:INVALID_GAME`, { validGames: validGames.join(', ') })
    )
  const channelID = message.channelMentions.length ? message.channelMentions[0] : message.channel.id

  let gameSettings = (await Gamer.database.models.tradingCard.findOne({
    guildID: message.channel.guild.id,
    game: game.toLowerCase()
  })) as GamerTradingCard | null
  if (!gameSettings) {
    gameSettings = new Gamer.database.models.tradingCard({
      game: game.toLowerCase(),
      guildID: message.channel.id,
      channelID: channelID,
      lastItemName: undefined
    }) as GamerTradingCard

    return message.channel.createMessage(language(`settings/setcapture:CHANNEL_SETUP`))
  }

  if (gameSettings.channelID === channelID)
    return message.channel.createMessage(language(`settings/setcapture:ALREADY_SET`))

  gameSettings.channelID = channelID
  gameSettings.save()

  return message.channel.createMessage(language(`settings/setcapture:CHANNEL_UPDATED`))
})
