import { Command } from 'yuuko'
import GamerClient from '../../lib/structures/GamerClient'

export default new Command([`tagpublic`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.guildID)
  if (!args.length) return helpCommand.execute(message, [`tagpublic`], { ...context, commandName: 'help' })

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.guildID
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const guildID = message.guildID

  await Promise.all(
    args.map(async name => {
      const tag = await Gamer.database.models.tag.findOne({ name, guildID })
      if (!tag) return

      tag.isPublic = true
      tag.save()
    })
  )
  return message.channel.createMessage(language(`tags/tagpublic:EXPORTED`))
})
