import { Command } from 'yuuko'
import GamerClient from '../lib/structures/GamerClient'
import { PrivateChannel } from 'eris'
import constants from '../constants'
import { UserSettings, GuildSettings } from '../lib/types/settings'

export default new Command([`vipregister`, `vipr`], async (message, _args, context) => {
  if (message.channel instanceof PrivateChannel || !message.member) return

  const Gamer = context.client as GamerClient

  const gamerGuild = Gamer.guilds.get(constants.general.gamerServerID)
  if (!gamerGuild) return

  const gamerMember = gamerGuild.members.get(message.author.id)
  if (!gamerMember) return

  // User is not a server booster trying to use a vip only command
  if (!gamerMember.roles.includes(constants.general.nitroBoosterRoleID)) return

  const userSettings = (await Gamer.database.models.user.findOne({
    userID: message.author.id
  })) as UserSettings | null
  if (!userSettings) return

  // They have already registered a VIP server.
  if (userSettings.vip.guildsRegistered.length) return

  const guildSettings = ((await Gamer.database.models.guild.findOne({ id: message.channel.guild.id })) ||
    new Gamer.database.models.guild({ id: message.channel.guild.id })) as GuildSettings

  if (guildSettings.vip.isVIP) return

  guildSettings.vip.isVIP = true
  guildSettings.vip.registeredAt = message.timestamp
  guildSettings.vip.userID = message.author.id
  guildSettings.save()

  const language = Gamer.i18n.get(guildSettings.language)
  if (!language) return

  message.channel.createMessage(language(`vip/vipregister:REGISTERED_VIP`))
})
