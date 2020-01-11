import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`divorce`, async (message, _args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.getLanguage(message.channel.guild.id)

  const marriageData = await Gamer.database.models.marriage
    .findOne()
    .or([{ authorID: message.author.id }, { spouseID: message.author.id, accepted: true }])

  // User was not married
  if (!marriageData)
    return message.channel.createMessage(language('fun/divorce:NOT_MARRIED', { mention: message.author.mention }))

  await Gamer.database.models.marriage.deleteOne({ _id: marriageData._id })

  // This is a solo marriage simulation that has not been accepted so we can simply delete
  if (marriageData.authorID === message.author.id && !marriageData.accepted)
    return message.channel.createMessage(language('fun/divorce:DIVORCED', { mention: message.author.mention }))

  // The marriage must have been accepted to reach here so we need to penalize.
  // TODO: Implement penalties once we have more ways of getting coins
  return message.channel.createMessage(language('fun/divorce:DIVORCED', { mention: message.author.mention }))
})
