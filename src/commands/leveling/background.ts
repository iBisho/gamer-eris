import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'
import constants from '../../constants'
import config from '../../../config'
import { upsertUser } from '../../database/mongoHandler'

export default new Command([`background`, `bg`], async (message, args, context) => {
  if (!message.guildID) return

  const Gamer = context.client as GamerClient
  const language = Gamer.getLanguage(message.guildID)

  const userSettings = await upsertUser(message.author.id, [message.guildID])

  const [type, id, color] = args

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const profileCommand = Gamer.commandForName(`profile`)
  if (!profileCommand) return

  if (!type || !id) return helpCommand.execute(message, [`background`], { ...context, commandName: 'help' })

  const lowerColor = color?.toLowerCase()
  const theme =
    lowerColor === 'black'
      ? 'black'
      : lowerColor === 'orange'
      ? 'orange'
      : lowerColor === 'red'
      ? 'red'
      : lowerColor === 'green'
      ? 'green'
      : lowerColor === 'purple'
      ? 'purple'
      : lowerColor === 'blue'
      ? 'blue'
      : 'white'

  // If the user try dark theme but are not vip cancel out
  if (
    ['black', 'orange', 'red', 'green', 'purple', 'blue'].includes(theme) &&
    !userSettings.isVIP &&
    !config.staff.developers.includes(message.author.id)
  )
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
      if (!theme || theme === userSettings.theme) {
        userSettings.backgroundID = backgroundID
        message.channel.createMessage(language(`leveling/background:SAVED`))
        await userSettings.save()
        profileCommand.execute(message, [], { ...context, commandName: 'profile' })
        return message.member
          ? Gamer.helpers.levels.completeMission(message.member, `background`, message.guildID)
          : undefined
      }
      // Update the theme and id
      userSettings.backgroundID = backgroundID
      userSettings.theme = theme
      message.channel.createMessage(language(`leveling/background:SAVED`))
      await userSettings.save()

      profileCommand.execute(message, [], { ...context, commandName: 'profile' })
      return message.member
        ? Gamer.helpers.levels.completeMission(message.member, `background`, message.guildID)
        : undefined
    case `view`:
      if (!message.member) return

      const buffer = await Gamer.helpers.profiles.makeCanvas(message, message.member, Gamer, {
        backgroundID,
        style: theme
      })
      if (!buffer) return
      message.channel.createMessage(``, { file: buffer, name: `profile.jpg` })
      return Gamer.helpers.levels.completeMission(message.member, `background`, message.guildID)
  }

  return helpCommand.execute(message, [`background`], { ...context, commandName: 'help' })
})
