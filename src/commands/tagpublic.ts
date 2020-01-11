import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`tagpublic`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  const language = Gamer.getLanguage(message.channel.guild.id)

  if (!args.length) return helpCommand.process(message, [`tagpublic`], context)

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  const guildID = message.channel.guild.id

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
