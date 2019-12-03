import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel, GroupChannel } from 'eris'
import constants from '../constants'

export default new Command([`vipregister`, `vipr`], async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const gamerGuild = Gamer.guilds.get(constants.general.gamerServerID)
  if (!gamerGuild) return

  const gamerMember = gamerGuild.members.get(message.author.id)
  if (!gamerMember) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  // User is not a server booster trying to use a vip only command
  if (!gamerMember.roles.includes(constants.general.nitroBoosterRoleID))
    return message.channel.createMessage(language(`vip/vipregister:MISSING_BOOST_ROLE`))

  const userSettings =
    (await Gamer.database.models.user.findOne({
      userID: message.author.id
    })) ||
    (await Gamer.database.models.user.create({
      userID: message.author.id
    }))

  // They have already registered a VIP server.
  if (userSettings.vip.guildsRegistered.length)
    return message.channel.createMessage(language(`vip/vipregister:ALREADY_VIP`))

  const guildSettings =
    (await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) ||
    (await Gamer.database.models.guild.create({ id: message.channel.guild.id }))

  if (guildSettings.vip.isVIP) return message.channel.createMessage('5')

  guildSettings.vip.isVIP = true
  guildSettings.vip.registeredAt = message.timestamp
  guildSettings.vip.userID = message.author.id
  guildSettings.save()

  userSettings.vip.guildsRegistered.push(message.channel.guild.id)
  userSettings.save()

  return message.channel.createMessage(language(`vip/vipregister:REGISTERED_VIP`))
})
