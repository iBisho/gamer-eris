import { Command } from 'yuuko'
import { PrivateChannel, GroupChannel } from 'eris'
import GamerClient from '../lib/structures/GamerClient'

export default new Command(`levelrole`, async (message, args, context) => {
  const Gamer = context.client as GamerClient
  if (message.channel instanceof PrivateChannel || message.channel instanceof GroupChannel || !message.member) return

  const language = Gamer.i18n.get(Gamer.guildLanguages.get(message.channel.guild.id) || `en-US`)
  if (!language) return

  const helpCommand = Gamer.commandForName(`help`)
  if (!helpCommand) return

  const [type, number, ...roleIDsOrNames] = args
  if (!type) return helpCommand.execute(message, [`levelrole`], context)

  if (type.toLowerCase() === `list`) {
    const levelroles = await Gamer.database.models.level.find({ guildID: message.channel.guild.id })

    const guildRoles = message.channel.guild.roles

    let response = ``
    for (const level of levelroles) {
      if (response.length === 2000) break

      const roles = level.roleIDs.map(id => {
        const role = guildRoles.get(id)
        if (!role) return id
        return role.name
      })

      const text = `**#${level.level}:** ${roles.join(' ')}\n`
      if (response.length + text.length > 2000) break
      response += text
    }

    if (!response.length) return message.channel.createMessage(language(`leveling/levelrole:NONE`))
    return message.channel.createMessage(response)
  }

  const levelID = parseInt(number, 10)
  if (!levelID) return helpCommand.execute(message, [`levelrole`], context)

  const guild = message.channel.guild

  const roleIDs = message.roleMentions
  for (const id of roleIDsOrNames) {
    const role =
      message.channel.guild.roles.get(id) ||
      message.channel.guild.roles.find(r => r.name.toLowerCase() === id.toLowerCase())
    if (role) roleIDs.push(role.id)
  }

  // If no roles were provided then send help command
  if (['create', 'add', 'remove'].includes(type.toLowerCase()) && !roleIDs.length)
    return helpCommand.execute(message, [`levelrole`], context)

  const levelRoleData = await Gamer.database.models.level.findOne({
    guildID: message.channel.guild.id,
    level: levelID
  })

  switch (type.toLowerCase()) {
    case `create`:
      if (levelRoleData) return message.channel.createMessage(language(`leveling/levelrole:EXISTS`))
      await Gamer.database.models.level.create({
        level: levelID,
        roleIDs,
        guildID: guild.id,
        authorID: message.author.id
      })
      return message.channel.createMessage(language(`leveling/levelrole:CREATED`, { level: levelID }))
    case `add`:
      if (!levelRoleData) return

      levelRoleData.roleIDs = [...levelRoleData.roleIDs, ...roleIDs]
      levelRoleData.save()
      return message.channel.createMessage(language(`leveling/levelrole:ROLES_ADDED`))
    case `remove`:
      if (!levelRoleData) return

      levelRoleData.roleIDs = levelRoleData.roleIDs.filter(id => !roleIDs.includes(id))
      levelRoleData.save()
      return message.channel.createMessage(language(`leveling/levelrole:ROLES_REMOVED`))
    case `delete`:
      if (!levelRoleData) return

      await Gamer.database.models.level.deleteOne({ _id: levelRoleData._id })
      return message.channel.createMessage(language(`leveling/levelrole:DELETED`, { number: levelRoleData.level }))
  }

  return helpCommand.execute(message, [`levelrole`], context)
})
