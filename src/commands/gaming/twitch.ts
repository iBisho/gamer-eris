import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import { GamerSubscriptionType } from '../../database/schemas/subscription'

export default new Command(`twitch`, async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const guildSettings = await Gamer.database.models.guild.findOne({ guildID: message.guildID })

  // If the user is not an admin/mod cancel out
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const helpCommand = Gamer.commandForName('help')
  const [type, username, ...gameName] = args
  if (!type) return helpCommand?.execute(message, [`twitch`], { ...context, commandName: 'help' })

  const language = Gamer.getLanguage(message.guildID)

  if (type && type.toLowerCase() === `list`) {
    const twitchSubs = await Gamer.database.models.subscription.find({ type: GamerSubscriptionType.TWITCH })

    let response = ``
    for (const sub of twitchSubs) {
      if (response.length === 2000) break
      const listener = sub.subs.find(s => s.guildID === message.guildID)
      if (!listener) continue

      const text = `${sub.username} <#${listener.channelID}>\n`
      if (response.length + text.length > 2000) break
      response += text
    }

    if (!response.length) return message.channel.createMessage(language(`gaming/twitch:NONE`))
    return message.channel.createMessage(response)
  }

  // Fetch this username from subscriptions specifically for twitch
  const userSubscription = await Gamer.database.models.subscription.findOne({
    username,
    type: GamerSubscriptionType.TWITCH
  })

  if (!username) return helpCommand?.execute(message, [`twitch`], { ...context, commandName: 'help' })

  const game = gameName.join(' ')
  const subPayload = {
    game: game?.toLowerCase() ?? null,
    guildID: message.guildID,
    channelID: message.channel.id
  }

  switch (type.toLowerCase()) {
    case `subscribe`:
      // If it does not exist create a new subscription for the user
      if (!userSubscription) {
        const payload = {
          username,
          type: GamerSubscriptionType.TWITCH,
          subs: [subPayload]
        }

        const sub = new Gamer.database.models.subscription(payload)
        await sub.save()

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
  return helpCommand?.execute(message, [`twitch`], { ...context, commandName: 'help' })
})
