import { Command } from 'yuuko'
import { GuildSettings, UserSettings } from '../lib/types/settings'
import { PrivateChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'
import constants from '../constants'

export default new Command([`background`, `bg`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || !message.member) return

  const guildSettings = (await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })) as GuildSettings | null

  const userSettings = ((await Gamer.database.models.user.findOne({
    id: message.author.id
  })) || new Gamer.database.models.user({ userID: message.author.id })) as UserSettings

  const language = Gamer.i18n.get(guildSettings ? guildSettings.language : `en-US`)
  if (!language) return

  const [type, id, color] = args

  const theme = color.toLowerCase() === `black` ? `black` : `white`
  // If the user try dark theme but are not vip cancel out
  if (theme === `black` && !userSettings.vip.isVIP)
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
        return message.channel.createMessage(language(`leveling/background:INVALID`, { id }))
      // If there was no theme or differnet theme but a valid id was provided just save the id
      if (!theme || theme === userSettings.profile.theme) {
        userSettings.profile.backgroundID = backgroundID
        userSettings.save()
        return message.channel.createMessage(language(`leveling/background:SAVED`))
      }
      // Update the theme and id
      userSettings.profile.backgroundID = backgroundID
      userSettings.profile.theme = theme
      userSettings.save()
      return message.channel.createMessage(language(`leveling/background:SAVED`))
    case `view`:
      const buffer = await Gamer.helpers.profiles.makeCanvas(message, message.member, Gamer, {
        backgroundID,
        style: theme
      })
      if (!buffer) return
      return message.channel.createMessage(``, { file: buffer, name: `profile.jpg` })
  }

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return
  return helpCommand.execute(message, [`background`], context)
})
