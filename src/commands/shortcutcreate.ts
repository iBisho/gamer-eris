import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command([`shortcutcreate`, `scc`], async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel) return

  const helpCommand = Gamer.commandForName('help')
  if (!helpCommand) return

  if (!args.length) return helpCommand.process(message, [`shortcutcreate`], context)

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const guildSettings = await Gamer.database.models.guild.findOne({
    id: message.channel.guild.id
  })

  // If the user is not an admin cancel out
  if (!Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)) return

  let deleteTrigger = false
  const [trigger] = args
  if (trigger.toLowerCase() === 'deletetrigger') {
    args.shift()
    deleteTrigger = true
  }

  const [name] = args
  if (!name) return helpCommand.process(message, [`shortcutcreate`], context)
  // Remove the shortcut name so first item is the command name
  args.shift()

  const shortcut = await Gamer.database.models.shortcut.findOne({
    guildID: message.channel.guild.id,
    name: name.toLowerCase()
  })
  if (shortcut) return message.channel.createMessage(language(`shortcutcreate:NAME_TAKEN`, { name }))

  // This split with | allows users to make multiple commands run back to back
  const splitOptions = args.join(' ').split('|')

  const actions = splitOptions.map(action => {
    // The first will always need to be a command name and the rest are the args
    const [commandName, ...args] = action.trim().split(` `)
    // toString converts like #channel or @role mentions into the string version so we can save in db
    return { command: commandName, args: args.map(a => a.toString()) }
  })

  const payload = {
    actions,
    authorID: message.author.id,
    deleteTrigger,
    guildID: message.channel.guild.id,
    name
  }

  await Gamer.database.models.shortcut.create(payload)

  return message.channel.createMessage(language(`shortcuts/shortcutcreate:CREATED`, { name }))
})
