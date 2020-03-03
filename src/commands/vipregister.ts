import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'

export default new Command([`vipregister`, `vipr`], async (message, _args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient

  const gamerGuild = Gamer.guilds.get(constants.general.gamerServerID)
  if (!gamerGuild) return

  const gamerMember = await Gamer.helpers.discord.fetchMember(gamerGuild, message.author.id)
  if (!gamerMember) return

  const language = Gamer.getLanguage(message.guildID)

  // User is not a server booster trying to use a vip only command
  if (!gamerMember.roles.includes(constants.general.nitroBoosterRoleID)) {
    // Check if the user has enough votes to get FREE VIP
    const upvote = await Gamer.database.models.upvote.findOne({ userID: message.author.id })
    // The user does not have nitro boost role nor enough votes
    if (!upvote || upvote.amount < 100)
      return message.channel.createMessage(language(`vip/vipregister:MISSING_BOOST_ROLE`))
  }

  const userSettings =
    (await Gamer.database.models.user.findOne({
      userID: message.author.id
    })) ||
    (await Gamer.database.models.user.create({
      userID: message.author.id
    }))

  const guildSettings =
    (await Gamer.database.models.guild.findOne({ id: message.guildID })) ||
    (await Gamer.database.models.guild.create({ id: message.guildID }))

  // They have already registered a VIP server.
  if (guildSettings.vip.isVIP) return message.channel.createMessage(language(`vip/vipregister:ALREADY_VIP`))

  guildSettings.vip.isVIP = true
  guildSettings.vip.registeredAt = message.timestamp
  guildSettings.vip.userID = message.author.id
  guildSettings.save()

  userSettings.vip.guildsRegistered.push(message.guildID)
  userSettings.vip.isVIP = true
  userSettings.save()

  return message.channel.createMessage(language(`vip/vipregister:REGISTERED_VIP`))
})
