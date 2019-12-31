import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'
import config from '../../config'

export default new Command([`background`, `bg`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const userSettings =
    (await Gamer.database.models.user.findOne({ userID: message.author.id })) ||
    (await Gamer.database.models.user.create({ userID: message.author.id }))

  const [type, id, color] = args

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const profileCommand = Gamer.commandForName(`profile`)
  if (!profileCommand) return

  if (!type || !id) return helpCommand.process(message, [`background`], context)

  const theme = color && color.toLowerCase() === `black` ? `black` : `white`
  // If the user try dark theme but are not vip cancel out
  if (theme === `black` && !userSettings.vip.isVIP && !config.staff.developers.includes(message.author.id))
    return message.channel.createMessage(language(`leveling/background:VIP_THEME`))
  // Convert the string id into a number
  const backgroundID = parseInt(id, 10)

  switch (type.toLowerCase()) {
    case `set`:
      if (!id) break
      // If the input was invalid send break the switch to send the help command
      if (isNaN(backgroundID)) break
      // If the id is an invalid background send the user a link to the wiki page to find a valid id
      if (!constants.profiles.backgrounds.find(bg => bg.id === backgroundID))
        return Gamer.helpers.discord.embedResponse(message, language(`leveling/background:INVALID`, { id }))

      // If there was no theme or differnet theme but a valid id was provided just save the id
      if (!theme || theme === userSettings.profile.theme) {
        userSettings.profile.backgroundID = backgroundID
        message.channel.createMessage(language(`leveling/background:SAVED`))
        await userSettings.save()
        profileCommand.process(message, [], context)
        return Gamer.helpers.levels.completeMission(message.member, `background`, message.channel.guild.id)
      }
      // Update the theme and id
      userSettings.profile.backgroundID = backgroundID
      userSettings.profile.theme = theme
      message.channel.createMessage(language(`leveling/background:SAVED`))
      await userSettings.save()

      profileCommand.process(message, [], context)
      return Gamer.helpers.levels.completeMission(message.member, `background`, message.channel.guild.id)
    case `view`:
      const buffer = await Gamer.helpers.profiles.makeCanvas(message, message.member, Gamer, {
        backgroundID,
        style: theme
      })
      if (!buffer) return
      message.channel.createMessage(``, { file: buffer, name: `profile.jpg` })
      return Gamer.helpers.levels.completeMission(message.member, `background`, message.channel.guild.id)
  }

  return helpCommand.process(message, [`background`], context)
})
