import { Command } from 'yuuko'
// import GamerClient from '../lib/structures/GamerClient'

export default new Command([`setpermission`, `setignore`, `setperm`], async (message, args, context) => {
  if (message || args || context) return
  // if (!message.guildID || !message.member) return

  // const Gamer = context.client as GamerClient
  // const language = Gamer.getLanguage(message.guildID)
  // const helpCommand = Gamer.commandForName('help')
  // if (!helpCommand) return

  // const guildSettings = await Gamer.database.models.guild.findOne({
  //   id: message.guildID
  // })

  // // If the user is not an admin cancel out
  // if (
  //   !Gamer.helpers.discord.isModerator(message, guildSettings?.staff.modRoleIDs) &&
  //   !Gamer.helpers.discord.isAdmin(message, guildSettings?.staff.adminRoleID)
  // )
  //   return

  // const [command, type, ...targets] = args
  // if (!command || !type) return helpCommand.process(message, [`setpermission`], context)

  // if (![`on`, `off`].includes(type.toLowerCase())) return helpCommand.process(message, [`setpermission`], context)

  // const enable = [`on`].includes(type.toLowerCase())
  // const roleID = targets.join(' ')
  // const roleIDs = [...message.roleMentions]
  // if (!roleIDs.includes(roleID) && message.member.guild.roles.has(roleID)) roleIDs.push(roleID)

  // switch (command.toLowerCase()) {
  //   case 'allcommands':
  //     const perms = await Gamer.database.models.command.findOne({
  //       name: 'allcommands',
  //       guildID: message.guildID
  //     })

  //     if (!perms) {
  //       if (enable)
  //         return message.channel.createMessage(language(`settings/setpermission:ALREADY_ENABLED_ALL_COMMANDS`))

  //       await Gamer.database.models.command.create({
  //         name: 'allcommands',
  //         guildID: message.guildID,
  //         enabled: false,
  //         exceptionChannelIDs: [],
  //         exceptionRoleIDs: []
  //       })
  //       break
  //     }

  //     if ((perms.enabled && enable) || (!perms.enabled && !enable)) {
  //       return message.channel.createMessage(language(`settings/setpermission`))
  //     }
  // }

  // await message.channel.createMessage(language(`settings/setfeedback:INVALID_USE`))

  // return helpCommand.process(message, [`setfeedback`], context)
})
