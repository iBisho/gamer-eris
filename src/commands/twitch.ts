import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`twitch`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const [type, username, game] = args
  if (!type || !username) return helpCommand.execute(message, [`twitch`], context)

  // Fetch this username from subscriptions specifically for twitch
  const userSubscription = await Gamer.database.models.subscription.findOne({
    username,
    type: `twitch`
  })
  const subPayload = {
    game: game?.toLowerCase() ?? null,
    guildID: message.channel.guild.id,
    channelID: message.channel.id
  }

  switch (type.toLowerCase()) {
    case `subscribe`:
      // If it does not exist create a new subscription for the user
      if (!userSubscription) {
        const payload = {
          username,
          type: `twitch`,
          subs: [subPayload]
        }

        await Gamer.database.models.subscription.create(payload)

        return message.channel.createMessage(
          language(`gaming/twitch:SUBSCRIBED`, { username, channel: message.channel.mention })
        )
      }
      // The user already has a subscription created for twitch we only need to add a sub to it
      const subscription = userSubscription.subs.find(sub => sub.channelID === message.channel.id)
      if (subscription) return message.channel.createMessage(language(`gaming/twitch:ALREADY_SUBBED`, { username }))

      userSubscription.subs.push(subPayload)
      userSubscription.save()

      return message.channel.createMessage(
        language(`gaming/twitch:SUBSCRIBED`, { username, channel: message.channel.mention })
      )
    case `unsubscribe`:
      // If the user tries to remove a sub but this username has no existing subscriptions
      if (!userSubscription)
        return message.channel.createMessage(language(`gaming/twitch:NOT_SUBSCRIBED`, { username }))

      // If the username does have a subscription BUT he wasnt subscribed to get alerts in this channel
      const relevantSubscription = userSubscription.subs.find(sub => sub.channelID === message.channel.id)
      if (!relevantSubscription)
        return message.channel.createMessage(language(`gaming/twitch:NOT_SUBBED`, { username }))

      userSubscription.subs = userSubscription.subs.filter(sub => sub.channelID !== message.channel.id)
      userSubscription.save()

      return message.channel.createMessage(language(`gaming/twitch:UNSUBBED`, { username }))
  }
  return helpCommand.execute(message, [`twitch`], context)
})
