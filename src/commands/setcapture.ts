import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`setcapture`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const guildSettings =
    (await Gamer.database.models.guild.findOne({
      id: message.channel.guild.id
    })) || (await Gamer.database.models.guild.create({ id: message.channel.guild.id }))

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const [game, reset] = args
  const validGames = [`arenaofvalor`, `mobilelegends`, `rulesofsurvival`]
  if (!game || !validGames.includes(game.toLowerCase()))
    return message.channel.createMessage(
      language(`settings/setcapture:INVALID_GAME`, { validGames: validGames.join(', ') })
    )

  const channelID = message.channelMentions.length ? message.channelMentions[0] : message.channel.id

  let gameSettings = await Gamer.database.models.tradingCard.findOne({
    guildID: message.channel.guild.id,
    game: game.toLowerCase()
  })

  if ([`reset`, language(`common:RESET`).toLowerCase()].includes(reset.toLowerCase())) {
    if (!gameSettings) return message.channel.createMessage(language('settings/setcapture:NOT_SETUP'))
    await Gamer.database.models.tradingCard.deleteOne({ _id: gameSettings._id })
    return message.channel.createMessage(language(`settings/setcapture:RESET`))
  }

  if (!gameSettings) {
    gameSettings = await Gamer.database.models.tradingCard.create({
      game: game.toLowerCase(),
      guildID: message.channel.guild.id,
      channelID: channelID,
      lastItemName: undefined
    })

    return message.channel.createMessage(language(`settings/setcapture:CHANNEL_SETUP`))
  }

  if (gameSettings.channelID === channelID)
    return message.channel.createMessage(language(`settings/setcapture:ALREADY_SET`))

  gameSettings.channelID = channelID
  gameSettings.save()

  return message.channel.createMessage(language(`settings/setcapture:CHANNEL_UPDATED`))
})
