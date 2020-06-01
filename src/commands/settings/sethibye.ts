import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command(`sethibye`, async (message, args, context) => {
  if (!message.guildID || !message.member) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const guildSettings =
    (await Gamer.database.models.guild.findOne({ id: message.guildID })) ||
    (await Gamer.database.models.guild.create({ id: message.member.guild.id }))

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isModOrAdmin(message, guildSettings)) return

  const [type, subtype, ...text] = args
  if (!type || !subtype) return helpCommand.execute(message, [`sethibye`], { ...context, commandName: 'help' })

  const welcome = type.toLowerCase() === 'welcome'

  switch (subtype.toLowerCase()) {
    case `channel`:
      const [channelID] = message.channelMentions
      if (welcome) guildSettings.hibye.welcome.channelID = channelID
      else guildSettings.hibye.goodbye.channelID = channelID
      guildSettings.save()

      const response = welcome
        ? channelID
          ? `settings/sethibye:WELCOME_CHANNEL_SET`
          : `settings/sethibye:WELCOME_CHANNEL_RESET`
        : channelID
        ? `settings/sethibye:GOODBYE_CHANNEL_SET`
        : `settings/sethibye:GOODBYE_CHANNEL_RESET
        `
      return message.channel.createMessage(language(response))
    case `dm`:
      if (welcome) guildSettings.hibye.welcome.dmEnabled = !guildSettings.hibye.welcome.dmEnabled
      else guildSettings.hibye.goodbye.dmEnabled = !guildSettings.hibye.goodbye.dmEnabled

      guildSettings.save()

      return message.channel.createMessage(
        language(
          welcome
            ? guildSettings.hibye.welcome.dmEnabled
              ? `settings/sethibye:WELCOME_DM_ENABLED`
              : `settings/sethibye:WELCOME_DM_DISABLED`
            : guildSettings.hibye.goodbye.dmEnabled
            ? `settings/sethibye:GOODBYE_DM_ENABLED`
            : `settings/sethibye:GOODBYE_DM_DISABLED`
        )
      )
    case `message`:
      if (!text.length) return message.channel.createMessage(language(`settings/sethibye:NEED_MESSAGE`))

      if (welcome) guildSettings.hibye.welcome.message = text.join(' ')
      else guildSettings.hibye.goodbye.message = text.join(' ')

      guildSettings.save()
      return message.channel.createMessage(
        language(welcome ? `settings/sethibye:WELCOME_MESSAGE_SET` : `settings/sethibye:GOODBYE_MESSAGE_SET`)
      )
    default:
      return
  }
})
