import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'

export default new Command(`setxp`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName('help')

  const guildSettings =
    (await Gamer.database.models.guild.findOne({
      id: message.guildID
    })) || (await Gamer.database.models.guild.create({ id: message.guildID }))

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings.staff.adminRoleID)) return

  const [type, number] = args
  if (!type) return helpCommand?.execute(message, [`setxp`], { ...context, commandName: 'help' })
  const amount = parseInt(number, 10)

  // First check the menus that would not need `idea` or `bug`
  switch (type.toLowerCase()) {
    // Create the feedback system if the user types setup
    case 'message':
      if (!guildSettings?.vip.isVIP) return message.channel.createMessage(language(`settings/setxp:NEED_VIP_MESSAGE`))

      if (!amount && amount !== 0) return helpCommand?.execute(message, [`setxp`], { ...context, commandName: 'help' })

      guildSettings.xp.perMessage = amount
      guildSettings.save()
      Gamer.guildsXPPerMessage.set(message.guildID, amount)
      return message.channel.createMessage(language(`settings/setxp:PER_MESSAGE`, { amount }))
    case 'voice':
      if (!guildSettings?.vip.isVIP) return message.channel.createMessage(language(`settings/setxp:NEED_VIP_VOICE`))

      if (!amount && amount !== 0) return helpCommand?.execute(message, [`setxp`], { ...context, commandName: 'help' })

      guildSettings.xp.perMinuteVoice = amount
      guildSettings.save()
      Gamer.guildsXPPerMinuteVoice.set(message.guildID, amount)
      return message.channel.createMessage(language(`settings/setxp:PER_MINUTE`, { amount }))
    case 'inactivity':
      if (!guildSettings?.vip.isVIP)
        return message.channel.createMessage(language(`settings/setxp:NEED_VIP_INACTIVITY`))

      if (!amount && amount !== 0) return helpCommand?.execute(message, [`setxp`], { ...context, commandName: 'help' })

      guildSettings.xp.inactiveDaysAllowed = amount
      guildSettings.save()
      return message.channel.createMessage(language(`settings/setxp:INACTIVITY`, { amount }))
    case 'decay':
      if (!guildSettings.vip.isVIP)
        return message.channel.createMessage(
          language('common:NEED_VIP', { invite: constants.general.gamerServerInvite })
        )

      if (!amount) return helpCommand?.execute(message, [`setxp`], { ...context, commandName: 'help' })

      guildSettings.xp.inactivePercentage = amount
      guildSettings.save()
      return message.channel.createMessage(language('settings/setxp:DECAY', { amount }))
    case 'missions':
    case 'mission':
      guildSettings.xp.disableMissions = !Boolean(guildSettings.xp.disableMissions)
      guildSettings.save()
      return message.channel.createMessage(
        language(`settings/setxp:MISSIONS`, {
          status: language(guildSettings.xp.disableMissions ? `common:DISABLED` : `common:ENABLED`)
        })
      )
  }

  return helpCommand?.execute(message, [`setxp`], { ...context, commandName: 'help' })
})
