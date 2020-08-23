import { Command } from 'yuuko'
import { needMessage, sendMessage } from '../../lib/utils/eris'
import Gamer from '../..'

export default new Command(['giveawaydelete', 'gd'], async (message, args) => {
  if (!message.member) return

  const language = Gamer.getLanguage(message.member.guild.id)
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.member.guild.id })
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings))
    return message.channel.createMessage(language('common:NOT_MOD_OR_ADMIN'))

  const [id] = args

  const giveawayWithID = id
    ? await Gamer.database.models.giveaway.findOne({
        guildID: message.member.guild.id,
        giveawayID: Number(id)
      })
    : undefined

  if (giveawayWithID) {
    Gamer.database.models.giveaway.deleteOne({ _id: giveawayWithID._id }).exec()
    return sendMessage(message.channel.id, language('utility/giveawaydelete:DELETED'))
  }

  const giveaways = await Gamer.database.models.giveaway.find({
    guildID: message.member.guild.id,
    hasStarted: true,
    hasEnded: false
  })

  if (!giveaways.length) return sendMessage(message.channel.id, 'Sorry there are currently no giveaways going on.')

  let giveawayID = 0

  if (giveaways.length > 1) {
    // More than 1 giveaway found on this server
    sendMessage(
      message.channel.id,
      `There was more than 1 giveaway found on this server at this time. Please provide the giveaway ID number now. Available IDs: **${giveaways
        .map(giveaway => giveaway.giveawayID)
        .join(', ')}**`
    )
    const choiceMessage = await needMessage(message)
    const id = Number(choiceMessage.content)
    if (!id) return

    const isValidGiveaway = giveaways.find(giveaway => giveaway.giveawayID === id)
    if (!isValidGiveaway) return sendMessage(message.channel.id, 'There was no giveaway found with that ID.')

    giveawayID = id
  }

  const giveaway = giveawayID ? giveaways.find(g => g.giveawayID === giveawayID) : giveaways[0]
  if (!giveaway) return console.log('No giveaway found with the command')

  Gamer.database.models.giveaway.deleteOne({ _id: giveaway._id }).exec()

  return sendMessage(message.channel.id, language('utility/giveawaydelete:DELETED'))
})
